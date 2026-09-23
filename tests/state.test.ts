import { describe, expect, it } from 'vitest';

import {
  advanceStreak,
  dropPendingAnswer,
  emptyProgress,
  isLessonUnlocked,
  LESSON_COMPLETION_XP,
  lessonXpCreditedByAnswer,
  loadProgress,
  mergeProgress,
  persistProgress,
  setLessonMode,
  queuePendingAnswer,
  recordAnswer,
  saveProgress,
  streakForDisplay,
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
    expect(state.knowledgeIndexXp).toBe(LESSON_COMPLETION_XP);
    expect(state.lessonAwards['lesson-0']?.xp).toBe(25);
  });

  it('awards canonical +25 exactly once when a lesson completes, separate from answer XP', () => {
    let state = emptyProgress('s1');
    state = recordAnswer(state, { ...lesson, exerciseId: 'ex-001', correct: true, xp: 12, hintUsed: false });
    expect(state.knowledgeIndexXp).toBe(0);
    state = recordAnswer(state, { ...lesson, exerciseId: 'ex-002', correct: true, xp: 12, hintUsed: false });
    expect(state.knowledgeIndexXp).toBe(25);
    expect(state.totalXp).toBe(24);
    state = recordAnswer(state, { ...lesson, exerciseId: 'ex-002', correct: true, xp: 12, hintUsed: false });
    expect(state.knowledgeIndexXp).toBe(25);
    expect(Object.keys(state.lessonAwards)).toEqual(['lesson-0']);
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

describe('lesson mode preference', () => {
  it('defaults to narrated for users who have never picked a mode', () => {
    expect(emptyProgress('s1').lessonMode).toBe('narrated');
  });

  it('switches and persists through storage', () => {
    const storage = memoryStorage();
    saveProgress(storage, setLessonMode(emptyProgress('s1'), 'narrated'));
    expect(loadProgress(storage, 's1').lessonMode).toBe('narrated');
  });

  it('backfills narrated for progress stored before the preference existed', () => {
    const storage = memoryStorage();
    const legacy = emptyProgress('s1') as Record<string, unknown>;
    delete legacy.lessonMode;
    storage.setItem('tikerino.progress.v1', JSON.stringify(legacy));
    expect(loadProgress(storage, 's1').lessonMode).toBe('narrated');
  });

  it('is a no-op when the mode is unchanged', () => {
    const state = emptyProgress('s1');
    expect(setLessonMode(state, 'narrated')).toBe(state);
  });
});


describe('Knowledge Index persistence (prog-rules-v1.0)', () => {
  const KEY = 'tikerino.progress.v1';

  function completeLesson(state = emptyProgress('s1')) {
    state = recordAnswer(state, { ...lesson, exerciseId: 'ex-001', correct: true, xp: 10, hintUsed: false });
    return recordAnswer(state, { ...lesson, exerciseId: 'ex-002', correct: true, xp: 10, hintUsed: false });
  }

  function legacyState(completedLessons: string[]) {
    const legacy: Record<string, unknown> = { ...emptyProgress('s1') };
    delete legacy.progressionRuleset;
    delete legacy.knowledgeIndexXp;
    delete legacy.lessonAwards;
    legacy.lessons = Object.fromEntries(
      completedLessons.map((id) => [id, { completedExerciseIds: ['ex-001', 'ex-002'], completed: true, crownLevel: 1, xpEarned: 20 }]),
    );
    return legacy;
  }

  it('backfills 25 per completed lesson for state saved before lesson awards', () => {
    const storage = memoryStorage();
    storage.setItem(KEY, JSON.stringify(legacyState(['lesson-0', 'lesson-1'])));
    const loaded = loadProgress(storage, 's1');
    expect(loaded.knowledgeIndexXp).toBe(50);
    expect(loaded.lessonAwards['lesson-0']).toEqual({ xp: 25, awardedAt: 'migrated' });
    expect(loaded.lessonAwards['lesson-1']).toEqual({ xp: 25, awardedAt: 'migrated' });
  });

  it('does not add more when a migrated lesson is replayed', () => {
    const storage = memoryStorage();
    storage.setItem(KEY, JSON.stringify(legacyState(['lesson-0'])));
    let state = loadProgress(storage, 's1');
    state = completeLesson(state);
    expect(state.knowledgeIndexXp).toBe(25);
    saveProgress(storage, state);
    expect(loadProgress(storage, 's1').knowledgeIndexXp).toBe(25);
  });

  it('round-trips awards and the index through save and load', () => {
    const storage = memoryStorage();
    const state = completeLesson();
    saveProgress(storage, state);
    const loaded = loadProgress(storage, 's1');
    expect(loaded.knowledgeIndexXp).toBe(25);
    expect(loaded.lessonAwards).toEqual(state.lessonAwards);
    expect(loaded.progressionRuleset).toBe('prog-rules-v1.0');
  });

  it('keeps a stored progressionRuleset instead of overwriting it', () => {
    const storage = memoryStorage();
    storage.setItem(KEY, JSON.stringify({ ...completeLesson(), progressionRuleset: 'prog-rules-v0.9' }));
    expect(loadProgress(storage, 's1').progressionRuleset).toBe('prog-rules-v0.9');
  });

  it('derives the index from awards when storage holds "25" or NaN', () => {
    const storage = memoryStorage();
    const state = completeLesson();
    storage.setItem(KEY, JSON.stringify({ ...state, knowledgeIndexXp: '25' }));
    const fromString = loadProgress(storage, 's1');
    expect(fromString.knowledgeIndexXp).toBe(25);
    expect(Number.isFinite(fromString.knowledgeIndexXp)).toBe(true);
    // JSON turns NaN into null; a raw NaN-bearing object is also covered by derivation.
    storage.setItem(KEY, JSON.stringify({ ...state, knowledgeIndexXp: Number.NaN }));
    expect(loadProgress(storage, 's1').knowledgeIndexXp).toBe(25);
    storage.setItem(KEY, JSON.stringify({ ...state, lessonAwards: { 'lesson-0': { xp: 'x', awardedAt: 'a' } } }));
    expect(loadProgress(storage, 's1').knowledgeIndexXp).toBe(25);
  });

  it('keeps the index at 25 when a lesson re-completes after an exercise is added', () => {
    let state = completeLesson();
    const grown = { ...lesson, lessonExerciseIds: ['ex-001', 'ex-002', 'ex-003'] };
    state = recordAnswer(state, { ...grown, exerciseId: 'ex-001', correct: true, xp: 10, hintUsed: false });
    expect(state.lessons['lesson-0']!.completed).toBe(false);
    state = recordAnswer(state, { ...grown, exerciseId: 'ex-003', correct: true, xp: 10, hintUsed: false, at: new Date(Date.now() + 60_000) });
    expect(state.lessons['lesson-0']!.completed).toBe(true);
    expect(state.knowledgeIndexXp).toBe(25);
    expect(lessonXpCreditedByAnswer(state, 'lesson-0', 'ex-003')).toBe(0);
  });

  it('does not award the lesson when the final answer is wrong', () => {
    let state = emptyProgress('s1');
    state = recordAnswer(state, { ...lesson, exerciseId: 'ex-001', correct: true, xp: 10, hintUsed: false });
    state = recordAnswer(state, { ...lesson, exerciseId: 'ex-002', correct: false, xp: 0, hintUsed: false });
    expect(state.knowledgeIndexXp).toBe(0);
    expect(state.lessonAwards).toEqual({});
    expect(lessonXpCreditedByAnswer(state, 'lesson-0', 'ex-002')).toBe(0);
  });

  it('reports the XP an answer actually credited', () => {
    let state = emptyProgress('s1');
    state = recordAnswer(state, { ...lesson, exerciseId: 'ex-001', correct: true, xp: 10, hintUsed: false, at: new Date('2026-09-23T06:00:00Z') });
    expect(lessonXpCreditedByAnswer(state, 'lesson-0', 'ex-001')).toBe(0);
    state = recordAnswer(state, { ...lesson, exerciseId: 'ex-002', correct: true, xp: 10, hintUsed: false, at: new Date('2026-09-23T06:01:00Z') });
    expect(lessonXpCreditedByAnswer(state, 'lesson-0', 'ex-002')).toBe(25);
    state = recordAnswer(state, { ...lesson, exerciseId: 'ex-002', correct: true, xp: 10, hintUsed: false, at: new Date('2026-09-23T06:02:00Z') });
    expect(lessonXpCreditedByAnswer(state, 'lesson-0', 'ex-002')).toBe(0);
  });
});


describe('merge-before-save across tabs', () => {
  const KEY = 'tikerino.progress.v1';
  const lessonA = { lessonId: 'lesson-0', lessonExerciseIds: ['ex-001', 'ex-002'], crownLevelCap: 5 };
  const lessonB = { lessonId: 'lesson-1', lessonExerciseIds: ['ex-003', 'ex-004'], crownLevelCap: 5 };

  function finish(state: ReturnType<typeof emptyProgress>, l: typeof lessonA, ids: [string, string], at: string) {
    state = recordAnswer(state, { ...l, exerciseId: ids[0], correct: true, xp: 10, hintUsed: false, at: new Date(at) });
    return recordAnswer(state, { ...l, exerciseId: ids[1], correct: true, xp: 10, hintUsed: false, at: new Date(at) });
  }

  for (const order of ['A then B', 'B then A'] as const) {
    it(`two stale tabs saving ${order} keep both awards`, () => {
      const storage = memoryStorage();
      saveProgress(storage, emptyProgress('s1'));
      let tabA = loadProgress(storage, 's1');
      let tabB = loadProgress(storage, 's1');
      tabA = finish(tabA, lessonA, ['ex-001', 'ex-002'], '2026-09-23T10:00:00Z');
      tabB = finish(tabB, lessonB, ['ex-003', 'ex-004'], '2026-09-23T10:05:00Z');
      const [first, second] = order === 'A then B' ? [tabA, tabB] : [tabB, tabA];
      expect(saveProgress(storage, first)).toBe(true);
      expect(saveProgress(storage, second)).toBe(true);
      const loaded = loadProgress(storage, 's1');
      expect(Object.keys(loaded.lessonAwards).sort()).toEqual(['lesson-0', 'lesson-1']);
      expect(loaded.knowledgeIndexXp).toBe(50);
      expect(loaded.lessons['lesson-0']!.completed).toBe(true);
      expect(loaded.lessons['lesson-1']!.completed).toBe(true);
      expect(Object.keys(loaded.answers).sort()).toEqual(['ex-001', 'ex-002', 'ex-003', 'ex-004']);
      expect(loaded.totalXp).toBe(40);
    });
  }

  it('the same lesson finished in both tabs is awarded once, at its first award', () => {
    const storage = memoryStorage();
    saveProgress(storage, emptyProgress('s1'));
    const tabA = finish(loadProgress(storage, 's1'), lessonA, ['ex-001', 'ex-002'], '2026-09-23T10:00:00Z');
    const tabB = finish(loadProgress(storage, 's1'), lessonA, ['ex-001', 'ex-002'], '2026-09-23T10:05:00Z');
    saveProgress(storage, tabB);
    const result = persistProgress(storage, tabA);
    expect(result.state.knowledgeIndexXp).toBe(25);
    expect(result.state.lessonAwards['lesson-0']!.awardedAt).toBe('2026-09-23T10:00:00.000Z');
    expect(loadProgress(storage, 's1').knowledgeIndexXp).toBe(25);
  });

  it('never merges a different learner in', () => {
    const mine = finish(emptyProgress('s1'), lessonA, ['ex-001', 'ex-002'], '2026-09-23T10:00:00Z');
    const theirs = finish(emptyProgress('s2'), lessonB, ['ex-003', 'ex-004'], '2026-09-23T10:00:00Z');
    expect(mergeProgress(mine, theirs)).toBe(mine);
  });

  it('a throwing setItem reports failure and reload shows no +25', () => {
    const backing = memoryStorage();
    saveProgress(backing, emptyProgress('s1'));
    const failing: StorageAdapter = {
      getItem: backing.getItem,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: backing.removeItem,
    };
    const state = finish(loadProgress(failing, 's1'), lessonA, ['ex-001', 'ex-002'], '2026-09-23T10:00:00Z');
    expect(state.knowledgeIndexXp).toBe(25);
    const result = persistProgress(failing, state);
    expect(result.saved).toBe(false);
    expect(saveProgress(failing, state)).toBe(false);
    expect(loadProgress(backing, 's1').knowledgeIndexXp).toBe(0);
    expect(backing.getItem(KEY)).not.toContain('lesson-0');
  });
});
