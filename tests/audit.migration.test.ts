import pg from 'pg';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { PostgresAuditStore, type AuditRecord } from '../server/src/audit.js';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error - the migration is a plain .mjs script, imported here for its mapping rule.
import { mapAuditRecords, REQUIRED_FIELDS } from '../scripts/migrate-audit-records-to-answers.mjs';

/**
 * The migration that carries production's audit log into this repository's
 * schema. Production keeps the identity in a `record` JSONB column; `main` keeps
 * it in typed columns, and the two tables can sit in one database without either
 * one noticing - which is exactly how a deploy could orphan every live record.
 *
 * Run against a real Postgres for the same reason the store tests are: the
 * guarantee being migrated is a unique constraint, and a double would be testing
 * the double. Skipped loudly without TEST_DATABASE_URL.
 */
const DATABASE_URL = process.env.TEST_DATABASE_URL;
const describeIfPg = DATABASE_URL ? describe : describe.skip;

if (!DATABASE_URL) {
  console.warn('TEST_DATABASE_URL is not set: skipping the Postgres audit store tests.');
}

/** A row as production stores it: the whole record in one JSONB column. */
function productionRow(overrides: Partial<AuditRecord> = {}, index = 1) {
  return {
    record: {
      subjectId: `subject-${index}`,
      exerciseId: `ex-${String(index).padStart(3, '0')}`,
      syntheticSeriesId: `cp0.1/ex-${String(index).padStart(3, '0')}`,
      scenarioSpecVersion: '1.0',
      generatorVersion: '1.0.0',
      curriculumVersion: '0.2.0',
      answer: { selectedOptionId: 'a' },
      hintUsed: false,
      timeToAnswerMs: 4200,
      capturedOffline: false,
      assignmentSnapshotAt: `2026-09-12T20:${String(index).padStart(2, '0')}:00.000Z`,
      serverReceivedAt: `2026-09-12T20:${String(index).padStart(2, '0')}:05.000Z`,
      correct: true,
      xpTotal: 12,
      ...overrides,
    },
  };
}

describe('the production record mapping', () => {
  it('carries a complete record through unchanged', () => {
    const { records, rejected } = mapAuditRecords([productionRow()]);
    expect(rejected).toEqual([]);
    expect(records[0]).toMatchObject({ exerciseId: 'ex-001', xpTotal: 12, correct: true });
  });

  it('accepts a JSONB column that arrives as a string', () => {
    const row = productionRow();
    const { records } = mapAuditRecords([{ record: JSON.stringify(row.record) }]);
    expect(records[0]?.exerciseId).toBe('ex-001');
  });

  it('normalises the chartless exercises to a null series id rather than dropping them', () => {
    // Vocabulary exercises have no chart, so they have no series to replay.
    const { records, rejected } = mapAuditRecords([
      productionRow({ syntheticSeriesId: undefined as unknown as string }),
    ]);
    expect(rejected).toEqual([]);
    expect(records[0]?.syntheticSeriesId).toBeNull();
  });

  it.each(REQUIRED_FIELDS as string[])(
    'refuses a record missing %s, because it could not be replayed',
    (field) => {
      const row = productionRow();
      delete (row.record as Record<string, unknown>)[field];
      const { records, rejected } = mapAuditRecords([row]);
      expect(records).toEqual([]);
      expect(rejected[0]?.missing).toContain(field);
    },
  );

  it('rejects the bad rows and keeps the good ones distinguishable', () => {
    const good = productionRow({}, 1);
    const bad = productionRow({}, 2);
    delete (bad.record as Record<string, unknown>).correct;
    const { records, rejected } = mapAuditRecords([good, bad]);
    expect(records).toHaveLength(1);
    expect(rejected).toEqual([{ index: 1, missing: ['correct'] }]);
  });
});

/**
 * Its own schema, not the public one.
 *
 * tests/audit.postgres.test.ts TRUNCATEs audit_answers between its own tests,
 * and vitest runs test files in parallel - so two files sharing one table wipe
 * each other's rows, and the counts each one asserts become whatever the other
 * file happened to be doing at that moment. It passes locally and fails in CI,
 * which is the worst version of that bug. A schema of its own costs one CREATE
 * and makes the isolation structural rather than lucky.
 */
const TEST_SCHEMA = 'tikerino_migration_test';

describeIfPg('migrating production rows into audit_answers', () => {
  const admin = new pg.Pool({ connectionString: DATABASE_URL });
  // search_path is per connection, so it goes on the pool: every connection it
  // hands out resolves audit_answers to this schema's copy.
  const pool = new pg.Pool({
    connectionString: DATABASE_URL,
    options: `-c search_path=${TEST_SCHEMA}`,
  });
  const store = new PostgresAuditStore(pool);

  beforeAll(async () => {
    await admin.query(`CREATE SCHEMA IF NOT EXISTS ${TEST_SCHEMA}`);
    await store.migrate();
  });

  beforeEach(async () => {
    await pool.query('TRUNCATE audit_answers');
  });

  afterAll(async () => {
    await store.close();
    await admin.query(`DROP SCHEMA IF EXISTS ${TEST_SCHEMA} CASCADE`);
    await admin.end();
  });

  it('inserts every mapped record, and a second run inserts none of them', async () => {
    const rows = [productionRow({}, 1), productionRow({}, 2), productionRow({}, 3)];
    const { records } = mapAuditRecords(rows);

    for (const record of records) await store.append(record as AuditRecord);
    expect(await store.size()).toBe(3);

    // Re-running a half-finished migration must resume, not duplicate.
    for (const record of records) await store.append(record as AuditRecord);
    expect(await store.size()).toBe(3);
  });

  it('round-trips a migrated record field for field', async () => {
    const { records } = mapAuditRecords([productionRow({}, 7)]);
    const original = records[0] as AuditRecord;
    await store.append(original);

    const back = await store.find(
      original.subjectId,
      original.exerciseId,
      original.assignmentSnapshotAt,
    );
    for (const key of Object.keys(original) as (keyof AuditRecord)[]) {
      expect(JSON.stringify(back?.[key]), `field ${String(key)}`).toBe(
        JSON.stringify(original[key]),
      );
    }
  });
});
