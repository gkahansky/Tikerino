import { existsSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import fastifyStatic from '@fastify/static';
import { buildApp } from './app.js';
import { createAuditStore } from './store.js';

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? '127.0.0.1';

// Before the app: a bad DATABASE_URL should fail here, loudly, rather than on the
// first learner's answer.
const { store, description } = await createAuditStore();


const app = buildApp({ auditStore: store, logger: true });
const clientDist = resolve(process.env.CLIENT_DIST ?? resolve(dirname(fileURLToPath(import.meta.url)), '../../client/dist'));
if (existsSync(resolve(clientDist, 'index.html'))) {
  await app.register(fastifyStatic, { root: clientDist });
  app.setNotFoundHandler((request, reply) => {
    if (request.method === 'GET' && !request.url.startsWith('/api/')) return reply.type('text/html').sendFile('index.html');
    return reply.code(404).send({ error: 'not_found' });
  });
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    void (async () => {
      await app.close();
      // Drain the pool, so a rolling deploy does not leave sessions open on the
      // database until it times them out.
      await store.close();
      process.exit(0);
    })();
  });
}

try {
  await app.listen({ port, host });
  app.log.info(
    `Tikerino server ready. Content: ${app.tikerinoContent.pack.packVersion}, ` +
      `${app.tikerinoContent.pack.exercises.length} exercises, ` +
      `${await store.size()} answers already recorded. Audit store: ${description}.`,
  );
} catch (error) {
  // A content-validation failure lands here: refuse to run rather than serve a
  // curriculum that does not match the schema.
  app.log.error(error);
  process.exit(1);
}
