import type { Prng } from './prng.js';
import type { Candle, ScenarioFamily } from './types.js';

/**
 * Scenario family parameters, spec section 2.3. Drift and volatility are drawn
 * from the seeded stream inside the stated ranges, so each seed gives a distinct
 * but in-family series.
 */
export interface FamilyParams {
  /** Fixed per-series drift per candle, as a fraction. */
  drift: number;
  /** Per-candle stddev of return, as a fraction. */
  vol: number;
  /** Probability a candle is forced against the trend. 0 when the family has no such rule. */
  counterTrendProbability: number;
  /** Mean-reversion pull toward the start price (range_bound only). */
  meanReversion: number;
  /** Half-width of the band the series is held inside (range_bound only). */
  band: number;
}

/**
 * Draw order is canonical and must not be reordered: drift first, then vol.
 * Every family draws exactly two uniforms here so a family swap does not shift
 * the stream for the candles that follow.
 */
export function drawFamilyParams(family: ScenarioFamily, prng: Prng): FamilyParams {
  switch (family) {
    case 'trend_up': {
      const drift = prng.uniform(0.004, 0.009);
      const vol = prng.uniform(0.008, 0.015);
      return { drift, vol, counterTrendProbability: 0.25, meanReversion: 0, band: 0 };
    }
    case 'trend_down': {
      const drift = -prng.uniform(0.004, 0.009);
      const vol = prng.uniform(0.008, 0.015);
      return { drift, vol, counterTrendProbability: 0.25, meanReversion: 0, band: 0 };
    }
    case 'range_bound': {
      // Drift is ~0; the series mean-reverts to the start price inside +/- 3%.
      const drift = prng.uniform(-0.0003, 0.0003);
      const vol = prng.uniform(0.006, 0.012);
      return { drift, vol, counterTrendProbability: 0, meanReversion: 0.25, band: 0.03 };
    }
    case 'volatile': {
      // Spec: drift 0. The draw still happens so the stream position is family-independent.
      prng.uniform(0, 1);
      const vol = prng.uniform(0.018, 0.03);
      return { drift: 0, vol, counterTrendProbability: 0, meanReversion: 0, band: 0 };
    }
    case 'ambiguous': {
      const drift = prng.uniform(-0.001, 0.001);
      const vol = prng.uniform(0.01, 0.02);
      return { drift, vol, counterTrendProbability: 0, meanReversion: 0, band: 0 };
    }
  }
}

const body = (c: Candle): number => Math.abs(c.c - c.o);
const range = (c: Candle): number => c.h - c.l;
const upperWick = (c: Candle): number => c.h - Math.max(c.o, c.c);

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = sorted.length >> 1;
  return sorted.length % 2 === 0 ? (sorted[mid - 1]! + sorted[mid]!) / 2 : sorted[mid]!;
}

export { median };

/**
 * The family "Extras" column, checked over the WINDOW portion only - the learner
 * must be able to see the feature the exercise asks about, so guaranteeing it in
 * the reveal would be useless.
 *
 * Returns null when the candidate is acceptable, or a reason string for diagnostics.
 */
export function checkFamilyExtras(
  family: ScenarioFamily,
  windowCandles: Candle[],
): string | null {
  switch (family) {
    case 'volatile': {
      // "At least one candle with a pronounced upper wick (wick >= 2x body);
      //  one volume spike (>= 2.5x median)."
      const hasWick = windowCandles.some((c) => {
        const b = body(c);
        // A zero body with any upper wick satisfies "wick >= 2x body" trivially;
        // require a visible wick so the feature is actually readable on screen.
        return upperWick(c) >= 2 * b && upperWick(c) > 0.2 * Math.max(range(c), 1e-9);
      });
      if (!hasWick) return 'volatile: no candle with upper wick >= 2x body';
      const medVol = median(windowCandles.map((c) => c.v));
      const hasSpike = windowCandles.some((c) => c.v >= 2.5 * medVol);
      if (!hasSpike) return 'volatile: no volume spike >= 2.5x median';
      return null;
    }
    case 'ambiguous': {
      // "Must contain at least one tiny-body/long-wick candle
      //  (body <= 20% of range, range > 1.5x median range)."
      const medRange = median(windowCandles.map(range));
      const hasTiny = windowCandles.some(
        (c) => range(c) > 0 && body(c) <= 0.2 * range(c) && range(c) > 1.5 * medRange,
      );
      if (!hasTiny) return 'ambiguous: no tiny-body / long-wick candle';
      return null;
    }
    // trend_up / trend_down say counter-trend candles are "allowed" (p=0.25), not
    // required, and range_bound states no extra. Nothing to enforce.
    case 'trend_up':
    case 'trend_down':
    case 'range_bound':
      return null;
  }
}
