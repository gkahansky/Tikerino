import { isLessonUnlocked } from '@tikerino/state';

import { useAppState } from '../app-state';
import { lessons, lessonsForTopic, orderedLessonIds, topics } from '../content';
import { Screen, TopBar } from '../components/ui';

export function PathHome({
  onOpenLesson,
  onOpenProfile,
}: {
  onOpenLesson: (lessonId: string) => void;
  onOpenProfile: () => void;
}): JSX.Element {
  const { progress, displayStreak } = useAppState();

  const nextLesson = lessons.find((lesson) => !progress.lessons[lesson.lessonId]?.completed);

  return (
    <Screen>
      <TopBar xp={progress.totalXp} streak={displayStreak} onProfile={onOpenProfile} />

      <h1 className="text-xl mt-2 mb-1">Your path</h1>
      <p className="text-ink-2 text-sm mt-0 mb-5">
        {nextLesson ? `Up next: ${nextLesson.title}` : 'Every lesson done. Replay any of them.'}
      </p>

      {topics.map((topic) => (
        <section key={topic.topicId} className="mb-7">
          <h2 className="text-lg mb-3">{topic.title}</h2>

          <ol className="list-none p-0 m-0 space-y-3">
            {lessonsForTopic(topic.topicId).map((lesson) => {
              const state = progress.lessons[lesson.lessonId];
              const unlocked = isLessonUnlocked(progress, orderedLessonIds, lesson.lessonId);
              const done = state?.completed === true;
              const answered = state?.completedExerciseIds.length ?? 0;

              return (
                <li key={lesson.lessonId}>
                  <button
                    type="button"
                    disabled={!unlocked}
                    onClick={() => onOpenLesson(lesson.lessonId)}
                    aria-describedby={`${lesson.lessonId}-meta`}
                    className={`card target w-full text-left px-4 py-3 flex items-center gap-3 ${
                      unlocked ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'
                    } ${done ? 'border-brand' : ''}`}
                  >
                    <span
                      aria-hidden="true"
                      className={`shrink-0 grid place-items-center w-11 h-11 rounded-full text-lg ${
                        done ? 'bg-brand text-ink' : unlocked ? 'bg-brand-soft' : 'bg-line'
                      }`}
                    >
                      {done ? '★' : unlocked ? '▶' : '🔒'}
                    </span>

                    <span className="flex-1">
                      <span className="block font-display font-bold">{lesson.title}</span>
                      <span id={`${lesson.lessonId}-meta`} className="block text-ink-2 text-sm">
                        {!unlocked
                          ? 'Finish the lesson before this one to unlock'
                          : done
                            ? `Done · ${state?.crownLevel ?? 0} crown${(state?.crownLevel ?? 0) === 1 ? '' : 's'} · ${lesson.estimatedMinutes} min`
                            : `${lesson.estimatedMinutes} min · ${answered}/${lesson.exerciseIds.length} exercises`}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      ))}
    </Screen>
  );
}
