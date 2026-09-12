import {
  SKILLS,
  type ChartRef,
  type ContentPack,
  type Exercise,
  type Lesson,
  type Topic,
} from './types.js';

const SCENARIO_FAMILIES = [
  'trend_up',
  'trend_down',
  'range_bound',
  'volatile',
  'ambiguous',
] as const;

const CANDLE_RULES = [
  'first_bullish',
  'first_bearish',
  'highest_close',
  'lowest_close',
  'longest_upper_wick',
  'longest_lower_wick',
  'longest_body',
  'highest_volume',
] as const;

const EXERCISE_TYPES = ['multiple_choice', 'pick_the_candle'] as const;

/** Schema section 3: principle card bodies. */
const MAX_PRINCIPLE_WORDS = 60;
/** Schema section 4: each feedback string. */
const MAX_FEEDBACK_WORDS = 40;

export class ContentValidationError extends Error {
  readonly issues: string[];
  constructor(issues: string[]) {
    super(
      `Content pack failed validation (${issues.length} issue${issues.length === 1 ? '' : 's'}):\n` +
        issues.map((i) => `  - ${i}`).join('\n'),
    );
    this.name = 'ContentValidationError';
    this.issues = issues;
  }
}

export function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/**
 * Minimal semver-range check for `generatorVersionCompat`, which the schema
 * documents in the single form `">=1.0.0 <2.0.0"`. Deliberately not a semver
 * dependency: these packages stay dependency-free so they port to React Native
 * unchanged. Anything outside that two-clause form is rejected rather than guessed at.
 */
export function satisfiesRange(version: string, range: string): boolean {
  const parse = (v: string): [number, number, number] => {
    const m = /^(\d+)\.(\d+)\.(\d+)$/.exec(v.trim());
    if (!m) throw new Error(`Not a semver version: "${v}"`);
    return [Number(m[1]), Number(m[2]), Number(m[3])];
  };
  const cmp = (a: [number, number, number], b: [number, number, number]): number =>
    a[0] - b[0] || a[1] - b[1] || a[2] - b[2];

  const actual = parse(version);
  const clauses = range.trim().split(/\s+/);

  return clauses.every((clause) => {
    const m = /^(>=|<=|>|<|=)?(\d+\.\d+\.\d+)$/.exec(clause);
    if (!m) throw new Error(`Unsupported version range clause: "${clause}"`);
    const operator = m[1] ?? '=';
    const bound = parse(m[2]!);
    const c = cmp(actual, bound);
    switch (operator) {
      case '>=':
        return c >= 0;
      case '<=':
        return c <= 0;
      case '>':
        return c > 0;
      case '<':
        return c < 0;
      default:
        return c === 0;
    }
  });
}

function validateChartRef(
  chart: ChartRef,
  where: string,
  issues: string[],
  expectedSpecVersion: string,
): void {
  if (typeof chart.syntheticSeriesId !== 'string' || chart.syntheticSeriesId.length === 0) {
    issues.push(`${where}: syntheticSeriesId must be a non-empty string`);
  }
  if (!(SCENARIO_FAMILIES as readonly string[]).includes(chart.scenarioFamily)) {
    issues.push(`${where}: unknown scenarioFamily "${chart.scenarioFamily}"`);
  }
  if (chart.scenarioSpecVersion !== expectedSpecVersion) {
    issues.push(
      `${where}: scenarioSpecVersion "${chart.scenarioSpecVersion}" does not match the pack's "${expectedSpecVersion}"`,
    );
  }
  if (typeof chart.seed !== 'string' || chart.seed.length === 0) {
    issues.push(`${where}: seed must be a non-empty string`);
  }
  if (!Number.isInteger(chart.windowSize) || chart.windowSize <= 0) {
    issues.push(`${where}: windowSize must be an integer > 0`);
  }
  if (!Number.isInteger(chart.revealSize) || chart.revealSize < 0) {
    issues.push(`${where}: revealSize must be an integer >= 0`);
  }
  if (typeof chart.timeframeLabel !== 'string' || chart.timeframeLabel.length === 0) {
    issues.push(`${where}: timeframeLabel must be a non-empty string`);
  }
}

