import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  GENERATOR_VERSION,
  SCENARIO_SPEC_VERSION,
  fnv1a32,
  generateSeries,
  mulberry32,
  type ScenarioFamily,
} from '@tikerino/engine';

interface Golden {
  id: string;
  seed: string;
  family: ScenarioFamily;
  windowSize: number;
  revealSize: number;
  scenarioSpecVersion: string;
  sha256: string;
}

const fixture = JSON.parse(
  readFileSync(resolve(__dirname, 'goldens/series.json'), 'utf8'),
) as { generatorVersion: string; scenarioSpecVersion: string; goldens: Golden[] };

function hashOf(golden: Golden): string {
  const series = generateSeries({
    seed: golden.seed,
    family: golden.family,
    windowSize: golden.windowSize,
    revealSize: golden.revealSize,
    scenarioSpecVersion: golden.scenarioSpecVersion,
  });
  return createHash('sha256').update(JSON.stringify(series.candles)).digest('hex');
}

describe('seeded PRNG', () => {
  it('hashes seeds with FNV-1a exactly as the spec states', () => {
    // Reference values for the documented algorithm: h = 2166136261, then per
    // byte h ^= byte; h = Math.imul(h, 16777619) >>> 0.
    expect(fnv1a32('')).toBe(2166136261);
    expect(fnv1a32('a')).toBe(0xe40c292c);
    expect(fnv1a32('foobar')).toBe(0xbf9cf968);
  });

  it('is a pure function of the seed', () => {
    const first = Array.from({ length: 8 }, () => mulberry32(fnv1a32('cp0.1/ex-004')).next());
    const second = Array.from({ length: 8 }, () => mulberry32(fnv1a32('cp0.1/ex-004')).next());
    expect(first).toEqual(second);
  });

  it('produces values in [0, 1)', () => {
    const prng = mulberry32(fnv1a32('range-check'));
    for (let i = 0; i < 5000; i++) {
      const value = prng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('gives different seeds different streams', () => {
    const a = mulberry32(fnv1a32('cp0.1/ex-001')).next();
    const b = mulberry32(fnv1a32('cp0.1/ex-002')).next();
    expect(a).not.toBe(b);
  });
});

describe('golden-seed replay', () => {
  it('pins the generator version the goldens were taken from', () => {
    // A generator change is a version bump. If this fails, the goldens and the
    // engine disagree about which generator they describe.
    expect(fixture.generatorVersion).toBe(GENERATOR_VERSION);
    expect(fixture.scenarioSpecVersion).toBe(SCENARIO_SPEC_VERSION);
  });

  it.each(fixture.goldens.map((g) => [g.id, g] as const))(
    'regenerates %s bit for bit',
    (_id, golden) => {
      expect(hashOf(golden)).toBe(golden.sha256);
    },
  );

  it('is stable across repeated generation in one process', () => {
    const golden = fixture.goldens[0]!;
    expect(hashOf(golden)).toBe(hashOf(golden));
  });
});

describe('series invariants', () => {
  const families: ScenarioFamily[] = [
    'trend_up',
    'trend_down',
    'range_bound',
    'volatile',
    'ambiguous',
  ];

  it.each(families)('%s holds l <= min(o,c) <= max(o,c) <= h and integer cents', (family) => {
    for (let n = 0; n < 25; n++) {
      const series = generateSeries({
        seed: `invariants/${family}/${n}`,
        family,
        windowSize: 12,
        revealSize: 6,
        scenarioSpecVersion: SCENARIO_SPEC_VERSION,
      });

      expect(series.candles).toHaveLength(18);

      for (const [index, candle] of series.candles.entries()) {
        expect(candle.i).toBe(index);
        expect(candle.l).toBeLessThanOrEqual(Math.min(candle.o, candle.c));
        expect(candle.h).toBeGreaterThanOrEqual(Math.max(candle.o, candle.c));
        expect(candle.v).toBeGreaterThanOrEqual(0);
        expect(Number.isInteger(candle.v)).toBe(true);
        for (const price of [candle.o, candle.h, candle.l, candle.c]) {
          expect(Math.abs(price * 100 - Math.round(price * 100))).toBeLessThan(1e-6);
          expect(price).toBeGreaterThan(0);
        }
      }
    }
  });

  it('refuses a scenario spec version it does not implement', () => {
    expect(() =>
      generateSeries({
        seed: 'x',
        family: 'trend_up',
        windowSize: 4,
        revealSize: 0,
        scenarioSpecVersion: '2.0',
      }),
    ).toThrow(/scenario spec/i);
  });
});
