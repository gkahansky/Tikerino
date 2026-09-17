/**
 * Progress, XP, streaks and the offline answer queue.
 *
 * Framework-neutral: no React, no direct `localStorage` reference. The storage
 * adapter is injected, so the React Native port swaps in AsyncStorage and this
 * file is unchanged. Day one the web client injects a localStorage adapter.
 */

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface LessonProgress {
  /** Exercise ids answered correctly at least once. */
  completedExerciseIds: string[];
  /** Every exercise in the lesson answered correctly. */
  completed: boolean;
  /** Crown level, capped by the lesson's crownLevelCap. */
  crownLevel: number;
  xpEarned: number;
}

export interface AnswerRecord {
  exerciseId: string;
  correct: boolean;
  xp: number;
  answeredAt: string;
  hintUsed: boolean;
}

/**
 * An answer captured while offline. It is locked locally - the learner cannot
 * change it or see the reveal - until the server grades it (deferred reveal).
 */
export interface PendingAnswer {
  subjectId: string;
  exerciseId: string;
  answer: { selectedOptionId: string } | { selectedCandleIndex: number };
  hintUsed: boolean;
  timeToAnswerMs: number;
  capturedOffline: true;
  /** Pins the curriculum the learner actually saw. Also the idempotency key. */
  assignmentSnapshotAt: string;
}

export interface StreakState {
  current: number;
  longest: number;
  /** Local calendar day, YYYY-MM-DD, of the last graded answer. */
  lastActiveDay: string | null;
}

/**
 * How a lesson is delivered: the principle card and guided example read as text,
 * or narrated over a chart that draws itself candle by candle. The exercises are
 * identical either way - the graded call is the product, and narration is only a
 * different way into the lesson before it.
 */
export type LessonMode = 'text' | 'narrated';

/**
 * What a learner gets before they have expressed a preference.
 *
 * Narrated, per the architecture record (Guy, 12 Sep: "Narration should be
 * default"). It is deliberately a separate constant from the stored value: an
 * explicit pick is stored and always wins, so changing this default never
 * overrides someone who has already chosen.
 */
export const DEFAULT_LESSON_MODE: LessonMode = 'narrated';

export interface ProgressState {
  version: 1;
  subjectId: string;
  onboardingComplete: boolean;
  totalXp: number;
  streak: StreakState;
  lessons: Record<string, LessonProgress>;
  answers: Record<string, AnswerRecord>;
  pending: PendingAnswer[];
  /**
   * The learner's explicit choice, or null if they have never made one.
   *
   * Null is not the same as the default value: it is the difference between
   * "has not chosen" and "chose narrated". Storing it that way is what lets the
   * default move without silently rewriting anyone's decision, and it is why
   * progress saved before this field existed resolves to the default rather
   * than to a choice nobody made.
   */
  lessonMode: LessonMode | null;
}

const STORAGE_KEY = 'tikerino.progress.v1';

export function emptyProgress(subjectId: string): ProgressState {
  return {
    version: 1,
    subjectId,
    onboardingComplete: false,
    totalXp: 0,
    streak: { current: 0, longest: 0, lastActiveDay: null },
    lessons: {},
    answers: {},
    pending: [],
    lessonMode: null,
  };
}

/** The mode to deliver a lesson in: the explicit choice if there is one. */
export function resolveLessonMode(state: ProgressState): LessonMode {
  return state.lessonMode ?? DEFAULT_LESSON_MODE;
}

/**
 * Record an explicit choice. Writing the same mode twice is not a no-op in
 * meaning: it turns "happens to be on the default" into "chose this", which is
 * what stops a later change of default from moving them.
 */
export function setLessonMode(state: ProgressState, mode: LessonMode): ProgressState {
  return { ...state, lessonMode: mode };
}

/** Has the learner ever chosen, as opposed to being carried by the default? */
export function hasChosenLessonMode(state: ProgressState): boolean {
  return state.lessonMode !== null;
}

/** Local calendar day. Streaks are a human, local-timezone idea, not a UTC one. */
export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysBetween(fromKey: string, toKey: string): number {
  const from = new Date(`${fromKey}T00:00:00`);
  const to = new Date(`${toKey}T00:00:00`);
  return Math.round((to.getTime() - from.getTime()) / 86_400_000);
}

/**
 * Same day: no change. Next day: +1. A longer gap restarts at 1. The streak
 * advances on graded activity, so an offline answer moves it when it is
 * acknowledged, not when it was tapped.
 */
export function advanceStreak(streak: StreakState, today: string = dayKey()): StreakState {
  if (streak.lastActiveDay === today) return streak;

  const gap = streak.lastActiveDay === null ? Number.POSITIVE_INFINITY : daysBetween(streak.lastActiveDay, today);
  const current = gap === 1 ? streak.current + 1 : 1;

  return {
    current,
    longest: Math.max(streak.longest, current),
    lastActiveDay: today,
  };
}

