import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import {
  clearProgress,
  dropPendingAnswer,
  emptyProgress,
  ensureSubjectId,
  loadProgress,
  queuePendingAnswer,
  recordAnswer,
  saveProgress,
  streakForDisplay,
  type PendingAnswer,
  type ProgressState,
  type StorageAdapter,
} from '@tikerino/state';

import { submitAnswer, OfflineError, type AnswerResponse } from './api';
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
  displayStreak: number;
  pendingCount: number;
  /**
   * Grading results for answers that were captured offline and have since been
   * sent. The exercise screen is sitting on a locked card with no way to know
   * its answer came back, so the flush leaves the result here for it to find.
   * Keyed by exercise, because that is what the screen knows about itself.
   */
  resolvedAnswers: Record<string, AnswerResponse>;
  completeOnboarding: () => void;
  applyGradedAnswer: (input: GradedAnswerInput) => void;
  queueOffline: (pending: PendingAnswer) => void;
  flushPending: () => Promise<void>;
  clearResolvedAnswer: (exerciseId: string) => void;
  reset: () => void;
}

const AppStateContext = createContext<AppStateValue | null>(null);

export function AppStateProvider({ children }: { children: React.ReactNode }): JSX.Element {
  const [subjectId] = useState(() => ensureSubjectId(browserStorage, uuid));
  const [progress, setProgress] = useState<ProgressState>(() =>
    loadProgress(browserStorage, subjectId),
  );
  // Deliberately not persisted: a reveal is worth showing to the learner who is
  // still looking at the screen, not worth restoring days later on another device.
  const [resolvedAnswers, setResolvedAnswers] = useState<Record<string, AnswerResponse>>({});

  useEffect(() => {
    saveProgress(browserStorage, progress);
  }, [progress]);

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
  const flushPending = useCallback(async () => {
    const queue = [...progress.pending];
    for (const pending of queue) {
      try {
        const response = await submitAnswer(pending);
        const exerciseLesson = orderedLessonIds.find((lessonId) =>
          getLesson(lessonId).exerciseIds.includes(pending.exerciseId),
        );
        if (exerciseLesson) {
          applyGradedAnswer({
            exerciseId: pending.exerciseId,
            lessonId: exerciseLesson,
            correct: response.correct,
            xp: response.xp.total,
            hintUsed: pending.hintUsed,
          });
        }
        // Leave the result where the locked screen can find it. Without this the
        // flush is invisible: XP and the streak move, and the learner keeps
        // reading "the reveal happens when you reconnect".
        setResolvedAnswers((current) => ({ ...current, [pending.exerciseId]: response }));
        setProgress((current) => dropPendingAnswer(current, pending.exerciseId));
      } catch (error) {
        // Still offline: leave the rest queued and try again later.
        if (error instanceof OfflineError) return;
        // A rejection the server will never accept would jam the queue forever.
        setProgress((current) => dropPendingAnswer(current, pending.exerciseId));
      }
    }
  }, [progress.pending, applyGradedAnswer]);

  useEffect(() => {
    if (progress.pending.length === 0) return;
    void flushPending();
    const onOnline = (): void => void flushPending();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [progress.pending.length, flushPending]);

  const clearResolvedAnswer = useCallback((exerciseId: string) => {
    setResolvedAnswers((current) => {
      if (!(exerciseId in current)) return current;
      const { [exerciseId]: _shown, ...rest } = current;
      return rest;
    });
  }, []);

  const reset = useCallback(() => {
    clearProgress(browserStorage);
    setProgress(emptyProgress(subjectId));
    setResolvedAnswers({});
  }, [subjectId]);

  const value = useMemo<AppStateValue>(
    () => ({
      subjectId,
      progress,
      displayStreak: streakForDisplay(progress.streak),
      pendingCount: progress.pending.length,
      resolvedAnswers,
      completeOnboarding,
      applyGradedAnswer,
      queueOffline,
      flushPending,
      clearResolvedAnswer,
      reset,
    }),
    [
      subjectId,
      progress,
      resolvedAnswers,
      completeOnboarding,
      applyGradedAnswer,
      queueOffline,
      flushPending,
      clearResolvedAnswer,
      reset,
    ],
  );

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState(): AppStateValue {
  const value = useContext(AppStateContext);
  if (!value) throw new Error('useAppState must be used inside AppStateProvider');
  return value;
}
