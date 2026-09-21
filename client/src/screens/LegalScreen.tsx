import { useAppState } from '../app-state';
import { Screen, TopBar } from '../components/ui';

export type LegalDoc = 'terms' | 'privacy';

interface LegalSection {
  heading: string;
  body: string;
}

/**
 * The two disclaimers that used to be onboarding cards live here now: the
 * walkthrough explains what the app does, the legal pages say what it is not.
 * Client-side only - the engine spec locks the server to its two endpoints.
 */
const DOCS: Record<LegalDoc, { title: string; sections: LegalSection[] }> = {
  terms: {
    title: 'Terms of use',
    sections: [
      {
        heading: 'What Tikerino is',
        body: 'Tikerino is a practice game. It teaches you to read what a chart already shows - one small principle at a time, on generated practice charts.',
      },
      {
        heading: 'Nothing here is advice',
        body: 'Tikerino will never tell you what to buy or sell, and no pattern predicts the future. Nothing in the app is investment advice, a recommendation, or an offer of any kind. Decisions about real money are yours alone, and if you want advice, speak to a licensed adviser.',
      },
      {
        heading: 'No warranties',
        body: 'The app is provided as is, without warranties of any kind. To the fullest extent permitted by law, Tikerino is not liable for any loss or damage connected with using it.',
      },
    ],
  },
  privacy: {
    title: 'Privacy policy',
    sections: [
      {
        heading: 'Every chart here is made up',
        body: 'Tikerino generates its practice charts. No real companies, no real prices, no real dates - just the shapes, so you can learn to read them. Any resemblance to a real security is coincidence.',
      },
      {
        heading: 'Progress stays on your device',
        body: 'Your XP, streak and lesson progress live in this browser, on this device. There are no accounts and no sign-in, so there is nothing personal to sync or leak.',
      },
      {
        heading: 'What the server keeps',
        body: 'When you answer an exercise, the answer goes to the server for grading. The server keeps an audit record of graded answers - which exercise, which answer, right or wrong - so a retry never counts twice. That record is tied to a random id from your device, not to your name or an account.',
      },
      {
        heading: 'No tracking',
        body: 'No analytics, no advertising, no third-party trackers, no cookies beyond what the app itself needs to run.',
      },
    ],
  },
};

export function LegalScreen({ doc, onBack }: { doc: LegalDoc; onBack: () => void }): JSX.Element {
  const { progress, displayStreak } = useAppState();
  const { title, sections } = DOCS[doc];

  return (
    <Screen>
      <TopBar onBack={onBack} backLabel="Profile" xp={progress.totalXp} streak={displayStreak} />

      <h1 className="text-xl mt-2 mb-4">{title}</h1>

      <div className="space-y-4">
        {sections.map((section) => (
          <section key={section.heading}>
            <h2 className="text-lg mb-1">{section.heading}</h2>
            <p className="text-ink-2 m-0">{section.body}</p>
          </section>
        ))}
      </div>
    </Screen>
  );
}