function validateTopics(topics: Topic[], issues: string[]): Set<string> {
  const ids = new Set<string>();
  if (!Array.isArray(topics) || topics.length !== 2) {
    issues.push(`topics: MVP requires exactly 2 topics, found ${topics?.length ?? 'none'}`);
  }
  for (const topic of topics ?? []) {
    if (ids.has(topic.topicId)) issues.push(`topics: duplicate topicId "${topic.topicId}"`);
    ids.add(topic.topicId);
    if (!/^[a-z0-9-]+$/.test(topic.topicId)) {
      issues.push(`topics: topicId "${topic.topicId}" is not kebab-case`);
    }
    if (!Number.isInteger(topic.order)) {
      issues.push(`topic ${topic.topicId}: order must be an integer`);
    }
  }
  return ids;
}

function validateLessons(
  lessons: Lesson[],
  topicIds: Set<string>,
  exerciseIds: Set<string>,
  specVersion: string,
  issues: string[],
): Set<string> {
  const ids = new Set<string>();
  for (const lesson of lessons ?? []) {
    const where = `lesson ${lesson.lessonId}`;
    if (ids.has(lesson.lessonId)) issues.push(`lessons: duplicate lessonId "${lesson.lessonId}"`);
    ids.add(lesson.lessonId);

    if (!/^[a-z0-9-]+$/.test(lesson.lessonId)) {
      issues.push(`${where}: lessonId is not kebab-case`);
    }
    if (!topicIds.has(lesson.topicId)) {
      issues.push(`${where}: topicId "${lesson.topicId}" does not resolve`);
    }
    if (!Number.isInteger(lesson.order)) issues.push(`${where}: order must be an integer`);
    if (!Number.isInteger(lesson.estimatedMinutes) || lesson.estimatedMinutes <= 0) {
      issues.push(`${where}: estimatedMinutes must be a positive integer`);
    }
    if (
      !Number.isInteger(lesson.crownLevelCap) ||
      lesson.crownLevelCap < 0 ||
      lesson.crownLevelCap > 5
    ) {
      issues.push(`${where}: crownLevelCap must be an integer 0-5`);
    }
    for (const skill of lesson.skills ?? []) {
      if (!(SKILLS as readonly string[]).includes(skill)) {
        issues.push(`${where}: skill "${skill}" is not in the closed skills list`);
      }
    }

    const card = lesson.principleCard;
    if (!card || typeof card.title !== 'string' || typeof card.body !== 'string') {
      issues.push(`${where}: principleCard needs a title and body`);
    } else {
      const words = countWords(card.body);
      if (words > MAX_PRINCIPLE_WORDS) {
        issues.push(`${where}: principleCard body is ${words} words (max ${MAX_PRINCIPLE_WORDS})`);
      }
      if (card.miniChart) {
        validateChartRef(card.miniChart, `${where} principleCard.miniChart`, issues, specVersion);
        if (card.miniChart.revealSize !== 0) {
          issues.push(`${where}: principleCard.miniChart must have revealSize 0`);
        }
      }
    }

    const guided = lesson.guidedExample;
    if (!guided || !guided.chart || !Array.isArray(guided.steps)) {
      issues.push(`${where}: guidedExample needs a chart and steps`);
    } else {
      validateChartRef(guided.chart, `${where} guidedExample.chart`, issues, specVersion);
      if (guided.chart.revealSize !== 0) {
        issues.push(`${where}: guidedExample.chart must have revealSize 0`);
      }
      if (guided.steps.length === 0) {
        issues.push(`${where}: guidedExample must have at least one step`);
      }
      for (const [n, step] of guided.steps.entries()) {
        if (typeof step.text !== 'string' || step.text.length === 0) {
          issues.push(`${where}: guidedExample step ${n} has no text`);
        }
        if (
          !Number.isInteger(step.annotateCandleIndex) ||
          step.annotateCandleIndex < 0 ||
          step.annotateCandleIndex >= guided.chart.windowSize
        ) {
          issues.push(
            `${where}: guidedExample step ${n} annotateCandleIndex ${step.annotateCandleIndex} is outside 0..${guided.chart.windowSize - 1}`,
          );
        }
      }
    }

    if (!Array.isArray(lesson.exerciseIds) || lesson.exerciseIds.length === 0) {
      issues.push(`${where}: exerciseIds must list 1-3 exercises`);
    } else {
      if (lesson.exerciseIds.length > 3) {
        issues.push(`${where}: ${lesson.exerciseIds.length} exercises, MVP allows at most 3`);
      }
      for (const id of lesson.exerciseIds) {
        if (!exerciseIds.has(id)) issues.push(`${where}: exerciseId "${id}" does not resolve`);
      }
    }
  }
  return ids;
}

