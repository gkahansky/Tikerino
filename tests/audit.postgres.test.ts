import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import {
  AUDIT_SCHEMA,
  JsonlAuditStore,
  PostgresAuditStore,
  type AuditRecord,
  type AuditStore,
} from '../server/src/audit.js';

/**
 * These run against a real Postgres, not a fake. An idempotency guarantee that
 * rests on a unique constraint is only worth what the database actually enforces,
 * so a hand-rolled double would be testing the double.
 *
 * Skipped, loudly, when TEST_DATABASE_URL is unset, so a contributor without a
 * database still gets a green suite - and never a silent pass that looked like
 * coverage.
 */
const DATABASE_URL = process.env.TEST_DATABASE_URL;
const describeIfPg = DATABASE_URL ? describe : describe.skip;

if (!DATABASE_URL) {
  console.warn('TEST_DATABASE_URL is not set: skipping the Postgres audit store tests.');
}

function record(overrides: Partial<AuditRecord> = {}): AuditRecord {
  return {
    subjectId: 'subject-1',
    exerciseId: 'ex-001',
    syntheticSeriesId: 'series-ex-001',
    scenarioSpecVersion: '1.0',
    generatorVersion: '1.0.0',
    curriculumVersion: '0.2.0',
    answer: { selectedOptionId: 'opt-a' },
    hintUsed: false,
    timeToAnswerMs: 4321,
    capturedOffline: false,
    assignmentSnapshotAt: '2026-09-12T08:00:00.000Z',
    serverReceivedAt: '2026-09-12T08:00:05.000Z',
    correct: true,
    xpTotal: 12,
    ...overrides,
  };
}

describeIfPg('PostgresAuditStore', () => {
  let pool: { query: (t: string, v?: unknown[]) => Promise<{ rows: Record<string, unknown>[] }>; end: () => Promise<void> };
  let store: PostgresAuditStore;

  beforeAll(async () => {
    const { Pool } = await import('pg');
    pool = new Pool({ connectionString: DATABASE_URL }) as never;
    store = new PostgresAuditStore(pool);
    await store.migrate();
  });

  afterAll(async () => {
    await pool.end();
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE audit_answers');
  });

  it('creates its schema idempotently, so every boot can run it', async () => {
    await expect(pool.query(AUDIT_SCHEMA)).resolves.toBeDefined();
    await expect(store.migrate()).resolves.toBeUndefined();
  });

  it('round-trips every field of a record', async () => {
    const original = record();
    await store.append(original);
    const found = await store.find(original.subjectId, original.exerciseId, original.assignmentSnapshotAt);
    expect(found).toEqual(original);
  });

  it('round-trips a pick_the_candle answer and a null series id', async () => {
    const original = record({
      exerciseId: 'ex-009',
      answer: { selectedCandleIndex: 7 },
      syntheticSeriesId: null,
      correct: false,
      xpTotal: 0,
      hintUsed: true,
      capturedOffline: true,
    });
    await store.append(original);
    expect(
      await store.find(original.subjectId, original.exerciseId, original.assignmentSnapshotAt),
    ).toEqual(original);
  });

  it('records an answer once, however many times it is resent', async () => {
    const original = record();
    await store.append(original);
    await store.append(original);
    await store.append({ ...original, xpTotal: 999, correct: false });

    expect(await store.size()).toBe(1);
    // The first write wins: a retry must not overwrite the graded result.
    const found = await store.find(original.subjectId, original.exerciseId, original.assignmentSnapshotAt);
    expect(found?.xpTotal).toBe(12);
    expect(found?.correct).toBe(true);
  });

  it('holds the idempotency line under concurrent retries', async () => {
    // The case the JSONL store could not handle: two processes, one answer.
    const original = record({ exerciseId: 'ex-003' });
    await Promise.all(Array.from({ length: 12 }, () => store.append(original)));
    expect(await store.size()).toBe(1);
  });

  it('separates the three parts of the idempotency key', async () => {
    const base = record();
    await store.append(base);
    await store.append({ ...base, subjectId: 'subject-2' });
    await store.append({ ...base, exerciseId: 'ex-002' });
    await store.append({ ...base, assignmentSnapshotAt: '2026-09-13T08:00:00.000Z' });
    expect(await store.size()).toBe(4);
  });

  it('does not collide two snapshot strings that name one instant', async () => {
    // assignment_snapshot_at is text, not timestamptz, precisely so these stay
    // distinct keys rather than being parsed into the same moment.
    const base = record();
    await store.append(base);
    await store.append({ ...base, assignmentSnapshotAt: '2026-09-12T08:00:00Z' });
    expect(await store.size()).toBe(2);
  });

  it('reports an empty store as zero rather than throwing', async () => {
    expect(await store.size()).toBe(0);
    expect(await store.find('nobody', 'ex-001', '2026-09-12T08:00:00.000Z')).toBeUndefined();
  });

  it('makes POST /api/answers idempotent through the real request path', async () => {
    // The store tests above prove the constraint. This proves the server is
    // actually going through it - that the swap reaches the endpoint a learner
    // hits, not just the class.
    const { buildApp } = await import('../server/src/app.js');
    const app = buildApp({ auditStore: store });
    await app.ready();

    const key = {
      subjectId: 'through-the-server',
      exerciseId: 'ex-003',
      hintUsed: false,
      timeToAnswerMs: 5_000,
      capturedOffline: false,
      assignmentSnapshotAt: '2026-09-12T09:00:00.000Z',
    };
    const submit = (answer: unknown) =>
      app.inject({ method: 'POST', url: '/api/answers', payload: { ...key, answer } });

    const first = (await submit({ selectedOptionId: 'b' })).json() as {
      correct: boolean;
      xp: { total: number };
    };

    // A retry carrying a DIFFERENT answer must replay the recorded result.
    const retry = (await submit({ selectedOptionId: 'a' })).json() as {
      correct: boolean;
      xp: { total: number };
    };

    expect(retry.correct).toBe(first.correct);
    expect(retry.xp.total).toBe(first.xp.total);
    expect(await store.size()).toBe(1);

    await app.close();
  });

  it('matches the JSONL store it replaces, record for record', async () => {
    // Both stores are fed the same answers and must agree. This is what makes the
    // swap a deployment choice rather than a behaviour change.
    const jsonl: AuditStore = new JsonlAuditStore(join(mkdtempSync(join(tmpdir(), 'tik-')), 'audit.jsonl'));
    const answers = [
      record(),
      record({ exerciseId: 'ex-002', answer: { selectedCandleIndex: 3 }, correct: false, xpTotal: 0 }),
      record({ subjectId: 'subject-2', hintUsed: true }),
      record(), // a duplicate, which both must ignore
    ];

    for (const answer of answers) {
      await jsonl.append(answer);
      await store.append(answer);
    }

    expect(await store.size()).toBe(await jsonl.size());
    for (const answer of answers) {
      expect(await store.find(answer.subjectId, answer.exerciseId, answer.assignmentSnapshotAt)).toEqual(
        await jsonl.find(answer.subjectId, answer.exerciseId, answer.assignmentSnapshotAt),
      );
    }
  });
});
