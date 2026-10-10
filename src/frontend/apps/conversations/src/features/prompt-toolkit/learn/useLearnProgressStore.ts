import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Competency } from '../coach/coachApi';

import type { Stage } from './steps';

/** Quiz scope: one lesson id, or every question of the course. */
export const FULL_QUIZ = 'all';

export const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Spaced review: a card known comes back after 1, 3, 7, then 21 days; a
 * card not known comes back at the next review.
 */
export const REVIEW_INTERVALS_DAYS = [0, 1, 3, 7, 21];

/** 0: not met; 1: discovered; 2: acquired; 3: mastered. */
export type SkillLevel = 0 | 1 | 2 | 3;

export interface CardSchedule {
  /** The box of the card: 0 to review now, 4 known for long. */
  box: number;
  /** When it is due again (ms). */
  due: number;
}

export interface PendingPractice {
  lessonId: string;
  skills: Competency[];
  since: number;
}

/** Sessions kept to count the weeks; enough for half a year. */
const SESSIONS_KEPT = 200;

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
  /** Stages of a step finished or passed on purpose, per lesson id. */
  doneStages: Record<string, Stage[]>;
  markStage: (lessonId: string, stage: Stage) => void;
  /** The step the user is doing, to resume it from the path. */
  currentStep: string | null;
  setCurrentStep: (lessonId: string | null) => void;
  /** When each card comes back, per card id. */
  cardSchedule: Record<string, CardSchedule>;
  /** The user says whether they knew a card: it comes back accordingly. */
  reviewCard: (cardId: string, isKnown: boolean, now?: number) => void;
  /** Questions missed or answered without being sure: to review. */
  questionsToReview: Record<string, number>;
  markQuestionToReview: (questionId: string, now?: number) => void;
  clearQuestionToReview: (questionId: string) => void;
  /** Screens kept in "my memo", as "lessonId:index". */
  savedScreens: string[];
  toggleSavedScreen: (lessonId: string, index: number) => void;
  /** The best level reached per competency: it never goes down. */
  skillLevels: Partial<Record<Competency, SkillLevel>>;
  raiseSkills: (levels: Partial<Record<Competency, SkillLevel>>) => void;
  /** The reviews after a few steps, done. */
  checkpointsDone: string[];
  completeCheckpoint: (checkpointId: string) => void;
  /** The level test was taken. */
  placementDone: boolean;
  setPlacementDone: () => void;
  /** Sessions a week the user aims at; null: not chosen. */
  weeklyGoal: number | null;
  /** The question about the pace was asked once. */
  goalAsked: boolean;
  setWeeklyGoal: (goal: number | null) => void;
  /** When each session ended (ms), oldest first. */
  sessions: number[];
  recordSession: (now?: number) => void;
  /** A step to try on a real request: the coach checks it. */
  pendingPractice: PendingPractice | null;
  setPendingPractice: (practice: PendingPractice | null) => void;
  setSlidePosition: (lessonId: string, index: number) => void;
  setCardIndex: (index: number) => void;
  completeLesson: (lessonId: string) => void;
  recordQuiz: (scope: string, score: number) => void;
  setCardKnown: (cardId: string, isKnown: boolean) => void;
  /** Forget one lesson: completion, position and its quiz score. */
  resetLesson: (lessonId: string) => void;
  resetFullQuiz: () => void;
  resetCards: () => void;
  reset: () => void;
}

const addOnce = (list: string[], item: string) =>
  list.includes(item) ? list : [...list, item];

const initialProgress = {
  completedLessons: [] as string[],
  bestQuizScores: {} as Record<string, number>,
  knownCards: [] as string[],
  completedChallenges: [] as string[],
  slidePositions: {} as Record<string, number>,
  cardIndex: 0,
  doneStages: {} as Record<string, Stage[]>,
  currentStep: null as string | null,
  cardSchedule: {} as Record<string, CardSchedule>,
  questionsToReview: {} as Record<string, number>,
  savedScreens: [] as string[],
  skillLevels: {} as Partial<Record<Competency, SkillLevel>>,
  checkpointsDone: [] as string[],
  placementDone: false,
  weeklyGoal: null as number | null,
  goalAsked: false,
  sessions: [] as number[],
  pendingPractice: null as PendingPractice | null,
};