/**
 * 'full' is the pack as authored, answers included - what the server and CI load.
 * 'client' is the sanitised pack in the browser bundle, where correctOptionId,
 * target and feedback are absent by design and exercise charts carry labels only.
 */
export type PackVariant = 'full' | 'client';

function validateExercises(
  exercises: Exercise[],
  lessonIds: Set<string>,
  specVersion: string,
  issues: string[],
  variant: PackVariant,
): void {
  const seen = new Set<string>();
  for (const exercise of exercises ?? []) {
    const where = `exercise ${exercise.exerciseId}`;
    if (seen.has(exercise.exerciseId)) {
      issues.push(`exercises: duplicate exerciseId "${exercise.exerciseId}"`);
    }
    seen.add(exercise.exerciseId);

    if (!/^ex-\d{3}$/.test(exercise.exerciseId)) {
      issues.push(`${where}: exerciseId must match ex-NNN`);
    }
    if (!lessonIds.has(exercise.lessonId)) {
      issues.push(`${where}: lessonId "${exercise.lessonId}" does not resolve`);
    }
    if (!(EXERCISE_TYPES as readonly string[]).includes(exercise.type)) {
      issues.push(`${where}: type "${exercise.type}" is outside the day-one closed enum`);
    }
    if (exercise.difficultyTier !== 1 && exercise.difficultyTier !== 2) {
      issues.push(`${where}: difficultyTier must be 1 or 2`);
    }
    for (const skill of exercise.skills ?? []) {
      if (!(SKILLS as readonly string[]).includes(skill)) {
        issues.push(`${where}: skill "${skill}" is not in the closed skills list`);
      }
    }
    if (typeof exercise.prompt !== 'string' || exercise.prompt.length === 0) {
      issues.push(`${where}: prompt must be a non-empty string`);
    }
    if (!exercise.hint || typeof exercise.hint.text !== 'string') {
      issues.push(`${where}: hint.text is required`);
    }
    if (variant === 'client') {
      // These must be ABSENT here: their presence means the sanitiser regressed
      // and the bundle is shipping answers.
      for (const leaked of ['correctOptionId', 'target', 'feedback'] as const) {
        if (leaked in (exercise as unknown as Record<string, unknown>)) {
          issues.push(`${where}: client pack must not carry "${leaked}"`);
        }
      }
    } else if (!exercise.feedback) {
      issues.push(`${where}: feedback is required`);
    } else {
      for (const key of ['correct', 'incorrect'] as const) {
        const text = exercise.feedback[key];
        if (typeof text !== 'string' || text.length === 0) {
          issues.push(`${where}: feedback.${key} must be a non-empty string`);
          continue;
        }
        const words = countWords(text);
        if (words > MAX_FEEDBACK_WORDS) {
          issues.push(`${where}: feedback.${key} is ${words} words (max ${MAX_FEEDBACK_WORDS})`);
        }
      }
    }

    if (exercise.chart) {
      if (variant === 'full') {
        validateChartRef(exercise.chart, `${where} chart`, issues, specVersion);
      } else {
        const display = exercise.chart as unknown as Record<string, unknown>;
        if (typeof display.syntheticSeriesId !== 'string' || typeof display.timeframeLabel !== 'string') {
          issues.push(`${where}: client chart needs syntheticSeriesId and timeframeLabel`);
        }
        for (const leaked of ['seed', 'scenarioFamily', 'revealSize', 'windowSize'] as const) {
          if (leaked in display) {
            issues.push(`${where}: client chart must not carry "${leaked}"`);
          }
        }
      }
    }

    if (exercise.type === 'multiple_choice') {
      const options = exercise.options;
      if (!Array.isArray(options) || options.length < 3 || options.length > 4) {
        issues.push(`${where}: multiple_choice needs 3-4 options`);
      } else {
        const optionIds = new Set(options.map((o) => o.optionId));
        if (optionIds.size !== options.length) {
          issues.push(`${where}: duplicate optionId`);
        }
        for (const option of options) {
          if (!/^[a-d]$/.test(option.optionId)) {
            issues.push(`${where}: optionId "${option.optionId}" must be a..d`);
          }
          if (typeof option.text !== 'string' || option.text.length === 0) {
            issues.push(`${where}: option ${option.optionId} has no text`);
          }
        }
        if (variant === 'full' && !optionIds.has(exercise.correctOptionId)) {
          issues.push(
            `${where}: correctOptionId "${exercise.correctOptionId}" is not one of the options`,
          );
        }
      }
    } else if (exercise.type === 'pick_the_candle') {
      if (!exercise.chart) {
        issues.push(`${where}: pick_the_candle requires a chart`);
      }
      if (variant === 'full') {
        const rule = exercise.target?.rule;
        if (!(CANDLE_RULES as readonly string[]).includes(rule)) {
          issues.push(`${where}: target.rule "${rule}" is not a known CandleRule`);
        }
      }
    }
  }
}

