import { useState } from 'react';

import { meta } from '../content';
import { PrimaryButton, Screen, SecondaryButton } from '../components/ui';

/**
 * Simple onboarding: three cards, one idea each. No accounts, no permissions,
 * no marketing. The honesty about generated data belongs here, before the first
 * chart, not buried in a settings screen.
 */
const CARDS = [
  {
    title: 'Read markets, one small idea at a time',
    body: 'Short lessons. One principle each. Then you practise it on a chart and find out straight away how you did.',
    emoji: '📈',
  },
  {
    title: 'Every chart here is made up',
    body: 'Tikerino generates its practice charts. No real companies, no real prices, no real dates - just the shapes, so you can learn to read them.',
    emoji: '🎲',
  },
  {
    title: 'Nothing here is advice',
    body: 'This teaches you to read what a chart already shows. It will never tell you what to buy, and no pattern predicts the future.',
    emoji: '🧭',
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
