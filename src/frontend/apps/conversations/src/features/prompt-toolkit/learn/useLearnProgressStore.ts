import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Quiz scope: one lesson id, or every question of the course. */
export const FULL_QUIZ = 'all';

export type LearnTab = 'lessons' | 'cards' | 'quiz' | 'challenges';

interface LearnProgressState {
  completedLessons: string[];
  /** Best share of right answers (0-100) per quiz scope. */
  bestQuizScores: Record<string, number>;
  knownCards: string[];
  /** Challenges the user fixed to the coach's satisfaction. */
  completedChallenges: string[];
  completeChallenge: (challengeId: string) => void;
  /** Where the user left off, to resume instead of starting over. */
  slidePositions: Record<string, number>;
  cardIndex: number;
  lastTab: LearnTab;
  setSlidePosition: (lessonId: string, index: number) => void;
  setCardIndex: (index: number) => void;
  setLastTab: (tab: LearnTab) => void;
  completeLesson: (lessonId: string) => void;
  recordQuiz: (scope: string, score: number) => void;
  setCardKnown: (cardId: string, isKnown: boolean) => void;
  /** Forget one lesson: completion, position and its quiz score. */
  resetLesson: (lessonId: string) => void;
  resetFullQuiz: () => void;
  resetCards: () => void;
  reset: () => void;
}

/** Course progress, kept in this browser only. */
export const useLearnProgressStore = create<LearnProgressState>()(
  persist(
    (set) => ({
      completedLessons: [],
      bestQuizScores: {},
      knownCards: [],
      completedChallenges: [],
      completeChallenge: (challengeId) =>
        set((state) => ({
          completedChallenges: state.completedChallenges.includes(challengeId)
            ? state.completedChallenges
            : [...state.completedChallenges, challengeId],
        })),
      slidePositions: {},
      cardIndex: 0,
      lastTab: 'lessons',
      setSlidePosition: (lessonId, index) =>
        set((state) => ({
          slidePositions: { ...state.slidePositions, [lessonId]: index },
        })),
      setCardIndex: (cardIndex) => set({ cardIndex }),
      setLastTab: (lastTab) => set({ lastTab }),
      completeLesson: (lessonId) =>
        set((state) =>
          state.completedLessons.includes(lessonId)
            ? state
            : { completedLessons: [...state.completedLessons, lessonId] },
        ),
      recordQuiz: (scope, score) =>
        set((state) => ({
          bestQuizScores: {
            ...state.bestQuizScores,
            [scope]: Math.max(score, state.bestQuizScores[scope] ?? 0),
          },
        })),
      setCardKnown: (cardId, isKnown) =>
        set((state) => ({
          knownCards: isKnown
            ? [...new Set([...state.knownCards, cardId])]
            : state.knownCards.filter((id) => id !== cardId),
        })),
      resetLesson: (lessonId) =>
        set((state) => {
          const slidePositions = { ...state.slidePositions };
          const bestQuizScores = { ...state.bestQuizScores };
          delete slidePositions[lessonId];
          delete bestQuizScores[lessonId];
          return {
            completedLessons: state.completedLessons.filter(
              (id) => id !== lessonId,
            ),
            slidePositions,
            bestQuizScores,
          };
        }),
      resetFullQuiz: () =>
        set((state) => {
          const bestQuizScores = { ...state.bestQuizScores };
          delete bestQuizScores[FULL_QUIZ];
          return { bestQuizScores };
        }),
      resetCards: () => set({ knownCards: [], cardIndex: 0 }),
      reset: () =>
        set({
          completedLessons: [],
          bestQuizScores: {},
          knownCards: [],
          completedChallenges: [],
          slidePositions: {},
          cardIndex: 0,
          lastTab: 'lessons',
        }),
    }),
    { name: 'prompt-course-progress' },
  ),
);
