import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import Fastify, { type FastifyInstance } from 'fastify';

import {
  GENERATOR_VERSION,
  assertNoPostCutCandles,
  assertSeriesInvariants,
  cutReveal,
  cutWindow,
  generateSeries,
  resolveCandleRule,
  type Candle,
} from '@tikerino/engine';
import type { Exercise } from '@tikerino/content';
import {
  computeXp,
  gradeAndScore,
  isCandleAnswer,
  isOptionAnswer,
  type AnswerPayload,
  type Target,
} from '@tikerino/grading';

import { JsonlAuditStore, type AuditRecord, type AuditStore } from './audit.js';
import { loadContent, type LoadedContent } from './content.js';
import { DEFAULT_AUDIT_PATH } from './store.js';

export interface BuildAppOptions {
  contentPackPath?: string;
  /** Path for the default JSONL store. Ignored when auditStore is given. */
  auditPath?: string;
  /** The store to record answers in. Defaults to JSONL at auditPath. */
  auditStore?: AuditStore;
  logger?: boolean;
}

interface AnswerRequestBody {
  subjectId?: unknown;
  exerciseId?: unknown;
  answer?: unknown;
  hintUsed?: unknown;
  timeToAnswerMs?: unknown;
  capturedOffline?: unknown;
  assignmentSnapshotAt?: unknown;
}

/** Resolve the graded target. For pick_the_candle this needs the window candles. */
function resolveTarget(exercise: Exercise, windowCandles: Candle[]): Target {
  if (exercise.type === 'multiple_choice') {
    return { optionId: exercise.correctOptionId };
  }
  return { candleIndex: resolveCandleRule(exercise.target.rule, windowCandles) };
}

/** Generate the full series behind an exercise, or null for a chartless vocabulary item. */
function seriesFor(exercise: Exercise) {
  if (!exercise.chart) return null;
  const chart = exercise.chart;
  return generateSeries({
    seed: chart.seed,
    family: chart.scenarioFamily,
    windowSize: chart.windowSize,
    revealSize: chart.revealSize,
    scenarioSpecVersion: chart.scenarioSpecVersion,
  });
}

