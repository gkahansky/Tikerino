import { useCallback, useEffect, useRef, useState } from 'react';

import { xpCreditedByAnswer } from '@tikerino/state';

import type { AnswerResponse, WindowResponse } from './api';
import { useAppState } from './app-state';
import { exercisesForLesson, getLesson } from './content';
import { ExerciseScreen } from './screens/ExerciseScreen';
import { LegalScreen, type LegalDoc } from './screens/LegalScreen';
import { LessonCard } from './screens/LessonCard';
import { Onboarding } from './screens/Onboarding';
import { PathHome } from './screens/PathHome';
import { Profile } from './screens/Profile';
import { RevealScreen } from './screens/RevealScreen';

type Route =
  | { name: 'path' }
  | { name: 'profile' }
  | { name: 'legal'; doc: LegalDoc }
  | { name: 'lesson'; lessonId: string }
  | { name: 'exercise'; lessonId: string; index: number }
  | {
      name: 'reveal';
      lessonId: string;
      index: number;
      result: AnswerResponse;
      window: WindowResponse;
    };

export function App(): JSX.Element {
  const { progress, completeOnboarding, applyGradedAnswer } = useAppState();
  const [route, setRoute] = useState<Route>({ name: 'path' });
  // The exercise screen owns the window it fetched; the reveal needs it too.
  const [lastWindow, setLastWindow] = useState<WindowResponse | null>(null);

  // WCAG 2.4.3 / 4.1.3: a screen swap removes the control that had focus, so
  // screen readers were left on <body> and announced nothing. Move focus to the
  // new screen's heading and start it at the top.
  const firstRender = useRef(true);
  const routeKey = route.name === 'exercise' || route.name === 'reveal' ? `${route.name}-${route.lessonId}-${route.index}` : route.name;
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    window.scrollTo(0, 0);
    let frames = 0;
    let handle = 0;
    const focusHeading = () => {
      const heading = document.querySelector<HTMLElement>('main h1');
      if (heading) {
        if (!heading.hasAttribute('tabindex')) heading.setAttribute('tabindex', '-1');
        heading.focus({ preventScroll: true });
      } else if (frames++ < 60) {
        handle = requestAnimationFrame(focusHeading);
      }
    };
    handle = requestAnimationFrame(focusHeading);
    return () => cancelAnimationFrame(handle);
  }, [routeKey, progress.onboardingComplete]);

  const onGraded = useCallback(
    (lessonId: string, index: number, result: AnswerResponse, hintUsed: boolean) => {
      const lesson = getLesson(lessonId);
      const exerciseId = exercisesForLesson(lesson)[index]!.exerciseId;

      applyGradedAnswer({
        exerciseId,
        lessonId,
        correct: result.correct,
        xp: result.xp.total,
        hintUsed,
      });

      if (lastWindow) {
        setRoute({ name: 'reveal', lessonId, index, result, window: lastWindow });
      }
    },
    [applyGradedAnswer, lastWindow],
  );

  if (!progress.onboardingComplete) {
    return <Onboarding onDone={completeOnboarding} />;
  }

  switch (route.name) {
    case 'profile':
      return (
        <Profile
          onBack={() => setRoute({ name: 'path' })}
          onOpenLegal={(doc) => setRoute({ name: 'legal', doc })}
        />
      );

    case 'legal':
      return <LegalScreen doc={route.doc} onBack={() => setRoute({ name: 'profile' })} />;

    case 'lesson':
      return (
        <LessonCard
          lessonId={route.lessonId}
          onBack={() => setRoute({ name: 'path' })}
          onOpenProfile={() => setRoute({ name: 'profile' })}
          onStartExercises={() =>
            setRoute({ name: 'exercise', lessonId: route.lessonId, index: 0 })
          }
        />
      );

    case 'exercise': {
      const lesson = getLesson(route.lessonId);
      const exercises = exercisesForLesson(lesson);
      const exercise = exercises[route.index]!;
      return (
        <ExerciseScreen
          key={exercise.exerciseId}
          exerciseId={exercise.exerciseId}
          lessonId={route.lessonId}
          position={route.index + 1}
          total={exercises.length}
          onWindowLoaded={setLastWindow}
          onGraded={(result, hintUsed) => onGraded(route.lessonId, route.index, result, hintUsed)}
          onRevealResolved={(result) => {
            // Progress was recorded by the flush; this is the reveal it owed.
            if (lastWindow) {
              setRoute({ name: 'reveal', lessonId: route.lessonId, index: route.index, result, window: lastWindow });
            }
          }}
          onBack={() => setRoute({ name: 'lesson', lessonId: route.lessonId })}
          onOpenProfile={() => setRoute({ name: 'profile' })}
        />
      );
    }

    case 'reveal': {
      const lesson = getLesson(route.lessonId);
      const exercises = exercisesForLesson(lesson);
      const isLast = route.index >= exercises.length - 1;
      return (
        <RevealScreen
          result={route.result}
          window_={route.window}
          isLast={isLast}
          creditedXp={xpCreditedByAnswer(progress, route.lessonId, exercises[route.index]!.exerciseId)}
          onContinue={() =>
            setRoute(
              isLast
                ? { name: 'path' }
                : { name: 'exercise', lessonId: route.lessonId, index: route.index + 1 },
            )
          }
        />
      );
    }

    default:
      return (
        <PathHome
          onOpenLesson={(lessonId) => setRoute({ name: 'lesson', lessonId })}
          onOpenProfile={() => setRoute({ name: 'profile' })}
        />
      );
  }
}