/**
 * One reviewed, acknowledged schema violation in the shipped pack.
 *
 * `matches` is a PREFIX of the issue string. Prefix rather than exact text so a
 * reworded count still matches, but narrow enough that a different problem in the
 * same lesson is not silently swallowed.
 */
export interface ContentDeviation {
  id: string;
  matches: string;
  owner: string;
  detail: string;
  suggestedFix: string;
}

export interface ValidateOptions {
  engineGeneratorVersion: string;
  engineScenarioSpecVersion: string;
  /** Reviewed violations to downgrade from fatal to warning. Defaults to none. */
  knownDeviations?: ContentDeviation[];
  /** Defaults to 'full'. Pass 'client' for the sanitised bundle pack. */
  variant?: PackVariant;
}

export interface ValidationResult {
  /** Acknowledged deviations that were found. Callers should print these loudly. */
  warnings: string[];
}

/**
 * Full validation, run by the server at boot and by CI. Throws
 * ContentValidationError listing every problem - the app refuses to run on a
 * pack that does not validate, rather than rendering a half-broken curriculum.
 *
 * The only escape hatch is `knownDeviations`, which never hides a problem: it
 * moves one named, reviewed issue from the throw into the returned warnings.
 */
export function validateContentPack(
  pack: ContentPack,
  options: ValidateOptions,
): ValidationResult {
  const issues: string[] = [];

  for (const key of ['packVersion', 'curriculumVersion'] as const) {
    if (!/^\d+\.\d+\.\d+$/.test(pack[key] ?? '')) {
      issues.push(`${key} must be a semver string, got "${pack[key]}"`);
    }
  }
  if (pack.locale !== 'en') {
    issues.push(`locale must be "en" in the MVP, got "${pack.locale}"`);
  }
  if (pack.scenarioSpecVersion !== options.engineScenarioSpecVersion) {
    issues.push(
      `pack scenarioSpecVersion "${pack.scenarioSpecVersion}" does not match engine "${options.engineScenarioSpecVersion}"`,
    );
  }
  try {
    if (!satisfiesRange(options.engineGeneratorVersion, pack.generatorVersionCompat)) {
      issues.push(
        `engine generatorVersion ${options.engineGeneratorVersion} is outside the pack's generatorVersionCompat "${pack.generatorVersionCompat}"`,
      );
    }
  } catch (error) {
    issues.push(`generatorVersionCompat: ${(error as Error).message}`);
  }

  const meta = pack.meta;
  if (!meta) {
    issues.push('meta is required');
  } else {
    for (const key of [
      'productName',
      'audience',
      'syntheticDataLabel',
      'revealDisclaimer',
      'examDisclaimer',
      'authoringNote',
    ] as const) {
      if (typeof meta[key] !== 'string' || meta[key].length === 0) {
        issues.push(`meta.${key} must be a non-empty string`);
      }
    }
  }

  const topicIds = validateTopics(pack.topics, issues);
  const exerciseIds = new Set((pack.exercises ?? []).map((e) => e.exerciseId));
  const lessonIds = validateLessons(
    pack.lessons,
    topicIds,
    exerciseIds,
    pack.scenarioSpecVersion,
    issues,
  );
  validateExercises(
    pack.exercises,
    lessonIds,
    pack.scenarioSpecVersion,
    issues,
    options.variant ?? 'full',
  );

  // Every exercise must be reachable from exactly one lesson's exerciseIds.
  const referenced = new Map<string, number>();
  for (const lesson of pack.lessons ?? []) {
    for (const id of lesson.exerciseIds ?? []) {
      referenced.set(id, (referenced.get(id) ?? 0) + 1);
    }
  }
  for (const exercise of pack.exercises ?? []) {
    const count = referenced.get(exercise.exerciseId) ?? 0;
    if (count === 0) {
      issues.push(`exercise ${exercise.exerciseId} is not referenced by any lesson`);
    } else if (count > 1) {
      issues.push(`exercise ${exercise.exerciseId} is referenced by ${count} lessons`);
    }
  }

  // Series ids must be unique across the whole pack: they identify a chart in
  // every audit record.
  const seriesIds = new Map<string, string[]>();
  const noteSeries = (chart: ChartRef | null | undefined, owner: string): void => {
    if (!chart) return;
    const owners = seriesIds.get(chart.syntheticSeriesId) ?? [];
    owners.push(owner);
    seriesIds.set(chart.syntheticSeriesId, owners);
  };
  for (const lesson of pack.lessons ?? []) {
    noteSeries(lesson.principleCard?.miniChart, `${lesson.lessonId} principleCard`);
    noteSeries(lesson.guidedExample?.chart, `${lesson.lessonId} guidedExample`);
  }
  for (const exercise of pack.exercises ?? []) {
    noteSeries(exercise.chart, exercise.exerciseId);
  }
  for (const [id, owners] of seriesIds) {
    if (owners.length > 1) {
      issues.push(`syntheticSeriesId "${id}" is used by ${owners.join(', ')}`);
    }
  }

  const deviations = options.knownDeviations ?? [];
  const warnings: string[] = [];
  const blocking: string[] = [];

  for (const issue of issues) {
    const acknowledged = deviations.find((d) => issue.startsWith(d.matches));
    if (acknowledged) {
      warnings.push(`[${acknowledged.id}] ${issue} - owner: ${acknowledged.owner}. ${acknowledged.suggestedFix}`);
    } else {
      blocking.push(issue);
    }
  }

  if (blocking.length > 0) throw new ContentValidationError(blocking);

  return { warnings };
}