/** A streak shown on the profile screen has lapsed if the learner missed a day. */
export function streakForDisplay(streak: StreakState, today: string = dayKey()): number {
  if (streak.lastActiveDay === null) return 0;
  const gap = daysBetween(streak.lastActiveDay, today);
  return gap <= 1 ? streak.current : 0;
}

export interface RecordAnswerInput {
  exerciseId: string;
  lessonId: string;
  /** Every exercise id belonging to the lesson, so completion can be decided. */
  lessonExerciseIds: string[];
  crownLevelCap: number;
  correct: boolean;
  xp: number;
  hintUsed: boolean;
  at?: Date;
}

/**
 * Fold one graded answer into progress. Pure: returns a new state.
 *
 * XP is credited once per exercise - the first time it is answered - so replaying
 * a lesson cannot farm XP. Re-answering correctly still counts for completion and
 * for the streak.
 */
export function recordAnswer(state: ProgressState, input: RecordAnswerInput): ProgressState {
  const at = input.at ?? new Date();
  const alreadyScored = state.answers[input.exerciseId] !== undefined;

  const lesson: LessonProgress = state.lessons[input.lessonId] ?? {
    completedExerciseIds: [],
    completed: false,
    crownLevel: 0,
    xpEarned: 0,
  };

  const completedExerciseIds =
    input.correct && !lesson.completedExerciseIds.includes(input.exerciseId)
      ? [...lesson.completedExerciseIds, input.exerciseId]
      : lesson.completedExerciseIds;

  const wasCompleted = lesson.completed;
  const nowCompleted = input.lessonExerciseIds.every((id) => completedExerciseIds.includes(id));

  // A crown is earned the moment a lesson goes from unfinished to finished,
  // capped by the lesson's crownLevelCap.
  const crownLevel =
    !wasCompleted && nowCompleted
      ? Math.min(lesson.crownLevel + 1, input.crownLevelCap)
      : lesson.crownLevel;

  const awardedXp = alreadyScored ? 0 : input.xp;

  return {
    ...state,
    totalXp: state.totalXp + awardedXp,
    streak: advanceStreak(state.streak, dayKey(at)),
    lessons: {
      ...state.lessons,
      [input.lessonId]: {
        completedExerciseIds,
        completed: nowCompleted,
        crownLevel,
        xpEarned: lesson.xpEarned + awardedXp,
      },
    },
    answers: {
      ...state.answers,
      [input.exerciseId]: {
        exerciseId: input.exerciseId,
        correct: input.correct,
        xp: awardedXp,
        answeredAt: at.toISOString(),
        hintUsed: input.hintUsed,
      },
    },
  };
}

export function queuePendingAnswer(state: ProgressState, pending: PendingAnswer): ProgressState {
  const isDuplicate = state.pending.some(
    (p) =>
      p.exerciseId === pending.exerciseId &&
      p.assignmentSnapshotAt === pending.assignmentSnapshotAt,
  );
  if (isDuplicate) return state;
  return { ...state, pending: [...state.pending, pending] };
}

export function dropPendingAnswer(state: ProgressState, exerciseId: string): ProgressState {
  return { ...state, pending: state.pending.filter((p) => p.exerciseId !== exerciseId) };
}

/** Lesson n is open when lesson n-1 is complete. Lesson 0 is always open. */
export function isLessonUnlocked(
  state: ProgressState,
  orderedLessonIds: string[],
  lessonId: string,
): boolean {
  const index = orderedLessonIds.indexOf(lessonId);
  if (index <= 0) return true;
  const previous = orderedLessonIds[index - 1]!;
  return state.lessons[previous]?.completed === true;
}

/* -------------------------------------------------------------------------- */
/* Persistence                                                                */
/* -------------------------------------------------------------------------- */

export function loadProgress(storage: StorageAdapter, subjectId: string): ProgressState {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress(subjectId);
    const parsed = JSON.parse(raw) as ProgressState;
    if (parsed.version !== 1 || typeof parsed.subjectId !== 'string') {
      return emptyProgress(subjectId);
    }
    return { ...emptyProgress(parsed.subjectId), ...parsed };
  } catch {
    // Corrupt or unreadable storage must not brick the app; start clean.
    return emptyProgress(subjectId);
  }
}

export function saveProgress(storage: StorageAdapter, state: ProgressState): void {
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private browsing or a full quota. Losing progress is bad; crashing is worse.
  }
}

export function clearProgress(storage: StorageAdapter): void {
  try {
    storage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

/** Stable anonymous id. No accounts day one; this is the audit's subjectId. */
export function ensureSubjectId(storage: StorageAdapter, generate: () => string): string {
  const key = 'tikerino.subjectId.v1';
  try {
    const existing = storage.getItem(key);
    if (existing) return existing;
    const created = generate();
    storage.setItem(key, created);
    return created;
  } catch {
    return generate();
  }
}
