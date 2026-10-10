import { useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useShallow } from 'zustand/react/shallow';

import { useAiAvailable } from '../coach/aiAvailability';
import type { Competency } from '../coach/coachApi';
import { useCoachHistoryStore } from '../stores/useCoachHistoryStore';

import { getChallenges } from './challenges';
import { getCourseContent } from './content';
import {
  ProgressSnapshot,
  Step,
  buildSteps,
  computeSkillLevels,
  reviewCount,
} from './steps';
import { SkillLevel, useLearnProgressStore } from './useLearnProgressStore';

/** The course progress the path needs, re-rendering only when it changes. */
export const useLearnProgress = (): ProgressSnapshot =>
  useLearnProgressStore(
    useShallow((state) => ({
      completedLessons: state.completedLessons,
      bestQuizScores: state.bestQuizScores,
      knownCards: state.knownCards,
      completedChallenges: state.completedChallenges,
      doneStages: state.doneStages,
      currentStep: state.currentStep,
      cardSchedule: state.cardSchedule,
      questionsToReview: state.questionsToReview,
      checkpointsDone: state.checkpointsDone,
    })),
  );

/**
 * The level reached per competency, from the course and the real requests
 * read by the coach. A level reached is kept: it never goes down.
 */
export const useSkillLevels = (steps: Step[]) => {
  const progress = useLearnProgress();
  const history = useCoachHistoryStore((state) => state.entries);
  const kept = useLearnProgressStore((state) => state.skillLevels);
  const raiseSkills = useLearnProgressStore((state) => state.raiseSkills);
  const current = useMemo(
    () => computeSkillLevels(steps, progress, history),
    [steps, progress, history],
  );
  useEffect(() => {
    raiseSkills(current);
  }, [current, raiseSkills]);
  return useMemo(() => {
    const levels: Partial<Record<Competency, SkillLevel>> = { ...kept };
    for (const [skill, level] of Object.entries(current) as [
      Competency,
      SkillLevel,
    ][]) {
      if (level > (levels[skill] ?? 0)) {
        levels[skill] = level;
      }
    }
    return levels;
  }, [current, kept]);
};

/** The steps of the course, in the UI language, as offered right now. */
export const useCourseSteps = () => {
  const { i18n } = useTranslation();
  const isAiAvailable = useAiAvailable();
  return useMemo(
    () =>
      buildSteps(
        getCourseContent(i18n.language),
        getChallenges(i18n.language),
        isAiAvailable,
      ),
    [i18n.language, isAiAvailable],
  );
};

/** How many cards and questions are due for review. */
export const useReviewDue = () => {
  const steps = useCourseSteps();
  const progress = useLearnProgress();
  return useMemo(() => reviewCount(steps, progress), [steps, progress]);
};
