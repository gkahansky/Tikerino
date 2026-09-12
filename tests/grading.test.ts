import { describe, expect, it } from 'vitest';

import { BASE_XP, PAR_TIME_MS, computeXp, gradeAndScore, gradeAnswer } from '@tikerino/grading';

describe('gradeAnswer', () => {
  it('matches a multiple choice option exactly', () => {
    expect(gradeAnswer('multiple_choice', { selectedOptionId: 'a' }, { optionId: 'a' })).toBe(true);
    expect(gradeAnswer('multiple_choice', { selectedOptionId: 'b' }, { optionId: 'a' })).toBe(false);
  });

  it('matches a candle index exactly, with no tolerance', () => {
    expect(gradeAnswer('pick_the_candle', { selectedCandleIndex: 7 }, { candleIndex: 7 })).toBe(true);
    // Adjacent is wrong: tolerance belongs to the deferred drag types.
    expect(gradeAnswer('pick_the_candle', { selectedCandleIndex: 6 }, { candleIndex: 7 })).toBe(false);
    expect(gradeAnswer('pick_the_candle', { selectedCandleIndex: 8 }, { candleIndex: 7 })).toBe(false);
  });

  it('rejects a mismatched answer shape', () => {
    expect(() =>
      gradeAnswer('pick_the_candle', { selectedOptionId: 'a' }, { candleIndex: 1 }),
    ).toThrow();
    expect(() =>
      gradeAnswer('multiple_choice', { selectedCandleIndex: 1 }, { optionId: 'a' }),
    ).toThrow();
  });
});

describe('computeXp', () => {
  const base = {
    correct: true,
    difficultyTier: 1,
    hintUsed: false,
    timeToAnswerMs: PAR_TIME_MS.multiple_choice,
    exerciseType: 'multiple_choice' as const,
  };

  it('awards 10 XP for a correct tier-1 answer at par', () => {
    expect(computeXp(base)).toEqual({
      base: BASE_XP,
      multiplier: 1,
      hintPenaltyApplied: false,
      speedBonus: 0,
      total: 10,
    });
  });

  it('doubles the base on tier 2', () => {
    expect(computeXp({ ...base, difficultyTier: 2 }).total).toBe(20);
  });

  it('gives nothing for an incorrect answer', () => {
    const xp = computeXp({ ...base, correct: false, timeToAnswerMs: 1 });
    expect(xp.base).toBe(0);
    expect(xp.speedBonus).toBe(0);
    expect(xp.total).toBe(0);
  });

  it('adds +1 under par and +2 under half par', () => {
    expect(computeXp({ ...base, timeToAnswerMs: 44_999 }).speedBonus).toBe(1);
    expect(computeXp({ ...base, timeToAnswerMs: 22_499 }).speedBonus).toBe(2);
    expect(computeXp({ ...base, timeToAnswerMs: 60_000 }).speedBonus).toBe(0);
  });

  it('uses the longer par time for pick_the_candle', () => {
    const pick = { ...base, exerciseType: 'pick_the_candle' as const, timeToAnswerMs: 50_000 };
    // 50s is over the 45s MC par but under the 60s pick-the-candle par.
    expect(computeXp(pick).speedBonus).toBe(1);
  });

  it('reproduces the spec worked example exactly', () => {
    // base 10, multiplier 2, hint not used, speed bonus 1 -> total 21.
    const xp = computeXp({
      correct: true,
      difficultyTier: 2,
      hintUsed: false,
      timeToAnswerMs: 50_000,
      exerciseType: 'pick_the_candle',
    });
    expect(xp).toEqual({
      base: 10,
      multiplier: 2,
      hintPenaltyApplied: false,
      speedBonus: 1,
      total: 21,
    });
  });

  it('halves the whole total when a hint was used, rounding down', () => {
    // 10*2 + 1 = 21 -> floor(21/2) = 10. The bonus is inside the halving.
    const xp = computeXp({
      correct: true,
      difficultyTier: 2,
      hintUsed: true,
      timeToAnswerMs: 50_000,
      exerciseType: 'pick_the_candle',
    });
    expect(xp.hintPenaltyApplied).toBe(true);
    expect(xp.total).toBe(10);
  });

  it('never goes negative', () => {
    const xp = computeXp({ ...base, correct: false, hintUsed: true });
    expect(xp.total).toBe(0);
  });

  it('caps the speed bonus below the value of being right', () => {
    // Fastest possible bonus is +2; the cheapest correct answer is worth 10.
    const fastest = computeXp({ ...base, timeToAnswerMs: 0 });
    expect(fastest.speedBonus).toBe(2);
    expect(fastest.speedBonus).toBeLessThan(BASE_XP);
  });

  it('rejects an unknown difficulty tier', () => {
    expect(() => computeXp({ ...base, difficultyTier: 3 })).toThrow(RangeError);
  });
});

describe('gradeAndScore', () => {
  it('grades and scores in one pass', () => {
    const result = gradeAndScore({
      type: 'pick_the_candle',
      answer: { selectedCandleIndex: 4 },
      target: { candleIndex: 4 },
      difficultyTier: 2,
      hintUsed: false,
      timeToAnswerMs: 20_000,
    });
    expect(result.correct).toBe(true);
    expect(result.xp.total).toBe(22); // 10 * 2 + 2 (under half of the 60s par)
  });
});
