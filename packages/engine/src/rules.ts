import type { Candle, CandleRule } from './types.js';

const bodySize = (c: Candle): number => Math.abs(c.c - c.o);
const upperWick = (c: Candle): number => c.h - Math.max(c.o, c.c);
const lowerWick = (c: Candle): number => Math.min(c.o, c.c) - c.l;

/** True when the candle closed above its open. */
export const isBullish = (c: Candle): boolean => c.c > c.o;
/** True when the candle closed below its open. */
export const isBearish = (c: Candle): boolean => c.c < c.o;

export { bodySize, upperWick, lowerWick };

/** The quantity each argmax rule maximises. First-match rules return null. */
function metricFor(rule: CandleRule): ((c: Candle) => number) | null {
  switch (rule) {
    case 'highest_close':
      return (c) => c.c;
    case 'lowest_close':
      return (c) => -c.c;
    case 'longest_upper_wick':
      return upperWick;
    case 'longest_lower_wick':
      return lowerWick;
    case 'longest_body':
      return bodySize;
    case 'highest_volume':
      return (c) => c.v;
    case 'first_bullish':
    case 'first_bearish':
      return null;
  }
}

/**
 * Resolve a candle rule over the WINDOW candles only (spec section 3).
 * Tie-break for argmax rules: earliest index. Content CI guarantees no real ties.
 */
export function resolveCandleRule(rule: CandleRule, windowCandles: Candle[]): number {
  if (windowCandles.length === 0) {
    throw new Error(`Cannot resolve rule "${rule}" over an empty window`);
  }

  if (rule === 'first_bullish' || rule === 'first_bearish') {
    const predicate = rule === 'first_bullish' ? isBullish : isBearish;
    const found = windowCandles.findIndex(predicate);
    if (found === -1) {
      throw new Error(`Rule "${rule}" matches no candle in the window`);
    }
    return windowCandles[found]!.i;
  }

  const metric = metricFor(rule)!;
  let bestIndex = 0;
  let bestValue = metric(windowCandles[0]!);
  for (let i = 1; i < windowCandles.length; i++) {
    const value = metric(windowCandles[i]!);
    // Strict > keeps the earliest index on a tie.
    if (value > bestValue) {
      bestValue = value;
      bestIndex = i;
    }
  }
  return windowCandles[bestIndex]!.i;
}

export interface RuleResolution {
  index: number;
  /** Runner-up gap as a fraction of the comparison quantity's window range. */
  margin: number;
  /** False when a second candle matches the winning value exactly. */
  unique: boolean;
}

/**
 * Resolution plus the margin the content CI rule checks: "no near-ties within 1%
 * of range for length rules". For the first_* rules uniqueness is definitional -
 * there is exactly one first match - so the margin is reported as 1.
 */
export function resolveWithMargin(rule: CandleRule, windowCandles: Candle[]): RuleResolution {
  const index = resolveCandleRule(rule, windowCandles);

  const metric = metricFor(rule);
  if (metric === null) {
    return { index, margin: 1, unique: true };
  }

  const values = windowCandles.map(metric).sort((a, b) => b - a);
  const best = values[0]!;
  const second = values[1] ?? best;

  // Scale: the spread of the quantity being compared across the window. For price
  // rules that is the window's own price range, which is what "1% of range" means
  // on a chart the learner is looking at.
  const scale =
    rule === 'highest_volume'
      ? Math.max(...windowCandles.map((c) => c.v)) - Math.min(...windowCandles.map((c) => c.v))
      : Math.max(...windowCandles.map((c) => c.h)) - Math.min(...windowCandles.map((c) => c.l));

  const margin = scale > 0 ? (best - second) / scale : 0;
  return { index, margin, unique: best > second };
}
