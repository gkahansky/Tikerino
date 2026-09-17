import { describe, expect, it } from 'vitest';

import {
  advanceStreak,
  DEFAULT_LESSON_MODE,
  dropPendingAnswer,
  emptyProgress,
  hasChosenLessonMode,
  isLessonUnlocked,
  loadProgress,
  queuePendingAnswer,
  recordAnswer,
  resolveLessonMode,
  saveProgress,
  setLessonMode,
  streakForDisplay,
  type ProgressState,
  type StorageAdapter,
} from '@tikerino/state';

function memoryStorage(): StorageAdapter {
  const map = new Map<string, string>();
  return {
    getItem: (key) => map.get(key) ?? null,
    setItem: (key, value) => void map.set(key, value),
    removeItem: (key) => void map.delete(key),
  };
}

const lesson = {
  lessonId: 'lesson-0',
  lessonExerciseIds: ['ex-001', 'ex-002'],
  crownLevelCap: 5,
};

describe('recordAnswer', () => {
  it('credits XP and marks the exercise complete', () => {
    const state = recordAnswer(emptyProgress('s1'), {
      ...lesson,
      exerciseId: 'ex-001',
      correct: true,
      xp: 12,
      hintUsed: false,
    });

    expect(state.totalXp).toBe(12);
    expect(state.lessons['lesson-0']!.completedExerciseIds).toEqual(['ex-001']);
    expect(state.lessons['lesson-0']!.completed).toBe(false);
  });

  it('completes the lesson and awards a crown once every exercise is right', () => {
    let state = emptyProgress('s1');
    state = recordAnswer(state, { ...lesson, exerciseId: 'ex-001', correct: true, xp: 10, hintUsed: false });
    state = recordAnswer(state, { ...lesson, exerciseId: 'ex-002', correct: true, xp: 10, hintUsed: false });

    expect(state.lessons['lesson-0']!.completed).toBe(true);
    expect(state.lessons['lesson-0']!.crownLevel).toBe(1);
    expect(state.totalXp).toBe(20);
  });

  it('does not credit XP twice for the same exercise', () => {
    let state = emptyProgress('s1');
    state = recordAnswer(state, { ...lesson, exerciseId: 'ex-001', correct: true, xp: 10, hintUsed: false });
    state = recordAnswer(state, { ...lesson, exerciseId: 'ex-001', correct: true, xp: 10, hintUsed: false });
    expect(state.totalXp).toBe(10);
  });

  it('records a wrong answer without completing anything', () => {
    const state = recordAnswer(emptyProgress('s1'), {
      ...lesson,
      exerciseId: 'ex-001',
      correct: false,
      xp: 0,
      hintUsed: true,
    });
    expect(state.totalXp).toBe(0);
    expect(state.lessons['lesson-0']!.completedExerciseIds).toEqual([]);
    expect(state.answers['ex-001']!.correct).toBe(false);
  });

  it('caps the crown level at the lesson cap', () => {
    let state = emptyProgress('s1');
    for (let round = 0; round < 8; round++) {
      // Re-opening the lesson is what replaying it looks like to this reducer.
      const existing = state.lessons['lesson-0'];
      if (existing) {
        state = {
          ...state,
          lessons: { ...state.lessons, 'lesson-0': { ...existing, completed: false } },
        };
      }
      state = recordAnswer(state, {
        ...lesson,
        crownLevelCap: 2,
        exerciseId: 'ex-001',
        correct: true,
        xp: 1,
        hintUsed: false,
      });
      state = recordAnswer(state, {
        ...lesson,
        crownLevelCap: 2,
        exerciseId: 'ex-002',
        correct: true,
        xp: 1,
        hintUsed: false,
      });
    }
    expect(state.lessons['lesson-0']!.crownLevel).toBeLessThanOrEqual(2);
  });
});

describe('streaks', () => {
  it('starts at 1 on the first day', () => {
    expect(advanceStreak({ current: 0, longest: 0, lastActiveDay: null }, '2026-09-12').current).toBe(1);
  });

  it('does not double-count the same day', () => {
    const after = advanceStreak({ current: 3, longest: 5, lastActiveDay: '2026-09-12' }, '2026-09-12');
    expect(after.current).toBe(3);
  });

  it('increments on consecutive days', () => {
    const after = advanceStreak({ current: 3, longest: 5, lastActiveDay: '2026-09-11' }, '2026-09-12');
    expect(after.current).toBe(4);
  });

  it('restarts after a missed day', () => {
    const after = advanceStreak({ current: 9, longest: 9, lastActiveDay: '2026-09-09' }, '2026-09-12');
    expect(after.current).toBe(1);
    expect(after.longest).toBe(9);
  });

  it('shows zero once the streak has lapsed', () => {
    expect(streakForDisplay({ current: 6, longest: 6, lastActiveDay: '2026-09-09' }, '2026-09-12')).toBe(0);
    expect(streakForDisplay({ current: 6, longest: 6, lastActiveDay: '2026-09-11' }, '2026-09-12')).toBe(6);
  });
});

describe('lesson unlocking', () => {
  const order = ['a', 'b', 'c'];

  it('always opens the first lesson', () => {
    expect(isLessonUnlocked(emptyProgress('s'), order, 'a')).toBe(true);
  });

  it('keeps later lessons shut until the one before is done', () => {
    const state = emptyProgress('s');
    expect(isLessonUnlocked(state, order, 'b')).toBe(false);

    const done = {
      ...state,
      lessons: {
        a: { completedExerciseIds: ['x'], completed: true, crownLevel: 1, xpEarned: 10 },
      },
    };
    expect(isLessonUnlocked(done, order, 'b')).toBe(true);
    expect(isLessonUnlocked(done, order, 'c')).toBe(false);
  });
});

