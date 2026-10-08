import { COURSE_EN } from '../learn/content/en';
import { COURSE_FR } from '../learn/content/fr';
import { LESSON_FOR_COMPETENCY } from '../learn/lessonForCompetency';

describe('lesson for each competency', () => {
  it.each([
    [
      'fr',
      COURSE_FR,
      {
        task: /tâche/i,
        context: /contexte/i,
        format: /format/i,
        constraints: /contraintes/i,
      },
    ],
    [
      'en',
      COURSE_EN,
      {
        task: /task/i,
        context: /context/i,
        format: /format/i,
        constraints: /constraints/i,
      },
    ],
  ])('points to the slide on that topic (%s)', (_, course, expected) => {
    for (const [competency, pattern] of Object.entries(expected)) {
      const target =
        LESSON_FOR_COMPETENCY[competency as keyof typeof LESSON_FOR_COMPETENCY];
      const lesson = course.lessons.find((l) => l.id === target.lessonId);
      expect(lesson?.slides[target.slide]?.title).toMatch(pattern);
    }
  });
});
