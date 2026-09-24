import { useState } from 'react';

import { meta } from '../content';
import { PrimaryButton, Screen, SecondaryButton } from '../components/ui';

/**
 * Simple onboarding: three cards, one idea each, and every card says what the
 * app DOES. The legal text (generated data, no advice) lives in Terms of use
 * and Privacy, linked from the profile - not in the first three screens a new
 * learner sees. The small "generated practice data" captions inside lessons
 * and exercises stay.
 */
const CARDS = [
  {
    title: 'Read markets, one small idea at a time',
    body: 'Short lessons. One principle each. Then you practise it on a chart and find out straight away how you did.',
    emoji: '📈',
  },
  {
    title: 'Make the call, see the grade',
    body: 'Every exercise cuts a practice chart at one moment. You call what the chart is telling you, and the grade lands straight away - XP broken down by base, difficulty and speed.',
    emoji: '🎯',
  },
  {
    title: 'Build your streak, climb the path',
    body: 'One graded answer a day grows your streak. Finish a lesson to unlock the next one, and the path fills in as you go.',
    emoji: '🔥',
  },
];

export function Onboarding({ onDone }: { onDone: () => void }): JSX.Element {
  const [step, setStep] = useState(0);
  const card = CARDS[step]!;
  const isLast = step === CARDS.length - 1;

  return (
    <Screen
      footer={
        <div className="space-y-2">
          <PrimaryButton onClick={() => (isLast ? onDone() : setStep(step + 1))}>
            {isLast ? 'Start learning' : 'Next'}
          </PrimaryButton>
          {!isLast && <SecondaryButton onClick={onDone}>Skip</SecondaryButton>}
        </div>
      }
    >
      <header className="py-4">
        <span className="font-display font-bold text-lg">{meta.productName}</span>
      </header>

      <div className="flex flex-col justify-center min-h-[55dvh]">
        <p className="text-[64px] leading-none mb-6" aria-hidden="true">
          {card.emoji}
        </p>
        <h1 className="text-2xl mb-3">{card.title}</h1>
        <p className="text-ink-2 m-0">{card.body}</p>
      </div>

      {/*
        Focus stays on Next so keyboard users can keep going, so the new step is
        announced here instead. Empty on the first step: the page itself is read then.
      */}
      <p role="status" aria-live="polite" className="sr-only">
        {step > 0 ? `Step ${step + 1} of ${CARDS.length}. ${card.title}. ${card.body}` : ''}
      </p>

      <ol className="flex gap-2 list-none p-0 mt-8" aria-label={`Step ${step + 1} of ${CARDS.length}`}>
        {CARDS.map((entry, index) => (
          <li
            key={entry.title}
            aria-current={index === step ? 'step' : undefined}
            className={`h-2 flex-1 rounded-full ${index <= step ? 'bg-brand' : 'bg-line'}`}
          />
        ))}
      </ol>
    </Screen>
  );
}
