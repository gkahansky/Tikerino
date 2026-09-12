/**
 * Types for tikerino-content-schema-v1.md. The schema is the contract between
 * content and code: a new field or enum value here means a schemaVersion bump
 * there and a curriculumVersion minor bump in the pack, together.
 */

export type ScenarioFamilyName =
  | 'trend_up'
  | 'trend_down'
  | 'range_bound'
  | 'volatile'
  | 'ambiguous';

export type CandleRuleName =
  | 'first_bullish'
  | 'first_bearish'
  | 'highest_close'
  | 'lowest_close'
  | 'longest_upper_wick'
  | 'longest_lower_wick'
  | 'longest_body'
  | 'highest_volume';

/** Day-one exercise types. Closed enum; drag/line-placement types are deferred. */
export type ExerciseType = 'multiple_choice' | 'pick_the_candle';

/** Skills closed list, schema section 6. */
export const SKILLS = [
  'chart-axes',
  'price-meaning',
  'percent-change',
  'volume',
  'timeframe',
  'vocab-spread',
  'vocab-orders',
  'vocab-long-short',
  'ohlc',
  'wicks',
  'bullish-bearish',
  'range-body',
  'interpretation-limits',
] as const;

export type Skill = (typeof SKILLS)[number];

export interface ChartRef {
  syntheticSeriesId: string;
  scenarioFamily: ScenarioFamilyName;
  scenarioSpecVersion: string;
  seed: string;
  /** Candles visible through cut point T (indices 0..windowSize-1). */
  windowSize: number;
  /** Post-T candles, served only after answer lock. 0 for lesson cards and guided examples. */
  revealSize: number;
  /** Display string, e.g. "1 day per candle". Never a real date or ticker. */
  timeframeLabel: string;
}

export interface PackMeta {
  productName: string;
  audience: string;
  /** Rendered on every chart, always visible. */
  syntheticDataLabel: string;
  /** Rendered on every reveal screen. Locked requirement. */
  revealDisclaimer: string;
  /** Rendered on every exam screen. No exam mode day one. */
  examDisclaimer: string;
  /** Provenance note; not rendered. */
  authoringNote: string;
}

export interface Topic {
  topicId: string;
  title: string;
  order: number;
  description: string;
}

export interface PrincipleCard {
  title: string;
  /** <= 60 words, no jargon not yet taught. */
  body: string;
  miniChart: ChartRef | null;
}

export interface GuidedStep {
  text: string;
  /** 0-based index into the window candles; the client highlights that candle. */
  annotateCandleIndex: number;
}

export interface GuidedExample {
  chart: ChartRef;
  steps: GuidedStep[];
}

export interface Lesson {
  lessonId: string;
  topicId: string;
  order: number;
  title: string;
  estimatedMinutes: number;
  crownLevelCap: number;
  skills: string[];
  principleCard: PrincipleCard;
  guidedExample: GuidedExample;
  exerciseIds: string[];
}

export interface McOption {
  optionId: string;
  text: string;
}

export interface Feedback {
  /** Each <= 40 words. Shown with the reveal. */
  correct: string;
  incorrect: string;
}

interface ExerciseBase {
  exerciseId: string;
  lessonId: string;
  order: number;
  /** 1 -> x1 XP, 2 -> x2 XP. */
  difficultyTier: number;
  skills: string[];
  /** Null only for vocabulary multiple choice. */
  chart: ChartRef | null;
  prompt: string;
  hint: { text: string };
  feedback: Feedback;
}

export interface MultipleChoiceExercise extends ExerciseBase {
  type: 'multiple_choice';
  options: McOption[];
  correctOptionId: string;
}

export interface PickTheCandleExercise extends ExerciseBase {
  type: 'pick_the_candle';
  target: { rule: CandleRuleName };
}

export type Exercise = MultipleChoiceExercise | PickTheCandleExercise;

export interface ContentPack {
  packVersion: string;
  curriculumVersion: string;
  locale: string;
  generatorVersionCompat: string;
  scenarioSpecVersion: string;
  meta: PackMeta;
  topics: Topic[];
  lessons: Lesson[];
  exercises: Exercise[];
}

/* -------------------------------------------------------------------------- */
/* Client view                                                                */
/* -------------------------------------------------------------------------- */

/**
 * What an exercise's chart looks like to the client: labels only.
 *
 * The seed, family and revealSize are deliberately absent. The engine is
 * framework-neutral and therefore also runs in the browser, so shipping an
 * exercise seed would let anyone regenerate the post-T candles locally and defeat
 * the cut point - the endpoint would be honest and the bundle would not be. The
 * client gets exercise candles from GET /api/exercises/:id/window and nothing else.
 */
export interface ClientChartDisplay {
  syntheticSeriesId: string;
  timeframeLabel: string;
}

/**
 * What the client is allowed to hold. Answer-bearing fields - correctOptionId,
 * target, feedback - are stripped at build time, along with exercise chart seeds.
 * Options, prompts and hints stay: they are the question, not the answer.
 *
 * Lesson charts (principleCard.miniChart, guidedExample.chart) keep their full
 * ChartRef: revealSize is 0 there, so there is no post-T data to protect, and
 * generating them in the browser is what makes the lesson shell work offline.
 */
export type ClientMultipleChoiceExercise = Omit<
  MultipleChoiceExercise,
  'correctOptionId' | 'feedback' | 'chart'
> & { chart: ClientChartDisplay | null };

export type ClientPickTheCandleExercise = Omit<
  PickTheCandleExercise,
  'target' | 'feedback' | 'chart'
> & { chart: ClientChartDisplay | null };

export type ClientExercise = ClientMultipleChoiceExercise | ClientPickTheCandleExercise;

export interface ClientContentPack extends Omit<ContentPack, 'exercises'> {
  exercises: ClientExercise[];
}
