import { useShallow } from 'zustand/react/shallow';

import type { ProgressSnapshot } from './steps';
import { useLearnProgressStore } from './useLearnProgressStore';

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
    })),
  );
