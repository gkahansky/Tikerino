import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname } from 'node:path';

import pg from 'pg';

import type { AnswerPayload } from '@tikerino/grading';

/**
 * One record per graded answer, exactly the fields listed in engine+grading spec
 * section 6.2.
 *
 * The record holds the full audit identity of the chart (syntheticSeriesId,
 * scenarioSpecVersion, generatorVersion, curriculumVersion) so any answer can be
 * replayed bit-for-bit years later.
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
 * The idempotency index over every recorded answer, with two persistence
 * backends:
 *
 * - **File** (local dev and the test suites): one JSONL line per answer,
 *   replayed into memory at boot. Sync throughout, which is what the tests and
 *   `npm run dev` rely on.
 * - **Postgres** (deployed): the same records in an `audit_records` table, the
 *   whole record stored as JSONB next to the three idempotency-key columns.
 *   The unique constraint on those columns is the database-level guard against
 *   a double-counted answer; the in-memory index is rebuilt from the table at
 *   boot, exactly as the file backend replays the JSONL.
 *
 * The backend is chosen by the entrypoint: DATABASE_URL set means Postgres,
 * unset means the file. Nothing else in the server knows which is in use.
 */
export class AuditLog {
  private readonly seen = new Map<string, AuditRecord>();

  private constructor(
    private readonly path: string | null,
    private readonly pool: pg.Pool | null,
  ) {}

  /** File-backed log (default): sync, replayed from disk at boot. */
  static fromFile(path: string): AuditLog {
    mkdirSync(dirname(path), { recursive: true });
    const log = new AuditLog(path, null);
    log.replay();
    return log;
  }

  /**
   * Postgres-backed log (deployed): creates the table when absent, then loads
   * every recorded answer into the idempotency index, so a restart cannot
   * double-count an answer a learner already submitted.
   */
  static async fromPostgres(connectionString: string): Promise<AuditLog> {
    const pool = new pg.Pool({
      connectionString,
      // The platform's private (*.internal) Postgres endpoint is plaintext;
      // anything reached over a public hostname goes over TLS.
      ssl: connectionString.includes('.internal') ? false : { rejectUnauthorized: true },
    });
    await pool.query(`
      CREATE TABLE IF NOT EXISTS audit_records (
        id BIGSERIAL PRIMARY KEY,
        subject_id TEXT NOT NULL,
        exercise_id TEXT NOT NULL,
        assignment_snapshot_at TEXT NOT NULL,
        record JSONB NOT NULL,
        UNIQUE (subject_id, exercise_id, assignment_snapshot_at)
      )
    `);
    const log = new AuditLog(null, pool);
    const { rows } = await pool.query<{ record: AuditRecord }>(
      'SELECT record FROM audit_records ORDER BY id',
    );
    for (const { record } of rows) {
      log.seen.set(
        idempotencyKey(record.subjectId, record.exerciseId, record.assignmentSnapshotAt),
        record,
      );
    }
    return log;
  }

  /**
   * Rebuild the idempotency index from the file at boot, so a restart cannot
   * double-count an answer a learner already submitted.
   */
  private replay(): void {
    if (!this.path || !existsSync(this.path)) return;
    const lines = readFileSync(this.path, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        const record = JSON.parse(trimmed) as AuditRecord;
        this.seen.set(
          idempotencyKey(record.subjectId, record.exerciseId, record.assignmentSnapshotAt),
          record,
        );
      } catch {
        // A truncated final line (killed mid-write) must not stop the server.
      }
    }
  }

  find(subjectId: string, exerciseId: string, assignmentSnapshotAt: string): AuditRecord | undefined {
    return this.seen.get(idempotencyKey(subjectId, exerciseId, assignmentSnapshotAt));
  }

  /**
   * Record an answer. Synchronous for the file backend; a Promise for
   * Postgres, which the answer route awaits before replying, so a confirmed
   * answer is a persisted answer.
   */
  append(record: AuditRecord): void | Promise<void> {
    const key = idempotencyKey(record.subjectId, record.exerciseId, record.assignmentSnapshotAt);
    if (this.seen.has(key)) return;
    if (this.pool) return this.appendPostgres(record, key);
    appendFileSync(this.path!, `${JSON.stringify(record)}\n`, 'utf8');
    this.seen.set(key, record);
  }

  private async appendPostgres(record: AuditRecord, key: string): Promise<void> {
    // ON CONFLICT is the database-level idempotency guard: a concurrent retry
    // racing the in-memory check inserts nothing and is still correct.
    await this.pool!.query(
      `INSERT INTO audit_records (subject_id, exercise_id, assignment_snapshot_at, record)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (subject_id, exercise_id, assignment_snapshot_at) DO NOTHING`,
      [record.subjectId, record.exerciseId, record.assignmentSnapshotAt, JSON.stringify(record)],
    );
    this.seen.set(key, record);
  }

  get size(): number {
    return this.seen.size;
  }
}
