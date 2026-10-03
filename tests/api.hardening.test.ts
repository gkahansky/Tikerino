import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { FastifyInstance } from 'fastify';

import { buildApp } from '../server/src/app.js';
import { registerOps } from '../server/src/ops.js';

const PACK_PATH = resolve(__dirname, '../specs/tikerino-content-pack-v0.2.json');

let app: FastifyInstance;
let opsApp: FastifyInstance;

beforeAll(async () => {
  const auditDir = mkdtempSync(join(tmpdir(), 'tikerino-hardening-'));
  app = buildApp({ contentPackPath: PACK_PATH, auditPath: join(auditDir, 'audit.jsonl') });
  await app.ready();

  opsApp = buildApp({ contentPackPath: PACK_PATH, auditPath: join(auditDir, 'ops-audit.jsonl') });
  registerOps(opsApp);
  await opsApp.ready();
});

afterAll(async () => {
  await app.close();
  await opsApp.close();
});

const validAnswer = {
  subjectId: 'hardening-test',
  exerciseId: 'ex-001',
  answer: { selectedOptionId: 'a' },
  hintUsed: false,
  timeToAnswerMs: 1234,
  capturedOffline: false,
  assignmentSnapshotAt: '2026-10-03T12:00:00.000Z',
};

describe('API hardening (X8)', () => {
  describe('POST /api/answers body bounds (400s)', () => {
    it('rejects missing required fields', async () => {
      const res = await app.inject({ method: 'POST', url: '/api/answers', payload: {} });
      expect(res.statusCode).toBe(400);
    });

    it('rejects unknown extra fields (additionalProperties: false)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/answers',
        payload: { ...validAnswer, extra: 'nope', foo: 1 },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects oversized subjectId (>100)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/answers',
        payload: { ...validAnswer, subjectId: 'x'.repeat(101) },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects oversized exerciseId (>50)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/answers',
        payload: { ...validAnswer, exerciseId: 'ex-' + 'x'.repeat(50) },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects oversized assignmentSnapshotAt (>50)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/answers',
        payload: { ...validAnswer, assignmentSnapshotAt: 't'.repeat(51) },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects answer with unknown shape', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/answers',
        payload: { ...validAnswer, answer: { selectedFoo: 'bar' } },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects answer with extra fields inside option', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/answers',
        payload: { ...validAnswer, answer: { selectedOptionId: 'a', extra: 1 } },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects answer with extra fields inside candle', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/answers',
        payload: { ...validAnswer, answer: { selectedCandleIndex: 0, extra: 1 } },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects out-of-range timeToAnswerMs (>3.6M)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/answers',
        payload: { ...validAnswer, timeToAnswerMs: 3_600_001 },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects negative timeToAnswerMs', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/answers',
        payload: { ...validAnswer, timeToAnswerMs: -1 },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects non-integer selectedCandleIndex', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/answers',
        payload: { ...validAnswer, answer: { selectedCandleIndex: 1.5 } },
      });
      expect(res.statusCode).toBe(400);
    });

    it('rejects oversized answer optionId (>100)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/answers',
        payload: { ...validAnswer, answer: { selectedOptionId: 'o'.repeat(101) } },
      });
      expect(res.statusCode).toBe(400);
    });
  });

  describe('rate limits (429s)', () => {
    it('returns 429 on answers after limit (per-IP)', async () => {
      // Use a distinct subject to avoid idempotency side effects.
      const floodBase = {
        ...validAnswer,
        subjectId: 'rate-flood-answers',
        assignmentSnapshotAt: '2026-10-03T12:00:01.000Z',
      };
      // The configured limit is 60/min. Issue >60 to force at least one 429.
      let saw429 = false;
      for (let i = 0; i < 70; i++) {
        const res = await app.inject({
          method: 'POST',
          url: '/api/answers',
          payload: { ...floodBase, exerciseId: `ex-00${(i % 9) + 1}` },
        });
        if (res.statusCode === 429) {
          saw429 = true;
          break;
        }
        // Some may legitimately 404 or 400 if exercise doesn't match, but we only care about 429.
      }
      expect(saw429).toBe(true);
    });

    it('returns 429 on /ops/login after stricter limit (5/min)', async () => {
      let saw429 = false;
      for (let i = 0; i < 10; i++) {
        const res = await opsApp.inject({
          method: 'POST',
          url: '/ops/login',
          payload: { password: 'wrong' },
        });
        if (res.statusCode === 429) {
          saw429 = true;
          break;
        }
      }
      expect(saw429).toBe(true);
    });
  });

  describe('CORS (restricted origins, no wildcard)', () => {
    it('allows configured dev origins', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/exercises/ex-001/window',
        headers: { origin: 'http://127.0.0.1:5173' },
      });
      expect(res.statusCode).toBe(200);
      // @fastify/cors sets ACAO when origin matches
      expect(res.headers['access-control-allow-origin']).toBe('http://127.0.0.1:5173');
    });

    it('allows localhost:5173 as well', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/exercises/ex-001/window',
        headers: { origin: 'http://localhost:5173' },
      });
      expect(res.statusCode).toBe(200);
      expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    });

    it('disallows other origins (no wildcard)', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/exercises/ex-001/window',
        headers: { origin: 'https://evil.example' },
      });
      expect(res.statusCode).toBe(200); // request itself succeeds
      // No ACAO or reflected evil origin
      expect(res.headers['access-control-allow-origin']).not.toBe('https://evil.example');
      // When origin is disallowed, @fastify/cors omits or sets false; we assert it is not the evil value.
    });
  });
});
