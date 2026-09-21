import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

import type { AnswerPayload } from '@tikerino/grading';

/**
 * One record per graded answer, exactly the fields listed in engine+grading spec
 * section 6.2.
 *
 * The record holds the full audit identity of the chart (syntheticSeriesId,
 * scenarioSpecVersion, generatorVersion, curriculumVersion) so any answer can be
 * replayed bit-for-bit years later. That is the whole point of it: this is not a
 * log, it is the evidence that a grade was correct.
 */
export interface AuditRecord {
  subjectId: string;
  exerciseId: string;
  syntheticSeriesId: string | null;
  scenarioSpecVersion: string;
  generatorVersion: string;
  curriculumVersion: string;
  answer: AnswerPayload;
  hintUsed: boolean;
  timeToAnswerMs: number;
  capturedOffline: boolean;
  assignmentSnapshotAt: string;
  serverReceivedAt: string;
  correct: boolean;
  xpTotal: number;
}

/** Idempotency key, spec section 6.2. */
export function idempotencyKey(
  subjectId: string,
  exerciseId: string,
  assignmentSnapshotAt: string,
): string {
  return `${subjectId} ${exerciseId} ${assignmentSnapshotAt}`;
}

/**
 * Both stores are async, including the file one that has no need to be. A store
 * whose interface changed shape depending on the backing would push that choice
 * out into every caller; this way the server is written once against the slower
 * of the two, and Postgres is a deployment decision rather than a code path.
 */
export interface AuditStore {
  find(
    subjectId: string,
    exerciseId: string,
    assignmentSnapshotAt: string,
  ): Promise<AuditRecord | undefined>;
  append(record: AuditRecord): Promise<void>;
  size(): Promise<number>;
  close(): Promise<void>;
}

/* -------------------------------------------------------------------------- */
/* JSONL                                                                       */
/* -------------------------------------------------------------------------- */

/**
 * The spec's day-one store: one JSON object per line, appended.
 *
 * Still the default when no DATABASE_URL is set, so `npm run dev`, the browser
 * suites and CI all run without a database. It is not what a deployment should
 * use: it holds the idempotency index in memory, which makes it single-process
 * by construction.
 */
export class JsonlAuditStore implements AuditStore {
  private readonly path: string;
  private readonly seen = new Map<string, AuditRecord>();

  constructor(path: string) {
    this.path = path;
    mkdirSync(dirname(path), { recursive: true });
    this.replay();
  }

  /**
   * Rebuild the idempotency index from the file at boot, so a restart cannot
   * double-count an answer a learner already submitted.
   */
  private replay(): void {
    for (const record of this.readAll()) {
      this.seen.set(
        idempotencyKey(record.subjectId, record.exerciseId, record.assignmentSnapshotAt),
        record,
      );
    }
  }

  /** Every record on disk, oldest first. Also what the migration reads. */
  readAll(): AuditRecord[] {
    if (!existsSync(this.path)) return [];
    return readFileSync(this.path, 'utf8')
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .flatMap((line) => {
        try {
          return [JSON.parse(line) as AuditRecord];
        } catch {
          // A truncated final line (killed mid-write) must not stop the server.
          return [];
        }
      });
  }

  async find(
    subjectId: string,
    exerciseId: string,
    assignmentSnapshotAt: string,
  ): Promise<AuditRecord | undefined> {
    return this.seen.get(idempotencyKey(subjectId, exerciseId, assignmentSnapshotAt));
  }

  async append(record: AuditRecord): Promise<void> {
    const key = idempotencyKey(record.subjectId, record.exerciseId, record.assignmentSnapshotAt);
    if (this.seen.has(key)) return;
    appendFileSync(this.path, `${JSON.stringify(record)}\n`, 'utf8');
    this.seen.set(key, record);
  }

  async size(): Promise<number> {
    return this.seen.size;
  }

  async close(): Promise<void> {}
}

/* -------------------------------------------------------------------------- */
/* Postgres                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * The schema is the idempotency rule.
 *
 * The JSONL store enforced (subjectId, exerciseId, assignmentSnapshotAt) in a
 * Map it rebuilt by reading the whole file at boot - correct only while exactly
 * one process is writing. Here the same rule is a unique constraint the database
 * enforces, so two servers racing on a resent offline answer cannot both record
 * it, and there is no startup scan.
 *
 * The answer payload stays JSONB rather than being flattened into columns: it is
 * a discriminated union (selectedOptionId | selectedCandleIndex), and the value
 * of an audit record is reproducing exactly what was submitted.
 *
 * assignment_snapshot_at is text, not timestamptz, on purpose. It is an
 * idempotency key supplied by the client and compared for equality; parsing it
 * into a timestamp would let two distinct strings collide on one instant.
 */