describe('the offline queue', () => {
  const pending = {
    subjectId: 's1',
    exerciseId: 'ex-004',
    answer: { selectedCandleIndex: 3 },
    hintUsed: false,
    timeToAnswerMs: 5_000,
    capturedOffline: true as const,
    assignmentSnapshotAt: '2026-09-12T08:00:00.000Z',
  };

  it('queues an answer captured offline', () => {
    const state = queuePendingAnswer(emptyProgress('s1'), pending);
    expect(state.pending).toHaveLength(1);
  });

  it('does not queue the same answer twice', () => {
    let state = queuePendingAnswer(emptyProgress('s1'), pending);
    state = queuePendingAnswer(state, pending);
    expect(state.pending).toHaveLength(1);
  });

  it('drops an answer once the server has it', () => {
    let state = queuePendingAnswer(emptyProgress('s1'), pending);
    state = dropPendingAnswer(state, 'ex-004');
    expect(state.pending).toEqual([]);
  });
});

describe('persistence', () => {
  it('round-trips through storage', () => {
    const storage = memoryStorage();
    const state = recordAnswer(emptyProgress('s1'), {
      ...lesson,
      exerciseId: 'ex-001',
      correct: true,
      xp: 15,
      hintUsed: false,
    });
    saveProgress(storage, state);
    expect(loadProgress(storage, 's1').totalXp).toBe(15);
  });

  it('starts clean rather than crashing on corrupt storage', () => {
    const storage = memoryStorage();
    storage.setItem('tikerino.progress.v1', '{not json');
    expect(loadProgress(storage, 's1').totalXp).toBe(0);
  });

  it('survives storage that throws, as in private browsing', () => {
    const throwing: StorageAdapter = {
      getItem: () => {
        throw new Error('denied');
      },
      setItem: () => {
        throw new Error('denied');
      },
      removeItem: () => {
        throw new Error('denied');
      },
    };
    expect(() => loadProgress(throwing, 's1')).not.toThrow();
    expect(() => saveProgress(throwing, emptyProgress('s1'))).not.toThrow();
  });
});

describe('the lesson mode preference', () => {
  const storage = (): StorageAdapter & { store: Map<string, string> } => {
    const store = new Map<string, string>();
    return {
      store,
      getItem: (k) => store.get(k) ?? null,
      setItem: (k, v) => void store.set(k, v),
      removeItem: (k) => void store.delete(k),
    };
  };

  it('resolves to the default before the learner has chosen', () => {
    const state = emptyProgress('s1');
    expect(state.lessonMode).toBeNull();
    expect(resolveLessonMode(state)).toBe(DEFAULT_LESSON_MODE);
    expect(hasChosenLessonMode(state)).toBe(false);
  });

  it('resolves to the choice once one is made', () => {
    const state = setLessonMode(emptyProgress('s1'), 'text');
    expect(resolveLessonMode(state)).toBe('text');
    expect(hasChosenLessonMode(state)).toBe(true);
  });

  it('records choosing the default as a choice, not as an absence', () => {
    // The distinction the null is for: someone who picks narrated while narrated
    // is the default must not be moved by a later change of default.
    const state = setLessonMode(emptyProgress('s1'), DEFAULT_LESSON_MODE);
    expect(state.lessonMode).toBe(DEFAULT_LESSON_MODE);
    expect(hasChosenLessonMode(state)).toBe(true);
  });

  it('switches both ways and keeps the last choice', () => {
    let state = setLessonMode(emptyProgress('s1'), 'text');
    state = setLessonMode(state, 'narrated');
    expect(resolveLessonMode(state)).toBe('narrated');
    state = setLessonMode(state, 'text');
    expect(resolveLessonMode(state)).toBe('text');
  });

  it('survives a save and load round trip', () => {
    const s = storage();
    saveProgress(s, setLessonMode(emptyProgress('s1'), 'text'));
    expect(resolveLessonMode(loadProgress(s, 's1'))).toBe('text');
  });

  it('carries progress saved before the field existed to the default, not to a choice', () => {
    // Exactly what a learner upgrading into this build has in storage.
    const s = storage();
    const legacy = emptyProgress('s1');
    delete (legacy as Partial<ProgressState>).lessonMode;
    s.setItem('tikerino.progress.v1', JSON.stringify(legacy));

    const loaded = loadProgress(s, 's1');
    expect(loaded.lessonMode).toBeNull();
    expect(hasChosenLessonMode(loaded)).toBe(false);
    expect(resolveLessonMode(loaded)).toBe(DEFAULT_LESSON_MODE);
  });

  it('leaves the rest of progress untouched when the mode changes', () => {
    const before = recordAnswer(emptyProgress('s1'), {
      exerciseId: 'ex-001',
      lessonId: 'lesson-0-meet-the-chart',
      lessonExerciseIds: ['ex-001'],
      crownLevelCap: 3,
      correct: true,
      xp: 12,
      hintUsed: false,
    });
    const after = setLessonMode(before, 'text');
    expect(after.totalXp).toBe(before.totalXp);
    expect(after.answers).toEqual(before.answers);
    expect(after.lessons).toEqual(before.lessons);
    expect(after.streak).toEqual(before.streak);
  });
});
