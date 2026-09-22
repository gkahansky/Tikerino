import { useEffect, useRef, useState } from 'react';

import { useAppState } from '../app-state';
import { getLesson, meta } from '../content';
import { CandleChart } from '../components/CandleChart';
import { PrimaryButton, Screen, SecondaryButton, TopBar } from '../components/ui';
import { pilotNarrationPlan, segmentIndexToStep, stepToSegmentIndex } from '../narration';
import { useLocalChart } from '../useLocalChart';
import { useNarration } from '../useNarration';

/**
 * Principle card and guided example on one screen, in sequence - the card first,
 * then the walkthrough steps, one at a time. One idea per screen: the learner
 * reads the principle, then watches it pointed out on a real (generated) chart.
 *
 * Pilot lessons also offer a narrated walkthrough: the principle read aloud
 * while the guided chart draws in candle by candle, then each step as a
 * spotlighted segment. The manual step-through stays exactly as it was -
 * narration is an alternative way through the same content, and the quiz
 * loop after it is untouched.
 */
export function LessonCard({
  lessonId,
  onStartExercises,
  onBack,
  onOpenProfile,
}: {
  lessonId: string;
  onStartExercises: () => void;
  onBack: () => void;
  onOpenProfile: () => void;
}): JSX.Element {
  const { progress, displayStreak, lessonMode, setLessonMode } = useAppState();
  const lesson = getLesson(lessonId);

  // -1 is the principle card; 0..n-1 are the guided-example steps.
  const [step, setStep] = useState(-1);

  const cardChart = useLocalChart(lesson.principleCard.miniChart);
  const guidedChart = useLocalChart(lesson.guidedExample.chart);

  const steps = lesson.guidedExample.steps;
  const onCard = step === -1;
  const currentStep = onCard ? null : steps[step]!;
  const isLastStep = step === steps.length - 1;

  const narrationPlan = pilotNarrationPlan(lesson);
  const narration = useNarration(narrationPlan, guidedChart?.candles.length ?? 0);
  const narrating = narration.status === 'playing' || narration.status === 'paused';
  const narrated = narration.status === 'done';

  // The narrated preference plays the walkthrough automatically on entry -
  // once per lesson view, so stopping it does not bounce the learner back in.
  const autoPlayed = useRef(false);
  useEffect(() => {
    if (onCard || autoPlayed.current) return;
    if (!narrationPlan || lessonMode !== 'narrated' || narration.status !== 'idle') return;
    autoPlayed.current = true;
    narration.start(0);
  }, [onCard, narrationPlan, lessonMode, narration.status, narration]);

  // Mid-lesson mode switch, both ways, landing on the equivalent position.
  const switchToNarrated = (): void => {
    setLessonMode('narrated');
    narration.start(stepToSegmentIndex(step));
  };
  const switchToText = (): void => {
    const target = segmentIndexToStep(narration.segmentIndex);
    narration.stop();
    setLessonMode('text');
    setStep(Math.max(-1, Math.min(target, steps.length - 1)));
  };

  return (
    <Screen
      footer={
        <div className="space-y-2">
          {narrating ? (
            <>
              <PrimaryButton onClick={narration.status === 'playing' ? narration.pause : narration.resume}>
                {narration.status === 'playing' ? 'Pause' : 'Resume'}
              </PrimaryButton>
              <SecondaryButton onClick={switchToText}>Switch to text only</SecondaryButton>
            </>
          ) : narrated ? (
            <>
              <PrimaryButton onClick={onStartExercises}>Practise this</PrimaryButton>
              <SecondaryButton onClick={() => narration.start(0)}>Watch again</SecondaryButton>
              <SecondaryButton onClick={switchToText}>Switch to text only</SecondaryButton>
            </>
          ) : (
            <>
              <PrimaryButton
                onClick={() => {
                  if (onCard) setStep(0);
                  else if (!isLastStep) setStep(step + 1);
                  else onStartExercises();
                }}
              >
                {onCard ? 'Show me' : isLastStep ? 'Practise this' : 'Next'}
              </PrimaryButton>
              {!onCard && (
                <SecondaryButton onClick={() => setStep(step - 1)}>Back a step</SecondaryButton>
              )}
            </>
          )}
        </div>
      }
    >
      <TopBar
        onBack={onBack}
        backLabel="Path"
        xp={progress.knowledgeIndexXp}
        streak={displayStreak}
        onProfile={onOpenProfile}
      />

      {onCard ? (
        <section aria-labelledby="principle-title">
          <p className="text-ink-2 text-sm mt-2 mb-1">{lesson.title}</p>
          <h1 id="principle-title" className="text-xl mb-3">
            {lesson.principleCard.title}
          </h1>
          <p className="text-ink m-0 mb-5">{lesson.principleCard.body}</p>

          {cardChart && lesson.principleCard.miniChart && (
            <CandleChart
              label={`Example chart for ${lesson.principleCard.title}`}
              candles={cardChart.candles}
              descriptions={cardChart.descriptions}
              timeframeLabel={lesson.principleCard.miniChart.timeframeLabel}
              syntheticDataLabel={meta.syntheticDataLabel}
            />
          )}
        </section>
      ) : (
        <section aria-labelledby="guided-title">
          <p className="text-ink-2 text-sm mt-2 mb-1">
            {narrating || narrated
              ? 'Narrated walkthrough'
              : `Walkthrough · step ${step + 1} of ${steps.length}`}
          </p>
          <h1 id="guided-title" className="text-xl mb-4">
            {lesson.principleCard.title}
          </h1>

          {guidedChart && (
            <CandleChart
              label={`Guided example for ${lesson.title}`}
              candles={guidedChart.candles}
              descriptions={guidedChart.descriptions}
              timeframeLabel={lesson.guidedExample.chart.timeframeLabel}
              syntheticDataLabel={meta.syntheticDataLabel}
              highlightIndex={narrating ? narration.highlightIndex : narrated ? null : currentStep!.annotateCandleIndex}
              drawCount={narrating ? narration.drawCount : null}
            />
          )}

          {narrating ? (
            <p aria-live="polite" className="card mt-4 px-4 py-3 text-ink m-0">
              {narration.caption}
            </p>
          ) : narrated ? (
            <p className="card mt-4 px-4 py-3 text-ink m-0">
              That is the whole walkthrough. Now try it yourself on the practice questions.
            </p>
          ) : (
            <>
              {narrationPlan && (
                <div className="mt-4">
                  <SecondaryButton onClick={switchToNarrated}>
                    Switch to narrated lesson
                  </SecondaryButton>
                </div>
              )}
              <p aria-live="polite" className="card mt-4 px-4 py-3 text-ink m-0">
                {currentStep!.text}
              </p>
            </>
          )}
        </section>
      )}
    </Screen>
  );
}