export const AUDIT_SCHEMA = `
CREATE TABLE IF NOT EXISTS audit_answers (
  id                     bigserial PRIMARY KEY,
  subject_id             text        NOT NULL,
  exercise_id            text        NOT NULL,
  assignment_snapshot_at text        NOT NULL,
  synthetic_series_id    text,
  scenario_spec_version  text        NOT NULL,
  generator_version      text        NOT NULL,
  curriculum_version     text        NOT NULL,
  answer                 jsonb       NOT NULL,
  hint_used              boolean     NOT NULL,
  time_to_answer_ms      integer     NOT NULL,
  captured_offline       boolean     NOT NULL,
  server_received_at     timestamptz NOT NULL,
  correct                boolean     NOT NULL,
  xp_total               integer     NOT NULL,
  CONSTRAINT audit_answers_idempotency
    UNIQUE (subject_id, exercise_id, assignment_snapshot_at)
);
DO $$ BEGIN
  IF to_regclass('public.audit_records') IS NOT NULL THEN
    INSERT INTO audit_answers(subject_id,exercise_id,assignment_snapshot_at,synthetic_series_id,scenario_spec_version,generator_version,curriculum_version,answer,hint_used,time_to_answer_ms,captured_offline,server_received_at,correct,xp_total)
    SELECT record->>'subjectId',record->>'exerciseId',record->>'assignmentSnapshotAt',record->>'syntheticSeriesId',record->>'scenarioSpecVersion',record->>'generatorVersion',record->>'curriculumVersion',record->'answer',coalesce((record->>'hintUsed')::boolean,false),coalesce((record->>'timeToAnswerMs')::integer,0),coalesce((record->>'capturedOffline')::boolean,false),(record->>'serverReceivedAt')::timestamptz,(record->>'correct')::boolean,(record->>'xpTotal')::integer FROM audit_records ON CONFLICT DO NOTHING;
  END IF;
END $$;
`;

/** The slice of a pg Pool this module uses, so the store is trivially fakeable. */
export interface QueryablePool {
  query(text: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[] }>;
  end(): Promise<void>;
}

interface AuditRow {
  subject_id: string;
  exercise_id: string;
  assignment_snapshot_at: string;
  synthetic_series_id: string | null;
  scenario_spec_version: string;
  generator_version: string;
  curriculum_version: string;
  answer: AnswerPayload;
  hint_used: boolean;
  time_to_answer_ms: number;
  captured_offline: boolean;
  server_received_at: Date | string;
  correct: boolean;
  xp_total: number;
}

function toRecord(row: AuditRow): AuditRecord {
  return {
    subjectId: row.subject_id,
    exerciseId: row.exercise_id,
    assignmentSnapshotAt: row.assignment_snapshot_at,
    syntheticSeriesId: row.synthetic_series_id,
    scenarioSpecVersion: row.scenario_spec_version,
    generatorVersion: row.generator_version,
    curriculumVersion: row.curriculum_version,
    answer: row.answer,
    hintUsed: row.hint_used,
    timeToAnswerMs: row.time_to_answer_ms,
    capturedOffline: row.captured_offline,
    // Back out as ISO 8601, the shape the spec and the JSONL store both use.
    serverReceivedAt:
      row.server_received_at instanceof Date
        ? row.server_received_at.toISOString()
        : new Date(row.server_received_at).toISOString(),
    correct: row.correct,
    xpTotal: row.xp_total,
  };
}

const SELECT_COLUMNS = `
  subject_id, exercise_id, assignment_snapshot_at, synthetic_series_id,
  scenario_spec_version, generator_version, curriculum_version, answer,
  hint_used, time_to_answer_ms, captured_offline, server_received_at,
  correct, xp_total
`;

export class PostgresAuditStore implements AuditStore {
  private readonly pool: QueryablePool;

  constructor(pool: QueryablePool) {
    this.pool = pool;
  }

  /** Idempotent, so it is safe on every boot and from every replica. */
  async migrate(): Promise<void> {
    await this.pool.query(AUDIT_SCHEMA);
  }

  async find(
    subjectId: string,
    exerciseId: string,
    assignmentSnapshotAt: string,
  ): Promise<AuditRecord | undefined> {
    const { rows } = await this.pool.query(
      `SELECT ${SELECT_COLUMNS} FROM audit_answers
        WHERE subject_id = $1 AND exercise_id = $2 AND assignment_snapshot_at = $3`,
      [subjectId, exerciseId, assignmentSnapshotAt],
    );
    const row = rows[0] as AuditRow | undefined;
    return row ? toRecord(row) : undefined;
  }

  /**
   * ON CONFLICT DO NOTHING rather than read-then-write: the check and the insert
   * are one statement, so a retry arriving while the first is still in flight
   * cannot slip between them and double-count.
   */
  async append(record: AuditRecord): Promise<void> {
    await this.pool.query(
      `INSERT INTO audit_answers (
         subject_id, exercise_id, assignment_snapshot_at, synthetic_series_id,
         scenario_spec_version, generator_version, curriculum_version, answer,
         hint_used, time_to_answer_ms, captured_offline, server_received_at,
         correct, xp_total
       ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       ON CONFLICT ON CONSTRAINT audit_answers_idempotency DO NOTHING`,
      [
        record.subjectId,
        record.exerciseId,
        record.assignmentSnapshotAt,
        record.syntheticSeriesId,
        record.scenarioSpecVersion,
        record.generatorVersion,
        record.curriculumVersion,
        JSON.stringify(record.answer),
        record.hintUsed,
        record.timeToAnswerMs,
        record.capturedOffline,
        record.serverReceivedAt,
        record.correct,
        record.xpTotal,
      ],
    );
  }

  async size(): Promise<number> {
    const { rows } = await this.pool.query('SELECT count(*)::int AS n FROM audit_answers');
    return (rows[0]?.n as number) ?? 0;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}
