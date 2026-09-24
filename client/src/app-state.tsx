import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import {
  applyConfirmedAnswer,
  clearProgress,
  dropPendingAnswer,
  emptyProgress,
  ensureSubjectId,
  loadProgress,
  mergeProgress,
  persistProgress,
  queuePendingAnswer,
  recordAnswer,
  setLessonMode as setLessonModeState,
  type LessonMode,
  streakForDisplay,
  type PendingAnswer,
  type ProgressState,
  type StorageAdapter,
} from '@tikerino/state';

import { ApiError, submitAnswer, OfflineError } from './api';
import { getLesson, orderedLessonIds } from './content';

const browserStorage: StorageAdapter = {
  getItem: (key) => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
  removeItem: (key) => window.localStorage.removeItem(key),
};

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `anon-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
}

export interface GradedAnswerInput {
  exerciseId: string;
  lessonId: string;
  correct: boolean;
  xp: number;
  hintUsed: boolean;
}

interface AppStateValue {
  subjectId: string;
  progress: ProgressState;
  lessonMode: LessonMode;
  setLessonMode: (mode: LessonMode) => void;
  displayStreak: number;
  pendingCount: number;
  /** queued: offline answers wait for the server; confirming: a flush is in flight. */
  syncState: 'idle' | 'queued' | 'confirming';
  /** The last save to this device failed; progress since then is not durable. */
  saveFailed: boolean;
  completeOnboarding: () => void;
  applyGradedAnswer: (input: GradedAnswerInput) => void;
  queueOffline: (pending: PendingAnswer) => void;
  flushPending: () => Promise<void>;
  reset: () => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [subjectId] = useState(() => ensureSubjectId(browserStorage, uuid));
  const [progress, setProgress] = useState<ProgressState>(() =>
    loadProgress(browserStorage, subjectId),
  );

  const [saveFailed, setSaveFailed] = useState(false);

  // Merge-before-save: another tab may have saved since this one loaded. Adopt
  // the merged result so both tabs converge instead of overwriting each other.
  useEffect(() => {
    const result = persistProgress(browserStorage, progress);
    setSaveFailed(!result.saved);
    if (JSON.stringify(result.state) !== JSON.stringify(progress)) setProgress(result.state);
  }, [progress]);

  // Pick up what another tab saved without waiting for this tab's next save.
  useEffect(() => {
    const onStorage = (event: StorageEvent): void => {
      if (event.key !== 'tikerino.progress.v1' || !event.newValue) return;
      setProgress((current) => {
        const merged = mergeProgress(current, loadProgress(browserStorage, current.subjectId));
        return JSON.stringify(merged) === JSON.stringify(current) ? current : merged;
      });
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const setLessonMode = useCallback((mode: LessonMode) => {
    setProgress((current) => setLessonModeState(current, mode));
  }, []);

  const completeOnboarding = useCallback(() => {
    setProgress((current) => ({ ...current, onboardingComplete: true }));
  }, []);

  const applyGradedAnswer = useCallback((input: GradedAnswerInput) => {
    const lesson = getLesson(input.lessonId);
    setProgress((current) =>
      recordAnswer(current, {
        exerciseId: input.exerciseId,
        lessonId: input.lessonId,
        lessonExerciseIds: lesson.exerciseIds,
        crownLevelCap: lesson.crownLevelCap,
        correct: input.correct,
        xp: input.xp,
        hintUsed: input.hintUsed,
      }),
    );
  }, []);

  const queueOffline = useCallback((pending: PendingAnswer) => {
    setProgress((current) => queuePendingAnswer(current, pending));
  }, []);

  /**
   * Send answers captured offline. The reveal for those stays deferred until the
   * server acknowledges them, so this is what unlocks it.
   */
  const [confirming, setConfirming] = useState(false);
  const flushing = useRef(false);
  const pendingRef = useRef(progress.pending);
  pendingRef.current = progress.pending;

  const flushPending = useCallback(async () => {
    // Single flight: the online event and the effect must not run two flushes.
    if (flushing.current || pendingRef.current.length === 0) return;
    flushing.current = true;
    setConfirming(true);
    try {
      for (const pending of [...pendingRef.current]) {
        try {
          const response = await submitAnswer(pending);
          const exerciseLesson = orderedLessonIds.find((lessonId) =>
            getLesson(lessonId).exerciseIds.includes(pending.exerciseId),
          );
          if (!exerciseLesson) {
            setProgress((current) => dropPendingAnswer(current, pending));
            continue;
          }
          const lesson = getLesson(exerciseLesson);
          // Progress moves only here, from the server's confirmed grade, once per key.
          setProgress((current) =>
            applyConfirmedAnswer(current, pending, {
              lessonId: exerciseLesson,
              lessonExerciseIds: lesson.exerciseIds,
              crownLevelCap: lesson.crownLevelCap,
              correct: response.correct,
              xp: response.xp.total,
            }),
          );
        } catch (error) {
          // A 4xx will never be accepted; keeping it would jam the queue forever.
          if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
            setProgress((current) => dropPendingAnswer(current, pending));
            continue;
          }
          // Offline, a 5xx or a timeout: keep this and the rest queued and retry later.
          return;
        }
      }
    } finally {
      flushing.current = false;
      setConfirming(false);
    }
  }, []);

  useEffect(() => {
    if (progress.pending.length === 0) return;
    void flushPending();
    const onOnline = (): void => void flushPending();
    window.addEventListener('online', onOnline);
    // Retry after a server error even when no online event arrives.
    const retry = window.setInterval(() => void flushPending(), 30_000);
    return () => {
      window.removeEventListener('online', onOnline);
      window.clearInterval(retry);
    };
  }, [progress.pending.length, flushPending]);

  const reset = useCallback(() => {
    clearProgress(browserStorage);
    setProgress(emptyProgress(subjectId));
  }, [subjectId]);

  const value = useMemo<AppStateValue>(
    () => ({
      subjectId,
      progress,
      lessonMode: progress.lessonMode,
      setLessonMode,
      displayStreak: streakForDisplay(progress.streak),
      pendingCount: progress.pending.length,
      syncState: progress.pending.length === 0 ? 'idle' : confirming ? 'confirming' : 'queued',
      saveFailed,
      completeOnboarding,
      applyGradedAnswer,
      queueOffline,
      flushPending,
      reset,
    }),
    [subjectId, progress, saveFailed, confirming, setLessonMode, completeOnboarding, applyGradedAnswer, queueOffline, flushPending, reset],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const value = useContext(AppStateContext);
  if (!value) throw new Error('useAppState must be used inside AppStateProvider');
  return value;
}
