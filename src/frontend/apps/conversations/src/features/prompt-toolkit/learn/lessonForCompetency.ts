import type { Competency } from '../coach/coachApi';

/** Where the course teaches each competency: lesson and slide. */
export const LESSON_FOR_COMPETENCY: Record<
  Competency,
  { lessonId: string; slide: number }
> = {
  // Lesson 3 opens with an introduction, then one slide per brick.
  task: { lessonId: 'lesson-3', slide: 1 },
  context: { lessonId: 'lesson-3', slide: 2 },
  sources: { lessonId: 'lesson-3', slide: 2 },
  examples: { lessonId: 'lesson-6', slide: 0 },
  format: { lessonId: 'lesson-3', slide: 3 },
  audience: { lessonId: 'lesson-3', slide: 3 },
  constraints: { lessonId: 'lesson-3', slide: 4 },
  verification: { lessonId: 'lesson-5', slide: 0 },
};

/** Below this grade, the coach points to the matching lesson. */
export const LESSON_HINT_THRESHOLD = 60;
