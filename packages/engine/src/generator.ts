import { prngFromSeed, type Prng } from './prng.js';
import { checkFamilyExtras, drawFamilyParams, type FamilyParams } from './families.js';
import { assertSeriesInvariants } from './invariants.js';
import {
  GENERATOR_VERSION,
  SCENARIO_SPEC_VERSION,
  type Candle,
  type GenerateParams,
  type GeneratedSeries,
  type ScenarioFamily,
} from './types.js';

/** Round to integer cents. Applied at every step so replays never diverge on floats. */
export function round2(x: number): number {
  return Math.round(x * 100) / 100;
}

/** Guard against a pathological walk taking a price to zero or below. */
const MIN_PRICE = 0.05;

/**
 * Cap on resampling. The extras are common enough that a handful of attempts is
 * typical; a seed that cannot satisfy its family in this many tries is a content
 * bug (fix the seed, per content schema section 5) rather than something to paper over.
 */
const MAX_RESAMPLE_ATTEMPTS = 200;

/** A lognormal ratio of 1.0 maps here, near the bottom of the 1000-9000 band. */
const MEDIAN_VOLUME = 2000;
const MIN_VOLUME = 1000;
/** Above this, growth is compressed so the band's ceiling is approached, never crossed. */
const VOLUME_SOFT_CEILING = 8000;
const VOLUME_MAX = 9000;

/**
 * Volume mapping, spec section 2.3: "baseline lognormal around 1.0 (scaled to
 * 1000-9000 integer shares), multiplied 1.5-2.5x on candles with large absolute moves".
 *
 * Two constraints from elsewhere in the spec pin this down, and both are easy to
 * break by accident:
 *
 *  1. `volatile` requires a volume spike of >= 2.5x the window median. That is only
 *     reachable inside a 1000-9000 band if the median sits near the BOTTOM of it -
 *     a median of 2000 makes a 2.5x spike 5000, comfortably inside. A mid-band
 *     median (say 3900) makes the requirement arithmetically impossible, because
 *     2.5x would be 9750.
 *  2. `highest_volume` must resolve to a unique candle with margin, so the map must
 *     be strictly increasing. A hard clamp is not: every clamped candle ties at the
 *     bound.
 *
 * So: linear through the working range (which preserves the 2.5x ratio), a floor at
 * 1000 (safe to clamp - no rule selects the lowest volume), and a strictly
 * increasing compression above 8000 that approaches 9000 without reaching it.
 */
function volumeFromRatio(ratio: number): number {
  const raw = Math.max(MEDIAN_VOLUME * ratio, MIN_VOLUME);
  if (raw < VOLUME_SOFT_CEILING) return Math.round(raw);
  const overflow = raw - VOLUME_SOFT_CEILING;
  const headroom = VOLUME_MAX - VOLUME_SOFT_CEILING;
  return Math.round(VOLUME_SOFT_CEILING + headroom * (1 - Math.exp(-overflow / 2000)));
}

interface Candidate {
  candles: Candle[];
  startPrice: number;
  params: FamilyParams;
}

/**
 * One candidate series. Every branch draws the same number of values from the
 * stream regardless of which way it goes, so the stream position after a candle
 * never depends on that candle's outcome.
 */
