import { isLessonUnlocked, returnStateFor } from '@tikerino/state';

import { useAppState } from '../app-state';
import { lessons, orderedLessonIds } from '../content';
import { Screen } from '../components/ui';

export function PathHome({ onOpenLesson, onOpenProfile }: {
  onOpenLesson: (lessonId: string) => void;
  onOpenProfile: () => void;
}): JSX.Element {
  const { progress, displayStreak, pendingCount, syncState } = useAppState();
  const firstIncomplete = lessons.findIndex((lesson) => !progress.lessons[lesson.lessonId]?.completed);
  const allDone = firstIncomplete === -1;
  const currentLesson = allDone ? lessons[lessons.length - 1]! : lessons[firstIncomplete]!;
  const back = returnStateFor(progress);
  const completedCount = lessons.filter((lesson) => progress.lessons[lesson.lessonId]?.completed).length;
  const nextGate = lessons.find((lesson) => !isLessonUnlocked(progress, orderedLessonIds, lesson.lessonId));

  return (
    <div className="journey-shell">
      <Screen>
        <header className="journey-hud" aria-label="Journey summary">
          <div>
            <span className="journey-kicker">Knowledge Index</span>
            <strong className="journey-index tabular">{progress.knowledgeIndexXp} XP</strong>
          </div>
          <button type="button" onClick={onOpenProfile} className="journey-profile target"
            aria-label={`${displayStreak} day${displayStreak === 1 ? '' : 's'} persistence. Your progress: Knowledge Index ${progress.knowledgeIndexXp} XP`}>
            <span aria-hidden="true">▥</span><span>{displayStreak} day{displayStreak === 1 ? '' : 's'}</span>
          </button>
        </header>

        {pendingCount > 0 && (
          <p role="status" className="journey-sync">
            {syncState === 'confirming'
              ? `Confirming ${pendingCount} queued answer${pendingCount === 1 ? '' : 's'}…`
              : `${pendingCount} answer${pendingCount === 1 ? '' : 's'} queued · checked when you reconnect`}
          </p>
        )}

        <section className="journey-intro" aria-labelledby="journey-title">
          <p className="journey-kicker">Your learning market</p>
          <h1 id="journey-title">The Living Chart</h1>
          <p>Complete the live candle to raise your Knowledge Index.</p>
        </section>

        <section className="journey-plot" aria-label="Lesson candles">
          <div className="journey-grid" aria-hidden="true" />
          {/* Newest candle on top: the DOM runs top to bottom so focus order matches
              reading order (no column-reverse). */}
          <ol className="candle-path" reversed>
            {lessons.map((lesson, index) => ({ lesson, index })).reverse().map(({ lesson, index }) => {
              const state = progress.lessons[lesson.lessonId];
              const unlocked = isLessonUnlocked(progress, orderedLessonIds, lesson.lessonId);
              const done = state?.completed === true;
              const current = lesson.lessonId === currentLesson.lessonId && !allDone;
              const status = done ? 'Complete' : current ? 'LIVE · forming' : unlocked ? 'Ready' : 'Resistance · locked';
              return (
                <li key={lesson.lessonId} className={`lesson-candle-row ${current ? 'is-current' : ''}`}>
                  <span className="candle-step tabular" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  <button type="button" disabled={!unlocked} onClick={() => onOpenLesson(lesson.lessonId)}
                    className={`lesson-candle target ${done ? 'is-complete' : current ? 'is-forming' : unlocked ? 'is-ready' : 'is-locked'}`}
                    aria-label={`${lesson.title}. ${status}${unlocked ? '. Open lesson' : '. Finish the previous lesson to unlock'}`}>
                    <span className="candle-mark" aria-hidden="true"><i /></span>
                    <span className="candle-copy"><strong>{lesson.title}</strong><small>{status}</small></span>
                    <span className="candle-symbol" aria-hidden="true">{done ? '✓' : current ? '↑' : unlocked ? '▶' : '◇'}</span>
                  </button>
                </li>
              );
            })}
          </ol>
          {nextGate && <div className="resistance-gate" role="note">
            <span>Resistance</span><strong>{nextGate.title}</strong><small>Locked · complete the live candle first</small>
          </div>}
        </section>

        <section className="persistence-panel" aria-label="Persistence">
          <div><span className="journey-kicker">Persistence</span><strong>{back.kind === 'returning' ? 'Welcome back' : displayStreak === 0 ? 'Start today' : `Day ${displayStreak}`}</strong></div>
          {/* One slot per day of the current week of persistence; filled slots are real
              active days, not a decorative pattern. */}
          <div className="volume-bars" aria-hidden="true">{Array.from({ length: 7 }, (_, index) => <i key={index} className={index < Math.min(displayStreak, 7) ? 'is-active' : ''} />)}</div>
          {back.kind === 'returning' ? (
            <p className="persistence-return">
              Everything you earned is still here: {progress.knowledgeIndexXp} XP and {completedCount} completed candle{completedCount === 1 ? '' : 's'}. Practise today to start a new run.
            </p>
          ) : (
            <p>Practice builds volume. Missing a day never removes earned progress.</p>
          )}
          {back.lifetimeDays > 0 && (
            <p className="persistence-lifetime tabular">{back.lifetimeDays} practice day{back.lifetimeDays === 1 ? '' : 's'} in total</p>
          )}
        </section>

        <button type="button" onClick={() => onOpenLesson(currentLesson.lessonId)} className="journey-cta target">
          <span>{allDone ? 'Replay the latest candle' : 'Continue the live candle'}</span><strong>{currentLesson.title}</strong>
        </button>
      </Screen>
    </div>
  );
}
