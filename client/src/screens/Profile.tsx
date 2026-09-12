import { useAppState } from '../app-state';
import { lessons, meta } from '../content';
import { Screen, SecondaryButton, TopBar } from '../components/ui';

export function Profile({ onBack }: { onBack: () => void }): JSX.Element {
  const { progress, displayStreak, pendingCount, reset } = useAppState();

  const completed = lessons.filter((l) => progress.lessons[l.lessonId]?.completed).length;
  const crowns = lessons.reduce(
    (total, lesson) => total + (progress.lessons[lesson.lessonId]?.crownLevel ?? 0),
    0,
  );
  const answered = Object.keys(progress.answers).length;
  const correct = Object.values(progress.answers).filter((a) => a.correct).length;

  return (
    <Screen
      footer={
        <SecondaryButton
          onClick={() => {
            if (window.confirm('Erase your XP, streak and lesson progress on this device?')) {
              reset();
              onBack();
            }
          }}
        >
          Reset my progress
        </SecondaryButton>
      }
    >
      <TopBar onBack={onBack} backLabel="Path" xp={progress.totalXp} streak={displayStreak} />

      <h1 className="text-xl mt-2 mb-4">Your progress</h1>

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Total XP" value={progress.totalXp} />
        <Stat label="Day streak" value={displayStreak} />
        <Stat label="Lessons done" value={`${completed}/${lessons.length}`} />
        <Stat label="Crowns" value={crowns} />
        <Stat label="Questions answered" value={answered} />
        <Stat label="Answered correctly" value={correct} />
      </div>

      {progress.streak.longest > 0 && (
        <p className="text-ink-2 text-sm mt-4 tabular">
          Longest streak: {progress.streak.longest} day
          {progress.streak.longest === 1 ? '' : 's'}.
        </p>
      )}

      {pendingCount > 0 && (
        <p className="card bg-sun-soft border-sun px-4 py-3 mt-4 text-sm">
          {pendingCount} answer{pendingCount === 1 ? '' : 's'} locked offline. They are graded, and
          revealed, as soon as you reconnect.
        </p>
      )}

      <p className="text-ink-2 text-sm mt-6">
        Progress is stored on this device only - there are no accounts. {meta.syntheticDataLabel}
      </p>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string | number }): JSX.Element {
  return (
    <div className="card px-4 py-3">
      <p className="text-2xl font-display font-bold m-0 tabular">{value}</p>
      <p className="text-ink-2 text-sm m-0">{label}</p>
    </div>
  );
}
