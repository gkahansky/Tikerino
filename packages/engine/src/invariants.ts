import type { Candle } from './types.js';

/**
 * Series invariants, spec section 2.2. Enforced at generation AND re-asserted
 * server-side before serving, so a malformed series can never reach a learner
 * or a graded answer.
 */
export function assertSeriesInvariants(
  candles: Candle[],
  windowSize: number,
  revealSize: number,
): void {
  const expected = windowSize + revealSize;
  if (candles.length !== expected) {
    throw new Error(`Series length ${candles.length}, expected ${expected}`);
  }

  for (let i = 0; i < candles.length; i++) {
    const c = candles[i]!;
    if (c.i !== i) {
      throw new Error(`Candle at position ${i} carries index ${c.i}`);
    }
    if (!Number.isFinite(c.o) || !Number.isFinite(c.h) || !Number.isFinite(c.l) || !Number.isFinite(c.c)) {
      throw new Error(`Candle ${i} has a non-finite price`);
    }
    if (c.l > Math.min(c.o, c.c)) {
      throw new Error(`Candle ${i}: low ${c.l} above min(open, close) ${Math.min(c.o, c.c)}`);
    }
    if (c.h < Math.max(c.o, c.c)) {
      throw new Error(`Candle ${i}: high ${c.h} below max(open, close) ${Math.max(c.o, c.c)}`);
    }
    if (!Number.isInteger(c.v) || c.v < 0) {
      throw new Error(`Candle ${i}: volume ${c.v} is not a non-negative integer`);
    }
    if (c.l <= 0) {
      throw new Error(`Candle ${i}: low ${c.l} is not positive`);
    }
    for (const [name, value] of [
      ['o', c.o],
      ['h', c.h],
      ['l', c.l],
      ['c', c.c],
    ] as const) {
      const cents = value * 100;
      if (Math.abs(cents - Math.round(cents)) > 1e-6) {
        throw new Error(`Candle ${i}: ${name} ${value} is not integer cents`);
      }
    }
  }
}

/**
 * Hard guarantee behind the negative CI test: throws if any candle at or beyond
 * the cut point is present. Called on the exact array the window endpoint serialises.
 */
export function assertNoPostCutCandles(candles: Candle[], windowSize: number): void {
  if (candles.length > windowSize) {
    throw new Error(
      `Window payload carries ${candles.length} candles for windowSize ${windowSize}`,
    );
  }
  for (const c of candles) {
    if (c.i > windowSize - 1) {
      throw new Error(`Window payload leaks post-T candle at index ${c.i} (T = ${windowSize - 1})`);
    }
  }
}
