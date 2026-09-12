import { useState } from 'react';

import { useAppState } from '../app-state';
import { getLesson, meta } from '../content';
import { CandleChart } from '../components/CandleChart';
import { PrimaryButton, Screen, SecondaryButton, TopBar } from '../components/ui';
import { useLocalChart } from '../useLocalChart';

/**
 * Principle card and guided example on one screen, in sequence - the card first,
 * then the walkthrough steps, one at a time. One idea per screen: the learner
 * reads the principle, then watches it pointed out on a real (generated) chart.
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
  const { progress, displayStreak } = useAppState();
  const lesson = getLesson(lessonId);

  // -1 is the principle card; 0..n-1 are the guided-example steps.
  const [step, setStep] = useState(-1);

  const cardChart = useLocalChart(lesson.principleCard.miniChart);
  const guidedChart = useLocalChart(lesson.guidedExample.chart);

  const steps = lesson.guidedExample.steps;
  const onCard = step === -1;
  const currentStep = onCard ? null : steps[step]!;
  const isLastStep = step === steps.length - 1;

  return (
    <Screen
      footer={
        <div className="space-y-2">
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
        </div>
      }
    >
      <TopBar
        onBack={onBack}
        backLabel="Path"
        xp={progress.totalXp}
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
            Walkthrough · step {step + 1} of {steps.length}
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
              highlightIndex={currentStep!.annotateCandleIndex}
            />
          )}

          <p aria-live="polite" className="card mt-4 px-4 py-3 text-ink m-0">
            {currentStep!.text}
          </p>
        </section>
      )}
    </Screen>
  );
}
