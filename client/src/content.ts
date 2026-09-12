import { GENERATOR_VERSION, SCENARIO_SPEC_VERSION } from '@tikerino/engine';
import {
  validateContentPack,
  type ClientContentPack,
  type ClientExercise,
  type Lesson,
  type Topic,
} from '@tikerino/content';

import rawPack from './content/pack.client.json';

/**
 * The sanitised pack, generated from specs/tikerino-content-pack-v0.2.json by
 * scripts/sanitize-content.mjs. It carries no answers and no exercise seeds.
 *
 * Validated here at load: a pack that fails validation throws, and the app shows
 * a refusal screen rather than rendering a curriculum that does not match the
 * schema.
 */
const pack = rawPack as unknown as ClientContentPack;

validateContentPack(pack as never, {
  engineGeneratorVersion: GENERATOR_VERSION,
  engineScenarioSpecVersion: SCENARIO_SPEC_VERSION,
  variant: 'client',
  // The client never sees deviations: the server prints them at boot, and the
  // only one on record does not affect rendering.
  knownDeviations: [
    {
      id: 'lesson-4-principle-card-length',
      matches: 'lesson lesson-4-trading-words: principleCard body is',
      owner: 'content (Instinct)',
      detail: 'See content-deviations.json',
      suggestedFix: 'Trim the card to 60 words or fewer.',
    },
  ],
});

export const contentPack = pack;
export const meta = pack.meta;

export const topics: Topic[] = [...pack.topics].sort((a, b) => a.order - b.order);
export const lessons: Lesson[] = [...pack.lessons].sort((a, b) => a.order - b.order);
export const orderedLessonIds: string[] = lessons.map((l) => l.lessonId);

const exerciseById = new Map<string, ClientExercise>(
  pack.exercises.map((exercise) => [exercise.exerciseId, exercise]),
);

export function getExercise(exerciseId: string): ClientExercise {
  const exercise = exerciseById.get(exerciseId);
  if (!exercise) throw new Error(`Unknown exercise "${exerciseId}"`);
  return exercise;
}

export function getLesson(lessonId: string): Lesson {
  const lesson = pack.lessons.find((l) => l.lessonId === lessonId);
  if (!lesson) throw new Error(`Unknown lesson "${lessonId}"`);
  return lesson;
}

export function lessonsForTopic(topicId: string): Lesson[] {
  return lessons.filter((lesson) => lesson.topicId === topicId);
}

/** Exercises of a lesson, in author order. */
export function exercisesForLesson(lesson: Lesson): ClientExercise[] {
  return lesson.exerciseIds.map(getExercise).sort((a, b) => a.order - b.order);
}
