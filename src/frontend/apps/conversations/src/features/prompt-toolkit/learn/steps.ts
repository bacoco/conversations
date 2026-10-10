import type { Challenge } from './challenges';
import type { CourseContent, Flashcard, Lesson, QuizQuestion } from './types';

/**
 * The course as one path: each step is a lesson done in four times, read,
 * remember (its cards), check (its quiz) and practise (its challenge, or a
 * try with the coach on a real request).
 */
export type Stage = 'read' | 'cards' | 'quiz' | 'practice';

export const STAGE_ORDER: Stage[] = ['read', 'cards', 'quiz', 'practice'];

/** The challenge that practises each lesson; none: a try with the coach. */
export const CHALLENGE_FOR_LESSON: Record<string, string | undefined> = {
  'lesson-2': 'vague',
  'lesson-3': 'no-context',
  'lesson-4': 'contradictory',
  'lesson-5': 'no-format',
  'lesson-7': 'multi-task',
  'lesson-8': 'hallucination',
};

export interface Step {
  number: number;
  lesson: Lesson;
  cards: Flashcard[];
  quiz: QuizQuestion[];
  /** Undefined without the coach (the Albert relay) or for a coach try. */
  challenge?: Challenge;
  /** Practice is a try with the coach on a real request. */
  practiseWithCoach: boolean;
  stages: Stage[];
}

/** The steps of the course; practice needs the coach to grade or guide. */
export const buildSteps = (
  course: CourseContent,
  challenges: Challenge[],
  isAiAvailable: boolean,
): Step[] =>
  course.lessons.map((lesson, index) => {
    const cards = course.flashcards.filter((c) => c.lessonId === lesson.id);
    const quiz = course.quiz.filter((q) => q.lessonId === lesson.id);
    const challengeId = CHALLENGE_FOR_LESSON[lesson.id];
    const challenge = isAiAvailable
      ? challenges.find((c) => c.id === challengeId)
      : undefined;
    const practiseWithCoach = isAiAvailable && !challenge;
    return {
      number: index + 1,
      lesson,
      cards,
      quiz,
      challenge,
      practiseWithCoach,
      stages: STAGE_ORDER.filter(
        (stage) =>
          (stage !== 'cards' || cards.length > 0) &&
          (stage !== 'quiz' || quiz.length > 0) &&
          (stage !== 'practice' || isAiAvailable),
      ),
    };
  });

/** What the progress store knows, read by the helpers below. */
export interface ProgressSnapshot {
  completedLessons: string[];
  bestQuizScores: Record<string, number>;
  knownCards: string[];
  completedChallenges: string[];
  doneStages: Record<string, Stage[]>;
  currentStep: string | null;
}

/** A stage is done when it was finished or passed on purpose. */
export const isStageDone = (
  step: Step,
  stage: Stage,
  progress: ProgressSnapshot,
) => {
  const id = step.lesson.id;
  if (progress.doneStages[id]?.includes(stage)) {
    return true;
  }
  switch (stage) {
    case 'read':
      return progress.completedLessons.includes(id);
    case 'cards':
      return (
        step.cards.length > 0 &&
        step.cards.every((card) => progress.knownCards.includes(card.id))
      );
    case 'quiz':
      return progress.bestQuizScores[id] !== undefined;
    case 'practice':
      return (
        step.challenge !== undefined &&
        progress.completedChallenges.includes(step.challenge.id)
      );
  }
};

export const isStepDone = (step: Step, progress: ProgressSnapshot) =>
  step.stages.every((stage) => isStageDone(step, stage, progress));

export const isStepStarted = (step: Step, progress: ProgressSnapshot) =>
  step.stages.some((stage) => isStageDone(step, stage, progress)) ||
  progress.currentStep === step.lesson.id;

/** The first stage of a step still to do, or null when it is finished. */
export const nextStage = (step: Step, progress: ProgressSnapshot) =>
  step.stages.find((stage) => !isStageDone(step, stage, progress)) ?? null;

/**
 * "Your next step": the step being done, else the first one left. Null when
 * the whole path is finished.
 */
export const nextStep = (steps: Step[], progress: ProgressSnapshot) => {
  const current = steps.find(
    (step) =>
      step.lesson.id === progress.currentStep && !isStepDone(step, progress),
  );
  return current ?? steps.find((step) => !isStepDone(step, progress)) ?? null;
};

/** Cards of the steps already read and not known yet: to review. */
export const cardsToReview = (steps: Step[], progress: ProgressSnapshot) =>
  steps
    .filter((step) => isStageDone(step, 'read', progress))
    .flatMap((step) => step.cards)
    .filter((card) => !progress.knownCards.includes(card.id));
