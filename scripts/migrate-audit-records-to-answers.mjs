#!/usr/bin/env node
/**
 * Carry production's audit log into the schema `main` expects.
 *
 * Production records answers in `audit_records`: one row per answer, the whole
 * audit identity in a `record` JSONB column. `main` records them in
 * `audit_answers`, the same identity flattened into typed columns. Both create
 * their table with CREATE TABLE IF NOT EXISTS, so deploying `main` over the
 * production database neither fails nor migrates - it starts a second, empty
 * table beside the live one, reports zero answers recorded, and rebuilds an
 * empty idempotency index. Every existing record stays in `audit_records`,
 * invisible, and a resent offline answer is recorded a second time.
 *
 * This is the forward step for that. It is deliberately boring:
 *
 * - **It only reads the source.** SELECT on audit_records, nothing else. No
 *   DROP, no ALTER, no DELETE, no rename. The rollback is that the source table
 *   is exactly as it was, so redeploying the previous build restores service
 *   with every row intact.
 * - **It refuses to run without a backup.** Not a prompt - the operator states
 *   the backup they took, and it is echoed into the output so the run and the
 *   backup are recorded together.
 * - **It is re-runnable.** Inserts go through ON CONFLICT DO NOTHING on the same
 *   unique key, so a half-finished migration resumes rather than duplicating.
 * - **It proves the round trip.** One record is read back through the server's
 *   own store and compared field by field. "No error" is not evidence.
 *
 *   DATABASE_URL=postgres://... node scripts/migrate-audit-records-to-answers.mjs \
 *     --backup=<how the backup was taken and where it is>
 *
 * Add --dry-run to read and map every row, report what would be inserted, and
 * write nothing.
 */
import { pathToFileURL } from 'node:url';

import pg from 'pg';

import { createAuditStore } from '../server/src/store.ts';

/** The identity every record must carry to be replayable. Missing any of it is a stop, not a warning. */
export const REQUIRED_FIELDS = [
  'subjectId',
  'exerciseId',
  'scenarioSpecVersion',
  'generatorVersion',
  'curriculumVersion',
  'answer',
  'hintUsed',
  'timeToAnswerMs',
  'capturedOffline',
  'assignmentSnapshotAt',
  'serverReceivedAt',
  'correct',
  'xpTotal',
];

/**
 * Turn production's `record` JSONB column into records this repository's store
 * can append. Exported so the rule that decides what is replayable can be tested
 * without running a migration: a record that cannot be replayed has to be
 * refused, never quietly copied.
 */
export function mapAuditRecords(rows) {
  const records = [];
  const rejected = [];
  for (const [index, row] of rows.entries()) {
    const record = typeof row.record === 'string' ? JSON.parse(row.record) : row.record;
    const missing = REQUIRED_FIELDS.filter((key) => record?.[key] === undefined);
    if (missing.length > 0) {
      rejected.push({ index, missing });
      continue;
    }
    // syntheticSeriesId is legitimately absent for the chartless vocabulary
    // exercises, so it is normalised rather than required.
    records.push({ ...record, syntheticSeriesId: record.syntheticSeriesId ?? null });
  }
  return { records, rejected };
}

const BACKUP_REFUSAL = [
  'Refusing to write without a backup on the record.',
  '',
  'This migration only ever reads audit_records, so the rollback is to redeploy the',
  'previous build - but the target database is the one holding every graded answer,',
  'and that deserves a backup regardless. Take one:',
  '',
  '  pg_dump "$DATABASE_URL" --format=custom --file=tikerino-audit-$(date +%Y%m%dT%H%M%SZ).dump',
  '',
  'Verify it restores into a scratch database before relying on it, then re-run with:',
  '',
  '  --backup="pg_dump custom, <where it is>, restore-verified <when>"',
  '',
  'Or pass --dry-run to see exactly what this would do, writing nothing.',
].join('\n');

async function main(argv) {
  const dryRun = argv.includes('--dry-run');
  const backup = argv.find((a) => a.startsWith('--backup='))?.slice('--backup='.length)?.trim();
  const sourceTable =
    argv.find((a) => a.startsWith('--source='))?.slice('--source='.length) ?? 'audit_records';

  if (!/^[a-z_][a-z0-9_]*$/.test(sourceTable)) {
    console.error(`Refusing to read from "${sourceTable}": table names must be plain identifiers.`);
    return 1;
  }

  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Nothing to migrate.');
    return 1;
  }

  if (!dryRun && !backup) {
    console.error(BACKUP_REFUSAL);
    return 1;
  }

  const pool = new pg.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'require' ? { rejectUnauthorized: false } : undefined,
  });

  try {
    const exists = await pool.query('SELECT to_regclass($1) AS table', [sourceTable]);
    if (!exists.rows[0]?.table) {
      console.error(
        `No ${sourceTable} table in this database. Nothing to migrate - is this the right DATABASE_URL?`,
      );
      return 1;
    }

    const { rows } = await pool.query(`SELECT record FROM ${sourceTable} ORDER BY id`);
    console.log(
      `Read ${rows.length} row(s) from ${sourceTable}. The source is not modified by this script.`,
    );
    if (backup) console.log(`Backup on the record: ${backup}`);

    const { records, rejected } = mapAuditRecords(rows);

    if (rejected.length > 0) {
      console.error(`\n${rejected.length} row(s) are missing audit identity and cannot be replayed:`);
      for (const r of rejected.slice(0, 10)) {
        console.error(`  row ${r.index}: missing ${r.missing.join(', ')}`);
      }
      console.error('\nStopping. A record that cannot be replayed is not one to copy quietly.');
      return 1;
    }

    if (dryRun) {
      console.log(
        `\nDry run: ${records.length} record(s) map cleanly and would be inserted into audit_answers.`,
      );
      console.log('Nothing was written.');
      return 0;
    }

    const { store, description } = await createAuditStore();
    try {
      console.log(`Migrating ${records.length} record(s) into ${description}`);

      const before = await store.size();
      for (const record of records) await store.append(record);
      const after = await store.size();

      console.log(
        `Inserted ${after - before}. Already present, skipped: ${
          records.length - (after - before)
        }. Rows in audit_answers: ${after}.`,
      );

      const sample = records[0];
      const roundTripped = await store.find(
        sample.subjectId,
        sample.exerciseId,
        sample.assignmentSnapshotAt,
      );
      const mismatches = Object.keys(sample).filter(
        (key) => JSON.stringify(sample[key]) !== JSON.stringify(roundTripped?.[key]),
      );
      if (mismatches.length > 0) {
        console.error(`Round-trip mismatch on ${sample.exerciseId}: ${mismatches.join(', ')}`);
        return 1;
      }
      console.log(`Round-trip verified on ${sample.exerciseId}: every field identical.`);
      console.log(
        `\n${sourceTable} still holds all ${rows.length} original row(s). Rollback is redeploying the previous build.`,
      );
      return 0;
    } finally {
      await store.close();
    }
  } finally {
    await pool.end();
  }
}

// Importing this file (the tests do) must never run a migration.
const executedDirectly =
  process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href;
if (executedDirectly) process.exit(await main(process.argv.slice(2)));
