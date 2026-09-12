import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { JsonlAuditStore, PostgresAuditStore, type AuditStore } from './audit.js';

/**
 * Resolved against this module, not the working directory: `npm run dev` starts
 * the server with cwd=server/ while a bare `tsx server/src/index.ts` starts it at
 * the repo root, and a cwd-relative default quietly wrote the audit log to two
 * different places depending on which you used.
 */
export const DEFAULT_AUDIT_PATH = resolve(
  dirname(fileURLToPath(import.meta.url)),
  '../data/audit.jsonl',
);

export interface AuditStoreChoice {
  store: AuditStore;
  /** For the boot log, so which store is live is never a guess. */
  description: string;
}

/**
 * Pick the audit store from the environment.
 *
 * DATABASE_URL set means Postgres, which is what a deployment runs. Unset means
 * the JSONL file, which keeps `npm run dev`, the browser suites and CI working
 * with no database to install. There is no third option and no silent fallback:
 * if DATABASE_URL is set and the database is unreachable, the server refuses to
 * start rather than quietly recording answers to a file nobody will look at.
 */
export async function createAuditStore(
  databaseUrl: string | undefined = process.env.DATABASE_URL,
  auditPath: string = DEFAULT_AUDIT_PATH,
): Promise<AuditStoreChoice> {
  const url = (databaseUrl ?? '').trim();
  if (url === '') {
    return {
      store: new JsonlAuditStore(auditPath),
      description: `JSONL file at ${auditPath} (set DATABASE_URL for Postgres)`,
    };
  }

  // Imported here rather than at module scope so a JSONL-only run - dev, CI, the
  // browser suites - never loads the driver at all.
  const { Pool } = await import('pg');
  const pool = new Pool({
    connectionString: url,
    // A deployment behind a managed Postgres usually terminates TLS with a cert
    // the container does not have a root for. Opt in explicitly rather than
    // defaulting either way.
    ssl: process.env.DATABASE_SSL === 'require' ? { rejectUnauthorized: false } : undefined,
  });

  const store = new PostgresAuditStore(pool);
  await store.migrate();
  return { store, description: `Postgres (${redact(url)})` };
}

/** Never log a connection string with its password in it. */
export function redact(connectionString: string): string {
  try {
    const parsed = new URL(connectionString);
    if (parsed.password) parsed.password = '***';
    return parsed.toString();
  } catch {
    return '<unparseable DATABASE_URL>';
  }
}