/**
 * Schema section 8: "Nothing in the pack may name a real ticker, company, or date."
 * Returns the offending strings so CI can print them. Kept here rather than in a
 * test file so the same rule is available to any future authoring tool.
 */
export function findForbiddenTokens(pack: unknown): string[] {
  const findings: string[] = [];
  const tickerLike = /\b[A-Z]{2,5}\b/g;
  const allowedAllCaps = new Set([
    'OHLC',
    'XP',
    'MVP',
    'CI',
    'A',
    'I',
    'T',
    'US',
    'UI',
    'AA',
  ]);
  const dateLike =
    /\b(\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{2,4}|(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4})\b/;

  const walk = (value: unknown, path: string): void => {
    if (typeof value === 'string') {
      // authoringNote is provenance, never rendered, and legitimately carries a date.
      if (path.endsWith('meta.authoringNote')) return;
      const dateMatch = dateLike.exec(value);
      if (dateMatch) findings.push(`${path}: calendar date "${dateMatch[0]}"`);
      for (const match of value.match(tickerLike) ?? []) {
        if (!allowedAllCaps.has(match)) findings.push(`${path}: ticker-shaped token "${match}"`);
      }
      return;
    }
    if (Array.isArray(value)) {
      value.forEach((item, i) => walk(item, `${path}[${i}]`));
      return;
    }
    if (value && typeof value === 'object') {
      for (const [key, item] of Object.entries(value)) walk(item, path ? `${path}.${key}` : key);
    }
  };

  walk(pack, '');
  return findings;
}
