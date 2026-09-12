/**
 * Answer grading and XP scoring - spec sections 4 and 5, the locked model.
 *
 * This package never generates or inspects candles: the caller (the server)
 * resolves the target with the engine and hands it in. That keeps grading a pure
 * function of (type, answer, target) and makes both halves independently testable.
 */

export type ExerciseTypeName = 'multiple_choice' | 'pick_the_candle';

export type AnswerPayload = { selectedOptionId: string } | { selectedCandleIndex: number };

export type Target = { optionId: string } | { candleIndex: number };

export interface XpBreakdown {
  /** 10 on a correct answer, 0 on an incorrect one. */
  base: number;
  /** Difficulty tier: 1 -> x1, 2 -> x2. */
  multiplier: number;
  /** True when the 50% hint cost was applied to the total. */
  hintPenaltyApplied: boolean;
  /** 0, 1, or 2. Never awarded on an incorrect answer. */
  speedBonus: number;
  total: number;
}

export interface GradeResult {
  correct: boolean;
  target: Target;
  xp: XpBreakdown;
}

/** Base XP for a correct answer, before the difficulty multiplier. */
export const BASE_XP = 10;

/**
 * Par times, spec section 5. Speed is never worth more than accuracy: the most a
 * learner can gain is +2 against a 10-20 base.
 */
export const PAR_TIME_MS: Record<ExerciseTypeName, number> = {
  multiple_choice: 45_000,
  pick_the_candle: 60_000,
};

export function isOptionAnswer(
  answer: AnswerPayload,
): answer is { selectedOptionId: string } {
  return typeof (answer as { selectedOptionId?: unknown }).selectedOptionId === 'string';
}

export function isCandleAnswer(
  answer: AnswerPayload,
): answer is { selectedCandleIndex: number } {
  return Number.isInteger((answer as { selectedCandleIndex?: unknown }).selectedCandleIndex);
}

/**
 * Exact match, no tolerance, for both day-one types. Tolerance belongs to the
 * deferred drag/stepper types and is deliberately absent here.
 */
export function gradeAnswer(
  type: ExerciseTypeName,
  answer: AnswerPayload,
  target: Target,
): boolean {
  if (type === 'multiple_choice') {
    if (!isOptionAnswer(answer)) {
      throw new TypeError('multiple_choice expects { selectedOptionId }');
    }
    if (!('optionId' in target)) {
      throw new TypeError('multiple_choice expects a target of { optionId }');
    }
    return answer.selectedOptionId === target.optionId;
  }

  if (!isCandleAnswer(answer)) {
    throw new TypeError('pick_the_candle expects { selectedCandleIndex }');
  }
  if (!('candleIndex' in target)) {
    throw new TypeError('pick_the_candle expects a target of { candleIndex }');
  }
  return answer.selectedCandleIndex === target.candleIndex;
}

export interface XpInput {
  correct: boolean;
  /** 1 or 2. */
  difficultyTier: number;
  hintUsed: boolean;
  timeToAnswerMs: number;
  exerciseType: ExerciseTypeName;
}

/**
 * XP, spec section 5, in this order:
 *   1. base            10 if correct, else 0
 *   2. multiplier      base * difficultyTier
 *   3. speed bonus     +2 under half par, +1 under par, correct answers only
 *   4. hint cost       whole total halved, rounded down, minimum 0
 *
 * The worked example in the spec (base 10, multiplier 2, speedBonus 1, total 21)
 * fixes the order: the bonus is added before the hint halving, not after.
 */
export function computeXp(input: XpInput): XpBreakdown {
  const { correct, difficultyTier, hintUsed, timeToAnswerMs, exerciseType } = input;

  if (difficultyTier !== 1 && difficultyTier !== 2) {
    throw new RangeError(`difficultyTier must be 1 or 2, got ${difficultyTier}`);
  }

  const base = correct ? BASE_XP : 0;
  const multiplier = difficultyTier;

  let speedBonus = 0;
  if (correct && Number.isFinite(timeToAnswerMs) && timeToAnswerMs >= 0) {
    const par = PAR_TIME_MS[exerciseType];
    if (timeToAnswerMs < par / 2) speedBonus = 2;
    else if (timeToAnswerMs < par) speedBonus = 1;
  }

  const beforeHint = base * multiplier + speedBonus;
  const total = hintUsed ? Math.max(0, Math.floor(beforeHint / 2)) : beforeHint;

  return { base, multiplier, hintPenaltyApplied: hintUsed, speedBonus, total };
}

/** Grade and score in one call, the shape POST /api/answers returns. */
export function gradeAndScore(args: {
  type: ExerciseTypeName;
  answer: AnswerPayload;
  target: Target;
  difficultyTier: number;
  hintUsed: boolean;
  timeToAnswerMs: number;
}): GradeResult {
  const correct = gradeAnswer(args.type, args.answer, args.target);
  const xp = computeXp({
    correct,
    difficultyTier: args.difficultyTier,
    hintUsed: args.hintUsed,
    timeToAnswerMs: args.timeToAnswerMs,
    exerciseType: args.type,
  });
  return { correct, target: args.target, xp };
}
