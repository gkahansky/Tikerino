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

/** How lessons play: silent text step-through, or narrated with animation. */
export type LessonMode = 'text' | 'narrated';

export const PROGRESSION_RULESET_VERSION = 'prog-rules-v1.0' as const;
export const LESSON_COMPLETION_XP = 25;
/** Daily practice: the first server-confirmed answer of each local day (Guy, 19/9 14:38). */
export const DAILY_PRACTICE_XP = 10 as const;

export interface ProgressState {
  version: 1;
  /** Ruleset the stored awards were made under. Kept as stored on load. */
  progressionRuleset: string;
  /** Canonical semantic-event awards only. Legacy answer XP stays separate. */
  knowledgeIndexXp: number;
  lessonAwards: Record<string, { xp: number; awardedAt: string }>;
  subjectId: string;
  onboardingComplete: boolean;
  lessonMode: LessonMode;
  totalXp: number;
  streak: StreakState;
  lessons: Record<string, LessonProgress>;
  answers: Record<string, AnswerRecord>;
  pending: PendingAnswer[];
  /**
   * Idempotency keys of queued answers the server has confirmed. A ledger:
   * merged as a union, so a confirmed answer can never be re-queued or re-applied
   * by another tab's stale copy.
   */
  confirmed: string[];
  /** Every local day with graded practice. A ledger: only ever grows. */
  practiceDays: string[];
  /** One +10 per local day, keyed by day. A ledger: the first award for a day wins. */
  dailyAwards: Record<string, { xp: number; awardedAt: string }>;
}

const STORAGE_KEY = 'tikerino.progress.v1';

export function emptyProgress(subjectId: string): ProgressState {
  return {
    version: 1,
    progressionRuleset: PROGRESSION_RULESET_VERSION,
    knowledgeIndexXp: 0,
    lessonAwards: {},
    subjectId,
    onboardingComplete: false,
    // Narrated is the default (Guy, 12 Sep 22:16 IDT): users who have never
    // picked a mode get narration; an explicit pick always wins.
    lessonMode: 'narrated',
    totalXp: 0,
    streak: { current: 0, longest: 0, lastActiveDay: null },
    lessons: {},
    answers: {},
    pending: [],
    confirmed: [],
    practiceDays: [],
    dailyAwards: {},
  };
}

/**
 * Local calendar day. Streaks are a human, local-timezone idea, not a UTC one.
 * Pass an IANA timeZone to pin the learner's zone (tests, or a known zone);
 * otherwise the device's own zone is used.
 */
