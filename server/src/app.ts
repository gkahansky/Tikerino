import { resolve } from 'node:path';

import cors from '@fastify/cors';
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

import { AuditLog, type AuditRecord } from './audit.js';
import { loadContent, type LoadedContent } from './content.js';

export interface BuildAppOptions {
  contentPackPath?: string;
  auditPath?: string;
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

export function buildApp(options: BuildAppOptions = {}): FastifyInstance {
  const content: LoadedContent = loadContent(options.contentPackPath);
  const audit = new AuditLog(
    options.auditPath ?? resolve(process.cwd(), 'server/data/audit.jsonl'),
  );

  const app = Fastify({ logger: options.logger ?? false });
  app.register(cors, { origin: true });

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
  app.post<{ Body: AnswerRequestBody }>('/api/answers', async (request, reply) => {
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
        ? Math.max(0, body.timeToAnswerMs)
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

    const previous = audit.find(subjectId, exerciseId, assignmentSnapshotAt);

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
      audit.append(record);
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
  });

  return app;
}

declare module 'fastify' {
  interface FastifyInstance {
    tikerinoContent: LoadedContent;
    tikerinoAudit: AuditLog;
  }
}