export async function buildApp(options: BuildAppOptions = {}): Promise<FastifyInstance> {
  const content: LoadedContent = loadContent(options.contentPackPath);
  const audit: AuditStore =
    options.auditStore ?? new JsonlAuditStore(options.auditPath ?? DEFAULT_AUDIT_PATH);

  const rawOrigins = process.env.CORS_ORIGINS ?? 'http://127.0.0.1:5173,http://localhost:5173';
  const allowedOrigins = rawOrigins
    .split(',')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);

  // trustProxy:1 (default) tells Fastify the immediate client is 1 hop away (Railway edge proxy).
  // This makes request.ip the real end-user IP so per-IP rate limits and any future IP-based
  // features see the learner, not the proxy. Set TRUST_PROXY=true or a hop count for other
  // environments; 0 means "do not trust any proxy".
  const trustProxy: boolean | string = (() => {
    const v = process.env.TRUST_PROXY;
    if (v === 'true' || v === '1') return true;
    if (v != null) {
      const n = Number(v);
      return Number.isFinite(n) ? String(n) : '1';
    }
    return true; // default: trust 1 hop (Railway)
  })();

  const app = Fastify({
    logger: options.logger ?? false,
    bodyLimit: 16 * 1024,
    trustProxy,
    // Disable Fastify/Ajv's default coercion and removal so schema violations are 400s
    // (unknown fields, wrong types) rather than silent drops or coerced values.
    // Existing GET routes have no body schemas so unaffected.
    ajv: {
      customOptions: {
        removeAdditional: false,
        coerceTypes: false,
      },
    },
  });
  await app.register(cors, { origin: allowedOrigins });
  // global:false so only routes that declare config.rateLimit are limited; window and
  // static assets stay unlimited. We await so route-level config.rateLimit is active.
  await app.register(rateLimit, { global: false });

  // Handy for tests and for the two routes below.
  app.decorate('tikerinoContent', content);
  app.decorate('tikerinoAudit', audit);

  /* ---------------------------------------------------------------------- */
  /* 1. GET /api/exercises/:exerciseId/window                                */
  /* ---------------------------------------------------------------------- */
  app.get<{ Params: { exerciseId: string } }>(
    '/api/exercises/:exerciseId/window',
    async (request, reply) => {
      const exercise = content.index.exerciseById.get(request.params.exerciseId);
      if (!exercise) {
        return reply.code(404).send({ error: 'unknown_exercise', exerciseId: request.params.exerciseId });
      }

      let chart: Record<string, unknown> | null = null;
      if (exercise.chart) {
        const series = seriesFor(exercise)!;
        assertSeriesInvariants(series.candles, series.windowSize, series.revealSize);

        const candles = cutWindow(series);
        // Belt and braces: this is the exact array about to be serialised.
        assertNoPostCutCandles(candles, series.windowSize);

        chart = {
          syntheticSeriesId: exercise.chart.syntheticSeriesId,
          scenarioSpecVersion: exercise.chart.scenarioSpecVersion,
          timeframeLabel: exercise.chart.timeframeLabel,
          syntheticDataLabel: content.pack.meta.syntheticDataLabel,
          candles,
        };
      }

      // Note what is deliberately absent: the target resolution, the correct
      // option id, and every candle at or beyond the cut point.
      return reply.send({
        exerciseId: exercise.exerciseId,
        curriculumVersion: content.pack.curriculumVersion,
        generatorVersion: GENERATOR_VERSION,
        type: exercise.type,
        prompt: exercise.prompt,
        options: exercise.type === 'multiple_choice' ? exercise.options : null,
        chart,
      });
    },
  );

  /* ---------------------------------------------------------------------- */
  /* 2. POST /api/answers                                                    */
  /* ---------------------------------------------------------------------- */
  app.post<{ Body: AnswerRequestBody }>(
    '/api/answers',
    {
      config: {
        rateLimit: {
          // 120 requests per 10s per IP.
          // Starter pack has 16 exercises. A realistic offline queue flush sends the pending
          // answers back-to-back on reconnect (plus occasional retries). 120 in 10s gives
          // generous headroom. Browser suites issue ~16 spaced answers and will not hit.
          max: 120,
          timeWindow: '10 seconds',
        },
      },
      schema: {
        body: {
          type: 'object',
          required: [
            'subjectId',
            'exerciseId',
            'answer',
            'hintUsed',
            'timeToAnswerMs',
            'capturedOffline',
            'assignmentSnapshotAt',
          ],
          additionalProperties: false,
          properties: {
            subjectId: { type: 'string', minLength: 1, maxLength: 100 },
            exerciseId: { type: 'string', minLength: 1, maxLength: 50 },
            answer: {
              type: 'object',
              additionalProperties: false,
              minProperties: 1,
              maxProperties: 1,
              properties: {
                selectedOptionId: { type: 'string', minLength: 1, maxLength: 100 },
                selectedCandleIndex: { type: 'integer', minimum: 0, maximum: 200 },
              },
            },
            hintUsed: { type: 'boolean' },
            timeToAnswerMs: { type: 'integer', minimum: 0, maximum: 86_400_000 },
            capturedOffline: { type: 'boolean' },
            assignmentSnapshotAt: {
              type: 'string',
              minLength: 1,
              maxLength: 50,
              // Loose ISO-8601-ish (matches what the client emits); ENGINEERING_REVIEW wanted bounds here.
              pattern: '^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(\\.[0-9]{1,3})?Z?$',
            },
          },
        },
      },
    },
    async (request, reply) => {
      const body = request.body ?? {};

      const subjectId = typeof body.subjectId === 'string' ? body.subjectId : null;
      const exerciseId = typeof body.exerciseId === 'string' ? body.exerciseId : null;
      const assignmentSnapshotAt =
        typeof body.assignmentSnapshotAt === 'string' ? body.assignmentSnapshotAt : null;

      if (!subjectId || !exerciseId || !assignmentSnapshotAt) {
        return reply.code(400).send({
          error: 'invalid_request',
          detail: 'subjectId, exerciseId and assignmentSnapshotAt are required strings',
        });
      }

      const exercise = content.index.exerciseById.get(exerciseId);
      if (!exercise) {
        return reply.code(404).send({ error: 'unknown_exercise', exerciseId });
      }

      const answer = body.answer as AnswerPayload | undefined;
      if (!answer || (!isOptionAnswer(answer) && !isCandleAnswer(answer))) {
        return reply.code(400).send({
          error: 'invalid_request',
          detail: 'answer must be { selectedOptionId } or { selectedCandleIndex }',
        });
      }
      if (exercise.type === 'multiple_choice' && !isOptionAnswer(answer)) {
        return reply
          .code(400)
          .send({ error: 'invalid_request', detail: 'this exercise expects { selectedOptionId }' });
      }
      if (exercise.type === 'pick_the_candle' && !isCandleAnswer(answer)) {
        return reply
          .code(400)
          .send({ error: 'invalid_request', detail: 'this exercise expects { selectedCandleIndex }' });
      }

      const hintUsed = body.hintUsed === true;
      const capturedOffline = body.capturedOffline === true;
      const timeToAnswerMs =
        typeof body.timeToAnswerMs === 'number' && Number.isFinite(body.timeToAnswerMs)
          ? Math.min(86_400_000, Math.max(0, body.timeToAnswerMs))
          : 0;

      // Regenerate from the pack ref. The client's copy of the chart is never trusted.
      const series = seriesFor(exercise);
      if (series) {
        assertSeriesInvariants(series.candles, series.windowSize, series.revealSize);
      }
      const windowCandles = series ? cutWindow(series) : [];
      const revealCandles = series ? cutReveal(series) : [];

      const target = resolveTarget(exercise, windowCandles);

      // A pick_the_candle answer outside the window is a client bug, not a wrong answer.
      if (isCandleAnswer(answer) && series) {
        const index = answer.selectedCandleIndex;
        if (index < 0 || index > series.windowSize - 1) {
          return reply.code(400).send({
            error: 'invalid_request',
            detail: `selectedCandleIndex ${index} is outside the window 0..${series.windowSize - 1}`,
          });
        }
      }

      const previous = await audit.find(subjectId, exerciseId, assignmentSnapshotAt);

      // Idempotent retry: recompute from the recorded inputs rather than grading
      // again, so a resent offline answer never double-counts.
      const graded = previous
        ? {
            correct: previous.correct,
            target,
            xp: computeXp({
              correct: previous.correct,
              difficultyTier: exercise.difficultyTier,
              hintUsed: previous.hintUsed,
              timeToAnswerMs: previous.timeToAnswerMs,
              exerciseType: exercise.type,
            }),
          }
        : gradeAndScore({
            type: exercise.type,
            answer,
            target,
            difficultyTier: exercise.difficultyTier,
            hintUsed,
            timeToAnswerMs,
          });

      if (!previous) {
        const record: AuditRecord = {
          subjectId,
          exerciseId,
          syntheticSeriesId: exercise.chart?.syntheticSeriesId ?? null,
          scenarioSpecVersion: content.pack.scenarioSpecVersion,
          generatorVersion: GENERATOR_VERSION,
          curriculumVersion: content.pack.curriculumVersion,
          answer,
          hintUsed,
          timeToAnswerMs,
          capturedOffline,
          assignmentSnapshotAt,
          serverReceivedAt: new Date().toISOString(),
          correct: graded.correct,
          xpTotal: graded.xp.total,
        };
        await audit.append(record);
      }

      return reply.send({
        exerciseId,
        correct: graded.correct,
        target: graded.target,
        xp: graded.xp,
        feedback: exercise.feedback,
        reveal: {
          // Exactly revealSize post-T candles, or [] when there is no chart.
          candles: revealCandles,
          disclaimer: content.pack.meta.revealDisclaimer,
        },
        audit: {
          syntheticSeriesId: exercise.chart?.syntheticSeriesId ?? null,
          scenarioSpecVersion: content.pack.scenarioSpecVersion,
          generatorVersion: GENERATOR_VERSION,
          curriculumVersion: content.pack.curriculumVersion,
        },
      });
    },
  );

  return app;
}

declare module 'fastify' {
  interface FastifyInstance {
    tikerinoContent: LoadedContent;
    tikerinoAudit: AuditStore;
  }
}