export function dayKey(date: Date = new Date(), timeZone?: string): string {
  if (timeZone) {
    // en-CA formats as YYYY-MM-DD.
    return new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Whole calendar days between two day keys. Pure date arithmetic, so DST cannot skew it. */
export function daysBetween(fromKey: string, toKey: string): number {
  const utc = (key: string): number => {
    const [y, m, d] = key.split('-').map(Number);
    return Date.UTC(y!, m! - 1, d!);
  };
  return Math.round((utc(toKey) - utc(fromKey)) / 86_400_000);
}

/** Add a day to the lifetime practice ledger (sorted, unique). */
export function addPracticeDay(days: string[], day: string): string[] {
  return days.includes(day) ? days : [...days, day].sort();
}

export type ReturnState =
  | { kind: 'new'; lifetimeDays: number }
  | { kind: 'active'; lifetimeDays: number; run: number }
  | { kind: 'returning'; lifetimeDays: number; missedDays: number; lastRun: number };

/**
 * How the learner stands today. A missed day never removes anything: XP,
 * lessons and lifetime practice days are untouched; only the run restarts.
 */
export function returnStateFor(state: ProgressState, today: string = dayKey()): ReturnState {
  const lifetimeDays = state.practiceDays.length;
  const last = state.streak.lastActiveDay;
  if (last === null) return { kind: 'new', lifetimeDays };
  const gap = daysBetween(last, today);
  if (gap <= 1) return { kind: 'active', lifetimeDays, run: state.streak.current };
  return { kind: 'returning', lifetimeDays, missedDays: gap - 1, lastRun: state.streak.current };
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
  /** Learner's IANA zone for the day boundary; defaults to the device zone. */
  timeZone?: string;
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
  const lessonAlreadyAwarded = state.lessonAwards[input.lessonId] !== undefined;
  const awardLesson = !wasCompleted && nowCompleted && !lessonAlreadyAwarded;
  // recordAnswer only ever runs on a server-confirmed grade (online reply or a
  // confirmed offline flush), so the first one of the local day qualifies.
  const today = dayKey(at, input.timeZone);
  const awardDaily = state.dailyAwards[today] === undefined;

  return {
    ...state,
    // Existing per-answer scoring remains available for audit/backward compatibility.
    totalXp: state.totalXp + awardedXp,
    knowledgeIndexXp: state.knowledgeIndexXp + (awardLesson ? LESSON_COMPLETION_XP : 0) + (awardDaily ? DAILY_PRACTICE_XP : 0),
    lessonAwards: awardLesson
      ? { ...state.lessonAwards, [input.lessonId]: { xp: LESSON_COMPLETION_XP, awardedAt: at.toISOString() } }
      : state.lessonAwards,
    streak: advanceStreak(state.streak, today),
    practiceDays: addPracticeDay(state.practiceDays, today),
    dailyAwards: awardDaily
      ? { ...state.dailyAwards, [today]: { xp: DAILY_PRACTICE_XP, awardedAt: at.toISOString() } }
      : state.dailyAwards,
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

/**
 * The lesson-mode preference. Pure; persisted with the rest of progress.
 * Switching mid-lesson is the same write - the lesson screen maps the
 * current position across.
 */
export function setLessonMode(state: ProgressState, mode: LessonMode): ProgressState {
  return state.lessonMode === mode ? state : { ...state, lessonMode: mode };
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

/** The server's idempotency key for one assigned attempt. */
export function pendingKey(item: { exerciseId: string; assignmentSnapshotAt: string }): string {
  return `${item.exerciseId}@${item.assignmentSnapshotAt}`;
}

/** Remove exactly this queued attempt (never a different attempt at the same exercise). */
export function dropPendingAnswer(state: ProgressState, item: { exerciseId: string; assignmentSnapshotAt: string }): ProgressState {
  const key = pendingKey(item);
  return { ...state, pending: state.pending.filter((p) => pendingKey(p) !== key) };
}

/**
 * Apply a queued answer once the server has confirmed its grade. Idempotent on
 * the server's key: a duplicate flush, a second tab, or a replay of the same
 * confirmed answer changes nothing. Progress (+25, the candle) comes only from
 * here, never from the queued answer itself.
 */
export function applyConfirmedAnswer(
  state: ProgressState,
  pending: PendingAnswer,
  graded: Omit<RecordAnswerInput, 'exerciseId' | 'hintUsed'>,
): ProgressState {
  const key = pendingKey(pending);
  const withoutPending = dropPendingAnswer(state, pending);
  if (state.confirmed.includes(key)) return withoutPending;
  const recorded = recordAnswer(withoutPending, { ...graded, exerciseId: pending.exerciseId, hintUsed: pending.hintUsed });
  return { ...recorded, confirmed: [...recorded.confirmed, key] };
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

/**
 * Lesson awards as stored, or backfilled for state saved before awards existed:
 * each lesson already completed is credited once, marked 'migrated', so a
 * returning learner keeps credit and a replay cannot earn it again.
 */
function normaliseLessonAwards(
  stored: unknown,
  lessons: Record<string, LessonProgress> | undefined,
): ProgressState['lessonAwards'] {
  if (stored === undefined || stored === null || typeof stored !== 'object') {
    const backfilled: ProgressState['lessonAwards'] = {};
    for (const [lessonId, lesson] of Object.entries(lessons ?? {})) {
      if (lesson?.completed === true) {
        backfilled[lessonId] = { xp: LESSON_COMPLETION_XP, awardedAt: 'migrated' };
      }
    }
    return backfilled;
  }
  const awards: ProgressState['lessonAwards'] = {};
  for (const [lessonId, award] of Object.entries(stored as Record<string, unknown>)) {
    if (!award || typeof award !== 'object') continue;
    const { xp, awardedAt } = award as { xp?: unknown; awardedAt?: unknown };
    awards[lessonId] = {
      xp: typeof xp === 'number' && Number.isFinite(xp) ? xp : LESSON_COMPLETION_XP,
      awardedAt: typeof awardedAt === 'string' ? awardedAt : 'migrated',
    };
  }
  return awards;
}

function sumLessonAwards(awards: ProgressState['lessonAwards'], daily: ProgressState['dailyAwards'] = {}): number {
  return [...Object.values(awards), ...Object.values(daily)].reduce((total, award) => total + award.xp, 0);
}

/** Stored daily awards only; never backfilled from past practice days. */
function normaliseDailyAwards(stored: unknown): ProgressState['dailyAwards'] {
  const awards: ProgressState['dailyAwards'] = {};
  if (!stored || typeof stored !== 'object') return awards;
  for (const [day, award] of Object.entries(stored as Record<string, unknown>)) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(day) || !award || typeof award !== 'object') continue;
    const { awardedAt } = award as { awardedAt?: unknown };
    awards[day] = { xp: DAILY_PRACTICE_XP, awardedAt: typeof awardedAt === 'string' ? awardedAt : 'migrated' };
  }
  return awards;
}

/**
 * Knowledge Index XP this answer actually credited: the lesson award when this
 * answer is the one that completed the lesson, otherwise 0.
 */
export function lessonXpCreditedByAnswer(state: ProgressState, lessonId: string, exerciseId: string): number {
  const award = state.lessonAwards[lessonId];
  const answer = state.answers[exerciseId];
  return award && answer && award.awardedAt === answer.answeredAt ? award.xp : 0;
}

/** All Knowledge Index XP this answer credited: its lesson award plus the day's +10 if it was the day's first. */
export function xpCreditedByAnswer(state: ProgressState, lessonId: string, exerciseId: string): number {
  const answer = state.answers[exerciseId];
  const daily = answer ? Object.values(state.dailyAwards).find((award) => award.awardedAt === answer.answeredAt) : undefined;
  return lessonXpCreditedByAnswer(state, lessonId, exerciseId) + (daily ? daily.xp : 0);
}

export function loadProgress(storage: StorageAdapter, subjectId: string): ProgressState {
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return emptyProgress(subjectId);
    const parsed = JSON.parse(raw) as ProgressState;
    if (parsed.version !== 1 || typeof parsed.subjectId !== 'string') {
      return emptyProgress(subjectId);
    }
    const lessonAwards = normaliseLessonAwards(parsed.lessonAwards, parsed.lessons);
    const dailyAwards = normaliseDailyAwards(parsed.dailyAwards);
    const confirmed = Array.isArray(parsed.confirmed) ? parsed.confirmed.filter((k) => typeof k === 'string') : [];
    // Older saves had no ledger: rebuild it from the days we can still see.
    const practiceDays = Array.isArray(parsed.practiceDays)
      ? [...new Set(parsed.practiceDays.filter((d) => typeof d === 'string'))].sort()
      : [...new Set([
          ...Object.values(parsed.answers ?? {}).map((a) => (a && typeof a.answeredAt === 'string' ? dayKey(new Date(a.answeredAt)) : null)),
          parsed.streak?.lastActiveDay ?? null,
        ].filter((d): d is string => typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)))].sort();
    const pending = Array.isArray(parsed.pending) ? parsed.pending.filter((p) => !confirmed.includes(pendingKey(p))) : [];
    return {
      ...emptyProgress(parsed.subjectId),
      ...parsed,
      progressionRuleset:
        typeof parsed.progressionRuleset === 'string' ? parsed.progressionRuleset : PROGRESSION_RULESET_VERSION,
      lessonAwards,
      confirmed,
      pending,
      practiceDays,
      dailyAwards,
      // Derived, never trusted from storage: a stored "25" or NaN cannot leak into the index.
      knowledgeIndexXp: sumLessonAwards(lessonAwards, dailyAwards),
    };
  } catch {
    // Corrupt or unreadable storage must not brick the app; start clean.
    return emptyProgress(subjectId);
  }
}

/**
 * Combine two views of the same learner's progress, e.g. this tab's state and
 * what another tab saved since. Awards and answers are ledgers: nothing either
 * side earned is dropped. A lesson award keeps its first award; an answer keeps
 * the most recent attempt, so replay credit checks stay correct.
 */
export function mergeProgress(mine: ProgressState, theirs: ProgressState): ProgressState {
  if (mine.subjectId !== theirs.subjectId) return mine;

  const lessonAwards: ProgressState['lessonAwards'] = { ...theirs.lessonAwards };
  for (const [lessonId, award] of Object.entries(mine.lessonAwards)) {
    const other = lessonAwards[lessonId];
    if (!other || award.awardedAt < other.awardedAt) lessonAwards[lessonId] = award;
  }

  const answers: ProgressState['answers'] = { ...theirs.answers };
  for (const [exerciseId, answer] of Object.entries(mine.answers)) {
    const other = answers[exerciseId];
    if (!other || answer.answeredAt >= other.answeredAt) answers[exerciseId] = answer;
  }

  const lessons: ProgressState['lessons'] = { ...theirs.lessons };
  for (const [lessonId, lesson] of Object.entries(mine.lessons)) {
    const other = lessons[lessonId];
    lessons[lessonId] = other
      ? {
          completedExerciseIds: [...new Set([...other.completedExerciseIds, ...lesson.completedExerciseIds])],
          completed: other.completed || lesson.completed,
          crownLevel: Math.max(other.crownLevel, lesson.crownLevel),
          xpEarned: Math.max(other.xpEarned, lesson.xpEarned),
        }
      : lesson;
  }
  const lessonXp = Object.values(lessons).reduce((total, lesson) => total + lesson.xpEarned, 0);

  const streak =
    (mine.streak.lastActiveDay ?? '') > (theirs.streak.lastActiveDay ?? '')
      ? mine.streak
      : (theirs.streak.lastActiveDay ?? '') > (mine.streak.lastActiveDay ?? '')
        ? theirs.streak
        : {
            current: Math.max(mine.streak.current, theirs.streak.current),
            longest: Math.max(mine.streak.longest, theirs.streak.longest),
            lastActiveDay: mine.streak.lastActiveDay,
          };

  const confirmed = [...new Set([...theirs.confirmed, ...mine.confirmed])];
  const practiceDays = [...new Set([...theirs.practiceDays, ...mine.practiceDays])].sort();
  const dailyAwards: ProgressState['dailyAwards'] = { ...theirs.dailyAwards };
  for (const [day, award] of Object.entries(mine.dailyAwards)) {
    const other = dailyAwards[day];
    if (!other || award.awardedAt < other.awardedAt) dailyAwards[day] = award;
  }
  const pending: PendingAnswer[] = [];
  for (const item of [...mine.pending, ...theirs.pending]) {
    const key = pendingKey(item);
    if (!confirmed.includes(key) && !pending.some((p) => pendingKey(p) === key)) pending.push(item);
  }

  return {
    ...mine,
    onboardingComplete: mine.onboardingComplete || theirs.onboardingComplete,
    totalXp: Math.max(mine.totalXp, theirs.totalXp, lessonXp),
    lessonAwards,
    knowledgeIndexXp: sumLessonAwards(lessonAwards, dailyAwards),
    dailyAwards,
    answers,
    lessons,
    streak,
    pending,
    confirmed,
    practiceDays,
  };
}

export interface PersistResult {
  /** True only when the merged state was written to storage. */
  saved: boolean;
  /** This state merged with whatever another tab saved. Use it as the new state. */
  state: ProgressState;
}

/**
 * Merge-before-save: read what is stored (another tab may have saved since this
 * one loaded), merge it in, then write. Never throws; reports failure instead.
 */
export function persistProgress(storage: StorageAdapter, state: ProgressState): PersistResult {
  let merged = state;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (raw) merged = mergeProgress(state, loadProgress(storage, state.subjectId));
  } catch {
    // Unreadable storage: fall through and try to write this tab's state.
  }
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify(merged));
    return { saved: true, state: merged };
  } catch {
    // Private browsing or a full quota. The caller must tell the learner.
    return { saved: false, state: merged };
  }
}

/** Save with merge-before-save. Returns false when the write failed. */
export function saveProgress(storage: StorageAdapter, state: ProgressState): boolean {
  return persistProgress(storage, state).saved;
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
