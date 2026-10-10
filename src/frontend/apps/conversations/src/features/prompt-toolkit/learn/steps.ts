import type { Competency } from '../coach/coachApi';
import type { CoachHistoryEntry } from '../stores/useCoachHistoryStore';

import type { Challenge } from './challenges';
import { LESSON_FOR_COMPETENCY } from './lessonForCompetency';
import type { CourseContent, Flashcard, Lesson, QuizQuestion } from './types';
import type { CardSchedule, SkillLevel } from './useLearnProgressStore';

/**
 * The course as one path: each step is a lesson done in a few times, read,
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

/** A review mixing the steps just done, after a few of them. */
export interface Checkpoint {
  id: string;
  number: number;
  lessonIds: string[];
}

export const CHECKPOINTS: Checkpoint[] = [
  {
    id: 'checkpoint-1',
    number: 1,
    lessonIds: ['lesson-1', 'lesson-2', 'lesson-3'],
  },
  {
    id: 'checkpoint-2',
    number: 2,
    lessonIds: ['lesson-4', 'lesson-5', 'lesson-6'],
  },
  { id: 'checkpoint-3', number: 3, lessonIds: ['lesson-7', 'lesson-8'] },
];

/** Questions in a checkpoint, per step reviewed. */
const CHECKPOINT_QUESTIONS_PER_STEP = 2;

/** From this many items due, the review comes first on the path. */
export const REVIEW_FIRST_FROM = 5;

/** The competencies shown to the learner, in the order of the course. */
export const SHOWN_SKILLS: Competency[] = [
  'task',
  'context',
  'audience',
  'format',
  'constraints',
  'sources',
  'examples',
  'verification',
];

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
  cardSchedule?: Record<string, CardSchedule>;
  questionsToReview?: Record<string, number>;
  checkpointsDone?: string[];
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

/** A checkpoint is due once its steps are done and it was not taken. */
export const dueCheckpoint = (steps: Step[], progress: ProgressSnapshot) =>
  CHECKPOINTS.find((checkpoint) => {
    if (progress.checkpointsDone?.includes(checkpoint.id)) {
      return false;
    }
    const covered = steps.filter((step) =>
      checkpoint.lessonIds.includes(step.lesson.id),
    );
    return (
      covered.length > 0 && covered.every((step) => isStepDone(step, progress))
    );
  }) ?? null;

/** The questions of a checkpoint: a couple per step, not the first ones. */
export const checkpointQuestions = (steps: Step[], checkpoint: Checkpoint) =>
  steps
    .filter((step) => checkpoint.lessonIds.includes(step.lesson.id))
    .flatMap((step) => step.quiz.slice(-CHECKPOINT_QUESTIONS_PER_STEP));

/**
 * Cards of the steps already read, due for review: never reviewed and not
 * known, or their time has come back.
 */
export const cardsToReview = (
  steps: Step[],
  progress: ProgressSnapshot,
  now = Date.now(),
) =>
  steps
    .filter((step) => isStageDone(step, 'read', progress))
    .flatMap((step) => step.cards)
    .filter((card) => {
      const schedule = progress.cardSchedule?.[card.id];
      if (schedule) {
        return schedule.due <= now;
      }
      return !progress.knownCards.includes(card.id);
    });

/** Questions missed or answered without being sure, to try again. */
export const questionsToReview = (
  steps: Step[],
  progress: ProgressSnapshot,
) => {
  const ids = Object.keys(progress.questionsToReview ?? {});
  return steps.flatMap((step) => step.quiz).filter((q) => ids.includes(q.id));
};

/** Everything due: cards and questions. */
export const reviewCount = (steps: Step[], progress: ProgressSnapshot) =>
  cardsToReview(steps, progress).length +
  questionsToReview(steps, progress).length;

/** About how long one time of a step takes, in minutes. */
export const stageMinutes = (step: Step, stage: Stage) => {
  switch (stage) {
    case 'read':
      return Math.max(1, Math.round(step.lesson.slides.length * 0.4));
    case 'cards':
      return Math.max(1, Math.round(step.cards.length * 0.3));
    case 'quiz':
      return Math.max(1, Math.round(step.quiz.length * 0.5));
    case 'practice':
      return step.challenge ? 3 : 2;
  }
};

/**
 * The competencies a lesson teaches: its own list, else its screens', else
 * where the course map says they are taught.
 */
export const lessonSkills = (lesson: Lesson): Competency[] => {
  if (lesson.skills?.length) {
    return lesson.skills;
  }
  const tagged = [
    ...new Set(
      lesson.slides
        .map((slide) => slide.skill)
        .filter((skill): skill is Competency => skill !== undefined),
    ),
  ];
  if (tagged.length > 0) {
    return tagged;
  }
  return SHOWN_SKILLS.filter(
    (skill) => LESSON_FOR_COMPETENCY[skill].lessonId === lesson.id,
  );
};

/** Where the course teaches a competency: the first screen about it. */
export const whereTaught = (steps: Step[], skill: Competency) => {
  for (const step of steps) {
    const slide = step.lesson.slides.findIndex((s) => s.skill === skill);
    if (slide !== -1) {
      return { step, slide };
    }
  }
  const mapped = LESSON_FOR_COMPETENCY[skill];
  const step = steps.find((s) => s.lesson.id === mapped.lessonId);
  return step ? { step, slide: mapped.slide } : null;
};

/** A competency is seen in real requests from this grade of the coach. */
export const SEEN_GRADE = 60;
/** Real requests looked at, and how many must show it to be "mastered". */
const RECENT_REQUESTS = 5;
const MASTERED_IN = 3;

/**
 * The level of each competency, in words: discovered once a step teaching
 * it is read, acquired once its questions or its exercise are passed,
 * mastered once the coach sees it in most recent real requests.
 */
export const computeSkillLevels = (
  steps: Step[],
  progress: ProgressSnapshot,
  history: CoachHistoryEntry[],
): Partial<Record<Competency, SkillLevel>> => {
  const recent = history.slice(0, RECENT_REQUESTS);
  const levels: Partial<Record<Competency, SkillLevel>> = {};
  for (const skill of SHOWN_SKILLS) {
    const teaching = steps.filter((step) =>
      lessonSkills(step.lesson).includes(skill),
    );
    const isDiscovered = teaching.some((step) =>
      isStageDone(step, 'read', progress),
    );
    const isAcquired = teaching.some(
      (step) =>
        (progress.bestQuizScores[step.lesson.id] ?? 0) >= 75 ||
        (step.challenge !== undefined &&
          progress.completedChallenges.includes(step.challenge.id) &&
          step.challenge.targets.includes(skill)),
    );
    const seen = recent.filter(
      (entry) => entry.competencies[skill] >= SEEN_GRADE,
    ).length;
    const isMastered = recent.length >= MASTERED_IN && seen >= MASTERED_IN;
    levels[skill] = isMastered
      ? 3
      : isAcquired
        ? 2
        : isDiscovered || seen > 0
          ? 1
          : 0;
  }
  return levels;
};
