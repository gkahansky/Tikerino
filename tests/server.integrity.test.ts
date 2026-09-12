import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { cutWindow, generateSeries, resolveCandleRule } from '@tikerino/engine';
import type { ContentPack } from '@tikerino/content';

import { buildApp } from '../server/src/app.js';

const PACK_PATH = resolve(__dirname, '../specs/tikerino-content-pack-v0.1.json');
const pack = JSON.parse(readFileSync(PACK_PATH, 'utf8')) as ContentPack;

let app: FastifyInstance;

beforeAll(async () => {
  const auditDir = mkdtempSync(join(tmpdir(), 'tikerino-audit-'));
  app = buildApp({ auditPath: join(auditDir, 'audit.jsonl') });
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

const chartExercises = pack.exercises.filter((e) => e.chart !== null);

describe('GET /api/exercises/:id/window', () => {
  /**
   * The negative test the integrity contract requires: scan the serialised
   * payload of EVERY exercise for anything at or past the cut point.
   */
  it.each(chartExercises.map((e) => [e.exerciseId, e] as const))(
    '%s leaks no post-T candle',
    async (exerciseId, exercise) => {
      const response = await app.inject({ url: `/api/exercises/${exerciseId}/window` });
      expect(response.statusCode).toBe(200);

      const body = response.json() as { chart: { candles: { i: number }[] } };
      const windowSize = exercise.chart!.windowSize;

      expect(body.chart.candles).toHaveLength(windowSize);
      for (const candle of body.chart.candles) {
        expect(candle.i).toBeLessThanOrEqual(windowSize - 1);
      }

      // Also check the raw text: a post-T candle hidden in some other field would
      // pass the structured check above but still ship to the client.
      const series = generateSeries({
        seed: exercise.chart!.seed,
        family: exercise.chart!.scenarioFamily,
        windowSize,
        revealSize: exercise.chart!.revealSize,
        scenarioSpecVersion: exercise.chart!.scenarioSpecVersion,
      });
      for (const hidden of series.candles.slice(windowSize)) {
        expect(response.body).not.toContain(JSON.stringify(hidden));
      }
    },
  );

  it.each(pack.exercises.map((e) => [e.exerciseId] as const))(
    '%s never ships the answer',
    async (exerciseId) => {
      const response = await app.inject({ url: `/api/exercises/${exerciseId}/window` });
      const text = response.body;
      expect(text).not.toContain('correctOptionId');
      expect(text).not.toContain('"target"');
      expect(text).not.toContain('"seed"');
      expect(text).not.toContain('scenarioFamily');
      expect(text).not.toContain('"feedback"');
      expect(text).not.toContain('"reveal"');
    },
  );

  it('always carries the synthetic-data label on a chart', async () => {
    for (const exercise of chartExercises) {
      const response = await app.inject({ url: `/api/exercises/${exercise.exerciseId}/window` });
      const body = response.json() as { chart: { syntheticDataLabel: string } };
      expect(body.chart.syntheticDataLabel).toBe(pack.meta.syntheticDataLabel);
    }
  });

  it('404s an unknown exercise', async () => {
    const response = await app.inject({ url: '/api/exercises/ex-999/window' });
    expect(response.statusCode).toBe(404);
  });
});

describe('POST /api/answers', () => {
  const submit = (body: Record<string, unknown>) =>
    app.inject({ method: 'POST', url: '/api/answers', payload: body });

  it('grades every starter exercise correctly when given the right answer', async () => {
    for (const exercise of pack.exercises) {
      let answer: Record<string, unknown>;
      if (exercise.type === 'multiple_choice') {
        answer = { selectedOptionId: exercise.correctOptionId };
      } else {
        const series = generateSeries({
          seed: exercise.chart!.seed,
          family: exercise.chart!.scenarioFamily,
          windowSize: exercise.chart!.windowSize,
          revealSize: exercise.chart!.revealSize,
          scenarioSpecVersion: exercise.chart!.scenarioSpecVersion,
        });
        answer = {
          selectedCandleIndex: resolveCandleRule(exercise.target.rule, cutWindow(series)),
        };
      }

      const response = await submit({
        subjectId: 'test-all-correct',
        exerciseId: exercise.exerciseId,
        answer,
        hintUsed: false,
        timeToAnswerMs: 10_000,
        capturedOffline: false,
        assignmentSnapshotAt: '2026-09-12T08:00:00.000Z',
      });

      expect(response.statusCode).toBe(200);
      const body = response.json() as {
        correct: boolean;
        xp: { total: number };
        reveal: { candles: unknown[]; disclaimer: string };
      };

      expect(body.correct, `${exercise.exerciseId} should be correct`).toBe(true);
      expect(body.xp.total).toBeGreaterThan(0);
      expect(body.reveal.disclaimer).toBe(pack.meta.revealDisclaimer);
      expect(body.reveal.candles).toHaveLength(exercise.chart?.revealSize ?? 0);
    }
  });

  it('returns exactly revealSize post-T candles, with the right indices', async () => {
    const exercise = pack.exercises.find((e) => e.exerciseId === 'ex-001')!;
    const response = await submit({
      subjectId: 'test-reveal',
      exerciseId: 'ex-001',
      answer: { selectedOptionId: 'a' },
      hintUsed: false,
      timeToAnswerMs: 5_000,
      capturedOffline: false,
      assignmentSnapshotAt: '2026-09-12T08:00:00.000Z',
    });

    const body = response.json() as { reveal: { candles: { i: number }[] } };
    const windowSize = exercise.chart!.windowSize;
    expect(body.reveal.candles.map((c) => c.i)).toEqual(
      Array.from({ length: exercise.chart!.revealSize }, (_, n) => windowSize + n),
    );
  });

  it('is idempotent on (subjectId, exerciseId, assignmentSnapshotAt)', async () => {
    const key = {
      subjectId: 'test-idempotency',
      exerciseId: 'ex-003',
      hintUsed: false,
      timeToAnswerMs: 5_000,
      capturedOffline: false,
      assignmentSnapshotAt: '2026-09-12T09:00:00.000Z',
    };

    const first = await submit({ ...key, answer: { selectedOptionId: 'b' } });
    expect((first.json() as { correct: boolean }).correct).toBe(true);

    // A retry with a DIFFERENT answer must replay the recorded result, not regrade.
    const retry = await submit({ ...key, answer: { selectedOptionId: 'a' } });
    const retryBody = retry.json() as { correct: boolean; xp: { total: number } };
    expect(retryBody.correct).toBe(true);
    expect(retryBody.xp.total).toBe((first.json() as { xp: { total: number } }).xp.total);
  });

  it('accepts an answer captured offline', async () => {
    const response = await submit({
      subjectId: 'test-offline',
      exerciseId: 'ex-005',
      answer: { selectedOptionId: 'a' },
      hintUsed: false,
      timeToAnswerMs: 12_000,
      capturedOffline: true,
      assignmentSnapshotAt: '2026-09-11T20:00:00.000Z',
    });
    expect(response.statusCode).toBe(200);
    expect((response.json() as { correct: boolean }).correct).toBe(true);
  });

  it('rejects a candle index outside the window', async () => {
    const response = await submit({
      subjectId: 'test-bounds',
      exerciseId: 'ex-004',
      answer: { selectedCandleIndex: 99 },
      hintUsed: false,
      timeToAnswerMs: 1_000,
      capturedOffline: false,
      assignmentSnapshotAt: '2026-09-12T10:00:00.000Z',
    });
    expect(response.statusCode).toBe(400);
  });

  it('rejects the wrong answer shape for the exercise type', async () => {
    const response = await submit({
      subjectId: 'test-shape',
      exerciseId: 'ex-004',
      answer: { selectedOptionId: 'a' },
      hintUsed: false,
      timeToAnswerMs: 1_000,
      capturedOffline: false,
      assignmentSnapshotAt: '2026-09-12T10:30:00.000Z',
    });
    expect(response.statusCode).toBe(400);
  });

  it('404s an unknown exercise', async () => {
    const response = await submit({
      subjectId: 'test-404',
      exerciseId: 'ex-999',
      answer: { selectedOptionId: 'a' },
      hintUsed: false,
      timeToAnswerMs: 1_000,
      capturedOffline: false,
      assignmentSnapshotAt: '2026-09-12T10:00:00.000Z',
    });
    expect(response.statusCode).toBe(404);
  });
});