/** Course progress, kept in this browser only. */
export const useLearnProgressStore = create<LearnProgressState>()(
  persist(
    (set) => ({
      ...initialProgress,
      completeChallenge: (challengeId) =>
        set((state) => ({
          completedChallenges: addOnce(state.completedChallenges, challengeId),
        })),
      markStage: (lessonId, stage) =>
        set((state) =>
          state.doneStages[lessonId]?.includes(stage)
            ? state
            : {
                doneStages: {
                  ...state.doneStages,
                  [lessonId]: [...(state.doneStages[lessonId] ?? []), stage],
                },
              },
        ),
      setCurrentStep: (currentStep) => set({ currentStep }),
      reviewCard: (cardId, isKnown, now = Date.now()) =>
        set((state) => {
          const box = isKnown
            ? Math.min((state.cardSchedule[cardId]?.box ?? 0) + 1, 4)
            : 0;
          return {
            cardSchedule: {
              ...state.cardSchedule,
              [cardId]: { box, due: now + REVIEW_INTERVALS_DAYS[box] * DAY_MS },
            },
            knownCards: isKnown
              ? addOnce(state.knownCards, cardId)
              : state.knownCards.filter((id) => id !== cardId),
          };
        }),
      markQuestionToReview: (questionId, now = Date.now()) =>
        set((state) => ({
          questionsToReview: { ...state.questionsToReview, [questionId]: now },
        })),
      clearQuestionToReview: (questionId) =>
        set((state) => {
          if (!(questionId in state.questionsToReview)) {
            return state;
          }
          const questionsToReview = { ...state.questionsToReview };
          delete questionsToReview[questionId];
          return { questionsToReview };
        }),
      toggleSavedScreen: (lessonId, index) =>
        set((state) => {
          const key = `${lessonId}:${index}`;
          return {
            savedScreens: state.savedScreens.includes(key)
              ? state.savedScreens.filter((item) => item !== key)
              : [...state.savedScreens, key],
          };
        }),
      raiseSkills: (levels) =>
        set((state) => {
          const skillLevels = { ...state.skillLevels };
          let changed = false;
          for (const [skill, level] of Object.entries(levels) as [
            Competency,
            SkillLevel,
          ][]) {
            if (level > (skillLevels[skill] ?? 0)) {
              skillLevels[skill] = level;
              changed = true;
            }
          }
          return changed ? { skillLevels } : state;
        }),
      completeCheckpoint: (checkpointId) =>
        set((state) => ({
          checkpointsDone: addOnce(state.checkpointsDone, checkpointId),
        })),
      setPlacementDone: () => set({ placementDone: true }),
      setWeeklyGoal: (weeklyGoal) => set({ weeklyGoal, goalAsked: true }),
      recordSession: (now = Date.now()) =>
        set((state) => ({
          sessions: [...state.sessions, now].slice(-SESSIONS_KEPT),
        })),
      setPendingPractice: (pendingPractice) => set({ pendingPractice }),
      setSlidePosition: (lessonId, index) =>
        set((state) => ({
          slidePositions: { ...state.slidePositions, [lessonId]: index },
        })),
      setCardIndex: (cardIndex) => set({ cardIndex }),
      completeLesson: (lessonId) =>
        set((state) => ({
          completedLessons: addOnce(state.completedLessons, lessonId),
        })),
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
            ? addOnce(state.knownCards, cardId)
            : state.knownCards.filter((id) => id !== cardId),
        })),
      resetLesson: (lessonId) =>
        set((state) => {
          const slidePositions = { ...state.slidePositions };
          const bestQuizScores = { ...state.bestQuizScores };
          const doneStages = { ...state.doneStages };
          delete slidePositions[lessonId];
          delete bestQuizScores[lessonId];
          delete doneStages[lessonId];
          return {
            completedLessons: state.completedLessons.filter(
              (id) => id !== lessonId,
            ),
            slidePositions,
            bestQuizScores,
            doneStages,
            currentStep:
              state.currentStep === lessonId ? null : state.currentStep,
          };
        }),
      resetFullQuiz: () =>
        set((state) => {
          const bestQuizScores = { ...state.bestQuizScores };
          delete bestQuizScores[FULL_QUIZ];
          return { bestQuizScores };
        }),
      // The cards are to learn again: their stage in each step too.
      resetCards: () =>
        set((state) => ({
          knownCards: [],
          cardIndex: 0,
          cardSchedule: {},
          doneStages: Object.fromEntries(
            Object.entries(state.doneStages).map(([lessonId, stages]) => [
              lessonId,
              stages.filter((stage) => stage !== 'cards'),
            ]),
          ),
        })),
      reset: () => set({ ...initialProgress }),
    }),
    { name: 'prompt-course-progress' },
  ),
);
