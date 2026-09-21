import { useMemo } from 'react';

import { describeCandles } from '@tikerino/engine';

import type { AnswerResponse, WindowResponse } from '../api';
import { useAppState } from '../app-state';
import { meta } from '../content';
import { CandleChart } from '../components/CandleChart';
import { PrimaryButton, Screen } from '../components/ui';

/**
 * Grading, XP and the animated reveal of what happened after the cut, in
 * that order, on one screen. No disclaimer here: Guy ruled 12 Sep that all
 * legal text lives only in Terms of use and Privacy policy.
 *
 * The reveal candles arrive with the grading response and never before: until the
 * server answered, the client had no way to know them.
 */
export function RevealScreen({
  result,
  window_,
  isLast,
  onContinue,
}: {
  result: AnswerResponse;
  window_: WindowResponse;
  isLast: boolean;
  onContinue: () => void;
}): JSX.Element {
  const { progress, displayStreak } = useAppState();

  const allCandles = useMemo(
    () => [...(window_.chart?.candles ?? []), ...result.reveal.candles],
    [window_, result],
  );

  const descriptions = useMemo(
    () =>
      window_.chart ? describeCandles(allCandles, window_.chart.timeframeLabel) : [],
    [allCandles, window_],
  );

  const correctCandleIndex =
    'candleIndex' in result.target ? result.target.candleIndex : null;

  const correctOptionText = useMemo(() => {
    if (!('optionId' in result.target)) return null;
    const { optionId } = result.target;
    return window_.options?.find((option) => option.optionId === optionId)?.text ?? null;
  }, [result.target, window_.options]);

  const { xp } = result;

  return (
    <Screen
      footer={
        <PrimaryButton onClick={onContinue}>
          {isLast ? 'Back to the path' : 'Next question'}
        </PrimaryButton>
      }
    >
      <header className="flex items-center justify-between gap-2 py-2">
        <h1
          className="text-xl m-0"
          style={{ color: result.correct ? 'var(--brand-ink)' : 'var(--data-down)' }}
        >
          {result.correct ? 'Correct' : 'Not this time'}
        </h1>
        <span className="pill bg-sun-soft text-ink px-3 py-1 text-sm font-bold tabular">
          +{xp.total} XP
        </span>
      </header>

      <p aria-live="polite" className="m-0 mb-4">
        {result.correct ? result.feedback.correct : result.feedback.incorrect}
      </p>

      {!result.correct && correctOptionText && (
        <p className="card px-4 py-3 m-0 mb-4">
          The answer was: <strong>{correctOptionText}</strong>
        </p>
      )}

      {window_.chart && (
        <>
          <h2 className="text-lg mb-2">What happened next</h2>
          <CandleChart
            label="Practice chart with the candles after the cut point revealed"
            candles={window_.chart.candles}
            revealCandles={result.reveal.candles}
            descriptions={descriptions}
            timeframeLabel={window_.chart.timeframeLabel}
            syntheticDataLabel={window_.chart.syntheticDataLabel}
            selection={
              correctCandleIndex !== null
                ? {
                    selectedIndex: null,
                    onSelect: () => undefined,
                    disabled: true,
                    correctIndex: correctCandleIndex,
                  }
                : undefined
            }
          />
        </>
      )}

      <section aria-label="XP breakdown" className="card mt-5 px-4 py-3">
        <dl className="grid grid-cols-2 gap-y-1 m-0 text-sm tabular">
          <dt className="text-ink-2">Base</dt>
          <dd className="m-0 text-right">{xp.base}</dd>
          <dt className="text-ink-2">Difficulty</dt>
          <dd className="m-0 text-right">&times;{xp.multiplier}</dd>
          <dt className="text-ink-2">Speed bonus</dt>
          <dd className="m-0 text-right">+{xp.speedBonus}</dd>
          {xp.hintPenaltyApplied && (
            <>
              <dt className="text-ink-2">Hint used</dt>
              <dd className="m-0 text-right">half</dd>
            </>
          )}
          <dt className="font-bold border-t border-line pt-1">Total</dt>
          <dd className="m-0 text-right font-bold border-t border-line pt-1">{xp.total}</dd>
        </dl>
      </section>

      <p className="mt-3 text-sm text-ink-2 tabular">
        {progress.totalXp} XP · {displayStreak} day streak · {meta.productName} practice data
      </p>
    </Screen>
  );
}
