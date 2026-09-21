import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import fastifyStatic from '@fastify/static';

import { buildApp, DEFAULT_AUDIT_PATH } from './app.js';
import { AuditLog } from './audit.js';

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? '127.0.0.1';

// The audit log is the one piece of state the server has. Deployed, it lives in
// managed Postgres (DATABASE_URL); locally and in tests it stays the JSONL file.
const audit = process.env.DATABASE_URL
  ? await AuditLog.fromPostgres(process.env.DATABASE_URL)
  : AuditLog.fromFile(process.env.AUDIT_PATH ?? DEFAULT_AUDIT_PATH);

const app = buildApp({ logger: true, audit });

// One-origin deployment: when the built client is present, this process serves
// it and answers /api/... on the same origin. In dev the file is absent and the
// Vite dev server (with its /api proxy) serves the client instead.
const clientDist = resolve(
  process.env.CLIENT_DIST ??
    resolve(dirname(fileURLToPath(import.meta.url)), '../../client/dist'),
);
if (existsSync(resolve(clientDist, 'index.html'))) {
  await app.register(fastifyStatic, { root: clientDist });
  // SPA fallback: client-side routes get index.html; unknown /api paths 404.
  app.setNotFoundHandler((request, reply) => {
    if (request.method === 'GET' && !request.url.startsWith('/api/')) {
      return reply.type('text/html').sendFile('index.html');
    }
    return reply.code(404).send({ error: 'not_found' });
  });
}

try {
  await app.listen({ port, host });
  app.log.info(
    `Tikerino server ready. Content: ${app.tikerinoContent.pack.packVersion}, ` +
      `${app.tikerinoContent.pack.exercises.length} exercises, ` +
      `${app.tikerinoAudit.size} answers already recorded.`,
  );
} catch (error) {
  // A content-validation failure lands here: refuse to run rather than serve a
  // curriculum that does not match the schema.
  app.log.error(error);
  process.exit(1);
}
