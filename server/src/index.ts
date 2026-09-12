import { buildApp } from './app.js';

const port = Number(process.env.PORT ?? 8787);
const host = process.env.HOST ?? '127.0.0.1';

const app = buildApp({ logger: true });

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
