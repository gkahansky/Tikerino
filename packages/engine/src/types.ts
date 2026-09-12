/** One generated OHLCV bar. Prices are integer cents expressed as 2-decimal numbers. */
export interface Candle {
  /** Position in the full series, 0-based. */
  i: number;
  o: number;
  h: number;
  l: number;
  c: number;
  /** Whole shares. */
  v: number;
}

export const SCENARIO_FAMILIES = [
  'trend_up',
  'trend_down',
  'range_bound',
  'volatile',
  'ambiguous',
] as const;

export type ScenarioFamily = (typeof SCENARIO_FAMILIES)[number];

export function isScenarioFamily(value: unknown): value is ScenarioFamily {
  return (SCENARIO_FAMILIES as readonly unknown[]).includes(value);
}

/** The scenario spec this engine implements. Must match the pack's scenarioSpecVersion. */
export const SCENARIO_SPEC_VERSION = '1.0';

/** Engine release. Stored on every graded answer for audit. */
export const GENERATOR_VERSION = '1.0.0';

export interface GenerateParams {
  seed: string;
  family: ScenarioFamily;
  windowSize: number;
  revealSize: number;
  /** Must equal SCENARIO_SPEC_VERSION; generation refuses otherwise. */
  scenarioSpecVersion: string;
}

export interface GeneratedSeries {
  /** windowSize + revealSize candles, indices 0..N-1. */
  candles: Candle[];
  windowSize: number;
  revealSize: number;
  family: ScenarioFamily;
  seed: string;
  scenarioSpecVersion: string;
  generatorVersion: string;
  /** How many candidate series were rejected before this one satisfied the family extras. */
  resampleAttempts: number;
}

/** Candle-rule enum, closed. Content schema section 5. */
export const CANDLE_RULES = [
  'first_bullish',
  'first_bearish',
  'highest_close',
  'lowest_close',
  'longest_upper_wick',
  'longest_lower_wick',
  'longest_body',
  'highest_volume',
] as const;

export type CandleRule = (typeof CANDLE_RULES)[number];

export function isCandleRule(value: unknown): value is CandleRule {
  return (CANDLE_RULES as readonly unknown[]).includes(value);
}
