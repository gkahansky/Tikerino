export {
  SCENARIO_FAMILIES,
  SCENARIO_SPEC_VERSION,
  GENERATOR_VERSION,
  CANDLE_RULES,
  isScenarioFamily,
  isCandleRule,
  type Candle,
  type ScenarioFamily,
  type CandleRule,
  type GenerateParams,
  type GeneratedSeries,
} from './types.js';

export { fnv1a32, mulberry32, prngFromSeed, type Prng } from './prng.js';
export { generateSeries, cutWindow, cutReveal, round2 } from './generator.js';
export { assertSeriesInvariants, assertNoPostCutCandles } from './invariants.js';
export {
  resolveCandleRule,
  resolveWithMargin,
  isBullish,
  isBearish,
  bodySize,
  upperWick,
  lowerWick,
  type RuleResolution,
} from './rules.js';
export { describeCandles } from './describe.js';
export { checkFamilyExtras, median } from './families.js';
