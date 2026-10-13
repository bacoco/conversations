import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

import { useCasesStore } from '../learn/cases/casesProgress';
import { getCourseContent } from '../learn/content';
import {
  FULL_QUIZ,
  useLearnProgressStore,
} from '../learn/useLearnProgressStore';

import { computeProgress } from './progress';
import { QUIZ_PASS, UsageFacts, useRewardsStore } from './useRewardsStore';

/**
 * The real use recorded in this browser, the level and the badges it
 * gives. What is reached is kept, so that it never goes down.
 */
export const useProgress = () => {
  const { i18n } = useTranslation();
  const rewards = useRewardsStore(
    useShallow((state) => ({
      points: state.points,
      counts: state.counts,
      badges: state.badges,
      levelReached: state.levelReached,
    })),
  );
  const done = useCasesStore((state) => state.done);
  const learn = useLearnProgressStore(
    useShallow((state) => ({
      completedLessons: state.completedLessons,
      bestQuizScores: state.bestQuizScores,
      completedChallenges: state.completedChallenges,
    })),
  );
  const lessonsTotal = getCourseContent(i18n.language).lessons.length;

  const facts = useMemo<UsageFacts>(
    () => ({
      counts: rewards.counts,
      rewardPoints: rewards.points,
      casesDone: Object.keys(done).length,
      lessonsDone: learn.completedLessons.length,
      lessonsTotal,
      lessonQuizzesPassed: Object.entries(learn.bestQuizScores).filter(
        ([scope, score]) => scope !== FULL_QUIZ && score >= QUIZ_PASS,
      ).length,
      fullQuizBest: learn.bestQuizScores[FULL_QUIZ] ?? null,
      challengesDone: learn.completedChallenges.length,
    }),
    [rewards.counts, rewards.points, done, learn, lessonsTotal],
  );
  const progress = useMemo(
    () =>
      computeProgress(facts, {
        level: rewards.levelReached,
        badges: rewards.badges,
      }),
    [facts, rewards.levelReached, rewards.badges],
  );

  const keep = useRewardsStore((state) => state.keep);
  useEffect(() => {
    keep(progress.level.id, progress.earned);
  }, [keep, progress]);

  return { facts, progress };
};
