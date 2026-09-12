import { validateContentPack, type ContentDeviation } from './validate.js';
import type {
  ClientContentPack,
  ClientExercise,
  ContentPack,
  Exercise,
  Lesson,
  Topic,
} from './types.js';

export interface LoadOptions {
  engineGeneratorVersion: string;
  engineScenarioSpecVersion: string;
  /** Reviewed, acknowledged schema violations. See content-deviations.json. */
  knownDeviations?: ContentDeviation[];
  /** Called once per acknowledged deviation so the host can log it loudly. */
  onWarning?: (message: string) => void;
}

/**
 * Parse and validate a pack. Throws on any schema violation that is not an
 * acknowledged deviation - callers are meant to let that propagate, because a
 * pack that does not validate must stop the process rather than degrade the
 * curriculum silently.
 */
export function loadContentPack(raw: unknown, options: LoadOptions): ContentPack {
  if (typeof raw !== 'object' || raw === null) {
    throw new TypeError('Content pack must be a JSON object');
  }
  const pack = raw as ContentPack;
  const { warnings } = validateContentPack(pack, options);
  for (const warning of warnings) {
    options.onWarning?.(warning);
  }
  return pack;
}

/**
 * Produce the pack the client is allowed to hold.
 *
 * Removed from every exercise:
 *   - `correctOptionId` and `target` - the answer itself;
 *   - `feedback` - it names the right answer in prose, and arrives with grading;
 *   - the chart's `seed`, `scenarioFamily`, `revealSize` and `windowSize` - with a
 *     seed and the (framework-neutral, browser-capable) engine, anyone could
 *     regenerate the post-T candles and walk around the cut point.
 *
 * Kept: prompts, options, hints, principle cards, guided examples and their
 * charts. Those are the question, and the client needs them to work offline.
 */
export function toClientPack(pack: ContentPack): ClientContentPack {
  const exercises: ClientExercise[] = pack.exercises.map((exercise: Exercise) => {
    const chart = exercise.chart
      ? {
          syntheticSeriesId: exercise.chart.syntheticSeriesId,
          timeframeLabel: exercise.chart.timeframeLabel,
        }
      : null;

    if (exercise.type === 'multiple_choice') {
      const { correctOptionId: _correct, feedback: _feedback, chart: _chart, ...rest } = exercise;
      return { ...rest, chart };
    }
    const { target: _target, feedback: _feedback, chart: _chart, ...rest } = exercise;
    return { ...rest, chart };
  });

  return { ...pack, exercises };
}

export interface PackIndex {
  topicsByOrder: Topic[];
  lessonsByOrder: Lesson[];
  lessonById: Map<string, Lesson>;
  exerciseById: Map<string, Exercise>;
  lessonsByTopic: Map<string, Lesson[]>;
}

/** Ordered lookups the path home and lesson screens need. */
export function indexPack(pack: ContentPack): PackIndex {
  const topicsByOrder = [...pack.topics].sort((a, b) => a.order - b.order);
  const lessonsByOrder = [...pack.lessons].sort((a, b) => a.order - b.order);

  const lessonById = new Map(pack.lessons.map((l) => [l.lessonId, l]));
  const exerciseById = new Map(pack.exercises.map((e) => [e.exerciseId, e]));

  const lessonsByTopic = new Map<string, Lesson[]>();
  for (const topic of topicsByOrder) {
    lessonsByTopic.set(
      topic.topicId,
      lessonsByOrder.filter((l) => l.topicId === topic.topicId),
    );
  }

  return { topicsByOrder, lessonsByOrder, lessonById, exerciseById, lessonsByTopic };
}
