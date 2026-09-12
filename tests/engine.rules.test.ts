import { describe, expect, it } from 'vitest';

import {
  SCENARIO_SPEC_VERSION,
  cutReveal,
  cutWindow,
  describeCandles,
  generateSeries,
  resolveCandleRule,
  type Candle,
} from '@tikerino/engine';

/** Hand-built window, so each rule's expected answer is obvious by inspection. */
const candles: Candle[] = [
  { i: 0, o: 10.0, h: 10.5, l: 9.8, c: 10.2, v: 1000 }, // bullish
  { i: 1, o: 10.2, h: 10.3, l: 9.0, c: 9.1, v: 5000 }, // first bearish
  { i: 2, o: 9.1, h: 12.0, l: 9.0, c: 9.4, v: 2000 }, // longest upper wick
  { i: 3, o: 9.4, h: 11.9, l: 9.3, c: 11.8, v: 3000 }, // longest body, highest close
  { i: 4, o: 11.8, h: 11.9, l: 7.5, c: 8.2, v: 9000 }, // lowest close, longest lower wick, most volume
];

describe('candle rules', () => {
  it.each([
    ['first_bullish', 0],
    ['first_bearish', 1],
    ['highest_close', 3],
    ['lowest_close', 4],
    ['longest_upper_wick', 2],
    ['longest_lower_wick', 4],
    ['longest_body', 4],
    ['highest_volume', 4],
  ] as const)('%s resolves to candle %i', (rule, expected) => {
    expect(resolveCandleRule(rule, candles)).toBe(expected);
  });

  it('breaks argmax ties on the earliest index', () => {
    const tied: Candle[] = [
      { i: 0, o: 1, h: 2, l: 1, c: 2, v: 100 },
      { i: 1, o: 1, h: 2, l: 1, c: 2, v: 100 },
    ];
    expect(resolveCandleRule('highest_close', tied)).toBe(0);
    expect(resolveCandleRule('highest_volume', tied)).toBe(0);
  });

  it('throws rather than guessing when a first_* rule matches nothing', () => {
    const allFlat: Candle[] = [{ i: 0, o: 5, h: 5, l: 5, c: 5, v: 10 }];
    expect(() => resolveCandleRule('first_bullish', allFlat)).toThrow(/matches no candle/);
  });

  it('resolves over window candles only', () => {
    const series = generateSeries({
      seed: 'rules/window-only',
      family: 'trend_up',
      windowSize: 6,
      revealSize: 6,
      scenarioSpecVersion: SCENARIO_SPEC_VERSION,
    });
    const index = resolveCandleRule('highest_close', cutWindow(series));
    expect(index).toBeLessThan(6);

    // A reveal candle may well close higher; that must not change the answer.
    const revealMax = Math.max(...cutReveal(series).map((c) => c.c));
    const windowMax = Math.max(...cutWindow(series).map((c) => c.c));
    expect(cutWindow(series)[index]!.c).toBe(windowMax);
    expect(revealMax).toBeDefined();
  });
});

describe('describeCandles', () => {
  const lines = describeCandles(candles, '1 day per candle');

  it('produces one line per candle', () => {
    expect(lines).toHaveLength(candles.length);
  });

  it('states direction in words, not only colour', () => {
    expect(lines[0]).toContain('Bullish');
    expect(lines[1]).toContain('Bearish');
  });

  it('gives every OHLC value and the volume', () => {
    expect(lines[0]).toContain('Open 10.00');
    expect(lines[0]).toContain('close 10.20');
    expect(lines[0]).toContain('high 10.50');
    expect(lines[0]).toContain('low 9.80');
    expect(lines[0]).toContain('Volume 1,000');
  });

  it('describes body size against the range', () => {
    expect(lines[0]).toMatch(/body is \d+% of the range/);
  });

  it('compares volume to the median rather than quoting a bare number', () => {
    expect(lines[4]).toContain('above the typical volume');
  });

  it('uses the timeframe label as the period each candle covers', () => {
    expect(lines[0]).toContain('1 day');
    expect(lines[0]).not.toContain('per candle');
  });

  it('positions each candle for a screen reader', () => {
    expect(lines[0]).toContain('Candle 1 of 5');
    expect(lines[4]).toContain('Candle 5 of 5');
  });
});

describe('window cutting', () => {
  it('splits exactly at T = windowSize - 1', () => {
    const series = generateSeries({
      seed: 'cut/test',
      family: 'range_bound',
      windowSize: 10,
      revealSize: 4,
      scenarioSpecVersion: SCENARIO_SPEC_VERSION,
    });
    const window = cutWindow(series);
    const reveal = cutReveal(series);

    expect(window).toHaveLength(10);
    expect(reveal).toHaveLength(4);
    expect(window.at(-1)!.i).toBe(9);
    expect(reveal[0]!.i).toBe(10);
    expect([...window, ...reveal]).toEqual(series.candles);
  });

  it('returns an empty reveal when revealSize is 0', () => {
    const series = generateSeries({
      seed: 'cut/no-reveal',
      family: 'trend_up',
      windowSize: 8,
      revealSize: 0,
      scenarioSpecVersion: SCENARIO_SPEC_VERSION,
    });
    expect(cutReveal(series)).toEqual([]);
  });
});
