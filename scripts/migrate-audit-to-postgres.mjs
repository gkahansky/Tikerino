#!/usr/bin/env node
/**
 * Copy an existing JSONL audit log into Postgres.
 *
 * Safe to re-run: every insert goes through the same ON CONFLICT DO NOTHING path
 * the server uses, so a half-finished migration is resumed rather than
 * duplicated. Reports what it skipped instead of claiming a clean run.
 *
 *   DATABASE_URL=postgres://... node scripts/migrate-audit-to-postgres.mjs [path]
 */
import { resolve } from 'node:path';

import { JsonlAuditStore } from '../server/src/audit.ts';
import { createAuditStore, DEFAULT_AUDIT_PATH } from '../server/src/store.ts';

const source = process.argv[2] ? resolve(process.argv[2]) : DEFAULT_AUDIT_PATH;

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Nothing to migrate into.');
  process.exit(1);
}

const records = new JsonlAuditStore(source).readAll();
if (records.length === 0) {
  console.log(`No records in ${source}. Nothing to do.`);
  process.exit(0);
}

const { store, description } = await createAuditStore();
console.log(`Migrating ${records.length} record(s) from ${source} into ${description}`);

const before = await store.size();
for (const record of records) {
  await store.append(record);
}
const after = await store.size();

const inserted = after - before;
const skipped = records.length - inserted;
console.log(
  `Inserted ${inserted}. Already present, skipped: ${skipped}. Rows now: ${after}.`,
);

// Read one back and compare it field by field, so the migration proves the round
// trip rather than trusting that an insert with no error means a faithful copy.
const sample = records[0];
const roundTripped = await store.find(sample.subjectId, sample.exerciseId, sample.assignmentSnapshotAt);
const mismatches = Object.keys(sample).filter(
  (key) => JSON.stringify(sample[key]) !== JSON.stringify(roundTripped?.[key]),
);
if (mismatches.length > 0) {
  console.error(`Round-trip mismatch on ${sample.exerciseId}: ${mismatches.join(', ')}`);
  await store.close();
  process.exit(1);
}
console.log(`Round-trip verified on ${sample.exerciseId}: every field identical.`);

await store.close();
