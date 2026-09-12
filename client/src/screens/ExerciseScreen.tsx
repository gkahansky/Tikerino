import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { describeCandles } from '@tikerino/engine';
import type { AnswerPayload } from '@tikerino/grading';

import { OfflineError, fetchWindow, submitAnswer, type AnswerResponse, type WindowResponse } from '../api';
import { useAppState } from '../app-state';
import { getExercise, meta } from '../content';
import { CandleChart } from '../components/CandleChart';
import { Callout, PrimaryButton, Screen, SecondaryButton, TopBar } from '../components/ui';

type Phase = 'loading' | 'ready' | 'submitting' | 'offline-locked' | 'error';

export function ExerciseScreen({
  exerciseId,
  lessonId,
  position,
  total,
  onWindowLoaded,
  onGraded,
  onBack,
  onOpenProfile,
}: {
  exerciseId: string;
  lessonId: string;
  position: number;
  total: number;
  /** The reveal screen renders the same window, so it is lifted on load. */
  onWindowLoaded: (response: WindowResponse) => void;
  onGraded: (response: AnswerResponse, hintUsed: boolean) => void;
  onBack: () => void;
  onOpenProfile: () => void;
}): JSX.Element {
  const { progress, displayStreak, subjectId, queueOffline } = useAppState();
  const exercise = getExercise(exerciseId);

  const [phase, setPhase] = useState<Phase>('loading');
  const [window_, setWindow] = useState<WindowResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [selectedCandleIndex, setSelectedCandleIndex] = useState<number | null>(null);
  const [hintUsed, setHintUsed] = useState(false);

  const startedAt = useRef<number>(Date.now());
  const assignedAt = useRef<string>(new Date().toISOString());

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    setSelectedOptionId(null);
    setSelectedCandleIndex(null);
    setHintUsed(false);

    fetchWindow(exerciseId)
      .then((response) => {
        if (cancelled) return;
        setWindow(response);
        onWindowLoaded(response);
        startedAt.current = Date.now();
        assignedAt.current = new Date().toISOString();
        setPhase('ready');
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setErrorMessage(
          error instanceof OfflineError
            ? 'This exercise needs a connection: its chart is cut on the server, so the app cannot build it here.'
            : 'Could not load this exercise.',
        );
        setPhase('error');
      });

    return () => {
      cancelled = true;
    };
    // onWindowLoaded is a stable setState from the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exerciseId]);

  const descriptions = useMemo(
    () =>
      window_?.chart
        ? describeCandles(window_.chart.candles, window_.chart.timeframeLabel)
        : [],
    [window_],
  );

  const answer: AnswerPayload | null = useMemo(() => {
    if (exercise.type === 'multiple_choice') {
      return selectedOptionId ? { selectedOptionId } : null;
    }
    return selectedCandleIndex === null ? null : { selectedCandleIndex };
  }, [exercise.type, selectedOptionId, selectedCandleIndex]);

  const onSubmit = useCallback(async () => {
    if (!answer) return;
    setPhase('submitting');

    const payload = {
      subjectId,
      exerciseId,
      answer,
      hintUsed,
      timeToAnswerMs: Date.now() - startedAt.current,
      capturedOffline: false,
      assignmentSnapshotAt: assignedAt.current,
    };

    try {
      const response = await submitAnswer(payload);
      onGraded(response, hintUsed);
    } catch (error) {
      if (error instanceof OfflineError) {
        // Locked locally, reveal deferred until the server acknowledges it.
        queueOffline({ ...payload, capturedOffline: true });
        setPhase('offline-locked');
        return;
      }
      setErrorMessage('The server could not record that answer.');
      setPhase('error');
    }
  }, [answer, exerciseId, hintUsed, onGraded, queueOffline, subjectId]);

  if (phase === 'loading') {
    return (
      <Screen>
        <TopBar onBack={onBack} backLabel="Lesson" xp={progress.totalXp} streak={displayStreak} />
        <p role="status" className="mt-8">
          Loading the chart…
        </p>
      </Screen>
    );
  }

  if (phase === 'error') {
    return (
      <Screen footer={<SecondaryButton onClick={onBack}>Back to the lesson</SecondaryButton>}>
        <TopBar onBack={onBack} backLabel="Lesson" xp={progress.totalXp} streak={displayStreak} />
        <h1 className="text-xl mt-4 mb-2">Not right now</h1>
        <p className="text-ink-2">{errorMessage}</p>
      </Screen>
    );
  }

  if (phase === 'offline-locked') {
    return (
      <Screen footer={<PrimaryButton onClick={onBack}>Back to the lesson</PrimaryButton>}>
        <TopBar onBack={onBack} backLabel="Lesson" xp={progress.totalXp} streak={displayStreak} />
        <h1 className="text-xl mt-4 mb-2">Answer locked</h1>
        <p className="text-ink-2">
          You are offline, so your answer is saved exactly as you gave it. Grading and the reveal
          happen when you reconnect - the result cannot change in the meantime.
        </p>
      </Screen>
    );
  }

  const response = window_!;

  return (
    <Screen
      // Only Check is sticky. A second full-width button here pushed the answers
      // below the fold on a 390px phone, which is the wrong thing to hide.
      footer={
        <PrimaryButton onClick={() => void onSubmit()} disabled={!answer || phase === 'submitting'}>
          {phase === 'submitting' ? 'Checking…' : 'Check'}
        </PrimaryButton>
      }
    >
      <TopBar
        onBack={onBack}
        backLabel="Lesson"
        xp={progress.totalXp}
        streak={displayStreak}
        onProfile={onOpenProfile}
      />

      <p className="text-ink-2 text-sm mt-2 mb-1 tabular">
        Question {position} of {total}
      </p>
      <h1 className="text-lg mb-4">{response.prompt}</h1>

      {response.chart && (
        <CandleChart
          label={`Practice chart for question ${position}`}
          candles={response.chart.candles}
          descriptions={descriptions}
          timeframeLabel={response.chart.timeframeLabel}
          syntheticDataLabel={response.chart.syntheticDataLabel}
          selection={
            response.type === 'pick_the_candle'
              ? {
                  selectedIndex: selectedCandleIndex,
                  onSelect: setSelectedCandleIndex,
                  disabled: phase === 'submitting',
                }
              : undefined
          }
        />
      )}

      {response.options && (
        <ul className="list-none p-0 mt-5 space-y-3" aria-label="Answers">
          {response.options.map((option) => (
            <li key={option.optionId}>
              <button
                type="button"
                aria-pressed={selectedOptionId === option.optionId}
                onClick={() => setSelectedOptionId(option.optionId)}
                disabled={phase === 'submitting'}
                className="option target w-full px-4 py-3"
              >
                {option.text}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4">
        {hintUsed ? (
          <Callout>{exercise.hint.text}</Callout>
        ) : (
          <button
            type="button"
            onClick={() => setHintUsed(true)}
            className="btn-secondary target px-4 py-3 text-sm font-semibold"
          >
            Show a hint (costs half the XP)
          </button>
        )}
      </div>
    </Screen>
  );
}
