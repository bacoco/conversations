import type { Competency } from '../coach/coachApi';

/** Where the course teaches each competency: lesson and slide. */
export const LESSON_FOR_COMPETENCY: Record<
  Competency,
  { lessonId: string; slide: number }
> = {
  // Lesson 3 opens with a problem and the bricks, then one slide per brick.
  task: { lessonId: 'lesson-3', slide: 2 },
  context: { lessonId: 'lesson-3', slide: 3 },
  sources: { lessonId: 'lesson-8', slide: 2 },
  examples: { lessonId: 'lesson-6', slide: 1 },
  format: { lessonId: 'lesson-3', slide: 4 },
  audience: { lessonId: 'lesson-3', slide: 4 },
  constraints: { lessonId: 'lesson-3', slide: 5 },
  verification: { lessonId: 'lesson-5', slide: 1 },
};

/** Below this grade, the coach points to the matching lesson. */
export const LESSON_HINT_THRESHOLD = 60;