function drawCandidate(
  prng: Prng,
  family: ScenarioFamily,
  totalCandles: number,
): Candidate {
  const startPrice = round2(prng.uniform(20, 80));
  const params = drawFamilyParams(family, prng);
  const { drift, vol, counterTrendProbability, meanReversion, band } = params;

  const candles: Candle[] = [];
  let prevClose = startPrice;

  for (let i = 0; i < totalCandles; i++) {
    // --- close -------------------------------------------------------------
    const reversion =
      meanReversion > 0 ? meanReversion * ((startPrice - prevClose) / prevClose) : 0;
    const shock = prng.normal() * vol;
    let close = prevClose * (1 + drift + reversion + shock);

    if (band > 0) {
      // Reflect back into the band rather than clamping to its edge: clamping
      // would park several candles on the identical price and create ties.
      const dev = (close - startPrice) / startPrice;
      if (Math.abs(dev) > band) {
        const reflected = Math.sign(dev) * (2 * band - Math.abs(dev));
        const held = Math.abs(reflected) > band ? Math.sign(dev) * band * 0.98 : reflected;
        close = startPrice * (1 + held);
      }
    }

    // --- open --------------------------------------------------------------
    // "open = previous close + small gap (normal(0, 0.3%))"
    const gap = prng.normal() * 0.003;
    let open = prevClose * (1 + gap);

    // --- counter-trend candles (trend families, p = 0.25) -------------------
    // The draw is unconditional; only its effect is conditional.
    const forceCounter = prng.bool(counterTrendProbability);
    if (forceCounter && counterTrendProbability > 0) {
      const magnitude = Math.max(Math.abs(close - open), open * vol * 0.15);
      close = drift > 0 ? open - magnitude : open + magnitude;
    }

    open = Math.max(round2(open), MIN_PRICE);
    close = Math.max(round2(close), MIN_PRICE);

    // --- wicks, scaled to family volatility --------------------------------
    const upperDraw = Math.abs(prng.normal()) * vol * 0.7;
    const lowerDraw = Math.abs(prng.normal()) * vol * 0.7;
    const bodyTop = Math.max(open, close);
    const bodyBottom = Math.min(open, close);
    const high = round2(bodyTop * (1 + upperDraw));
    const low = Math.max(round2(bodyBottom * (1 - lowerDraw)), 0.01);

    // --- volume ------------------------------------------------------------
    const ratio = Math.exp(prng.normal() * 0.3);
    const spikeMultiplier = prng.uniform(1.5, 2.5);
    const moveSize = Math.abs(close - open) / open;
    const isLargeMove = moveSize >= 1.2 * vol;
    const v = volumeFromRatio(isLargeMove ? ratio * spikeMultiplier : ratio);

    candles.push({
      i,
      o: open,
      // Rounding can pull high below the body top (or low above the body bottom)
      // by a cent; re-assert the invariant rather than shipping a broken candle.
      h: Math.max(high, bodyTop),
      l: Math.min(low, bodyBottom),
      c: close,
      v,
    });

    prevClose = close;
  }

  return { candles, startPrice, params };
}

/**
 * Generate the full series for a chart reference. Deterministic: the same
 * (seed, family, scenarioSpecVersion, windowSize, revealSize) yields the same
 * candles, bit for bit, forever.
 */
export function generateSeries(params: GenerateParams): GeneratedSeries {
  const { seed, family, windowSize, revealSize, scenarioSpecVersion } = params;

  if (scenarioSpecVersion !== SCENARIO_SPEC_VERSION) {
    throw new Error(
      `Engine implements scenario spec ${SCENARIO_SPEC_VERSION}, pack asks for ${scenarioSpecVersion}`,
    );
  }
  if (!Number.isInteger(windowSize) || windowSize <= 0) {
    throw new Error(`windowSize must be a positive integer, got ${windowSize}`);
  }
  if (!Number.isInteger(revealSize) || revealSize < 0) {
    throw new Error(`revealSize must be a non-negative integer, got ${revealSize}`);
  }

  const total = windowSize + revealSize;
  const prng = prngFromSeed(seed);

  let attempts = 0;
  let lastReason: string | null = null;

  // "if a candidate series fails, resample using continued PRNG draws (never
  // reseed - that would break seed->series uniqueness)".
  while (attempts < MAX_RESAMPLE_ATTEMPTS) {
    const candidate = drawCandidate(prng, family, total);
    const reason = checkFamilyExtras(family, candidate.candles.slice(0, windowSize));
    if (reason === null) {
      assertSeriesInvariants(candidate.candles, windowSize, revealSize);
      return {
        candles: candidate.candles,
        windowSize,
        revealSize,
        family,
        seed,
        scenarioSpecVersion,
        generatorVersion: GENERATOR_VERSION,
        resampleAttempts: attempts,
      };
    }
    lastReason = reason;
    attempts++;
  }

  throw new Error(
    `Seed "${seed}" could not satisfy family "${family}" in ${MAX_RESAMPLE_ATTEMPTS} attempts (last: ${lastReason}). ` +
      `Per content schema section 5 the seed changes, never the generator.`,
  );
}

/** The candles the learner may see: indices 0..windowSize-1. Cut point T is windowSize-1. */
export function cutWindow(series: GeneratedSeries): Candle[] {
  return series.candles.slice(0, series.windowSize);
}

/** The post-T candles. Server-only until an answer is recorded. */
export function cutReveal(series: GeneratedSeries): Candle[] {
  return series.candles.slice(series.windowSize);
}
