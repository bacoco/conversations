import { fireEvent, render, screen, within } from '@testing-library/react';

import { COURSE_EN } from '../learn/content/en';
import { COURSE_FR } from '../learn/content/fr';
import { LearnPanel } from '../learn/LearnPanel';
import { useLearnProgressStore } from '../learn/useLearnProgressStore';

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

// Without an i18n instance the UI language is undefined: English content.
const course = COURSE_EN;

describe('course content', () => {
  it('has the same structure in French and English', () => {
    const shape = (c: typeof COURSE_FR) => ({
      lessons: c.lessons.map((l) => [l.id, l.slides.length]),
      quiz: c.quiz.map((q) => [
        q.id,
        q.lessonId,
        q.type,
        q.correctIndex,
        q.correctAnswer,
        q.options?.length,
      ]),
      flashcards: c.flashcards.map((f) => [f.id, f.lessonId]),
    });
    expect(shape(COURSE_EN)).toEqual(shape(COURSE_FR));
  });

  it('has valid answers for every question', () => {
    for (const question of COURSE_FR.quiz) {
      if (question.type === 'mcq') {
        expect(question.options?.[question.correctIndex ?? -1]).toBeDefined();
      } else {
        expect(typeof question.correctAnswer).toBe('boolean');
      }
    }
  });
});

describe('<LearnPanel />', () => {
  beforeEach(() => useLearnProgressStore.getState().reset());

  it('walks through a lesson and marks it completed at the end', () => {
    const lesson = course.lessons[0];
    render(<LearnPanel />);

    fireEvent.click(
      screen.getByRole('button', { name: new RegExp(lesson.title) }),
    );
    expect(
      screen.getByRole('heading', { name: lesson.slides[0].title }),
    ).toBeInTheDocument();

    for (let index = 1; index < lesson.slides.length; index++) {
      fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    }
    expect(useLearnProgressStore.getState().completedLessons).toEqual([
      lesson.id,
    ]);
  });

  it('scores the lesson quiz and keeps the best score', () => {
    const lesson = course.lessons[0];
    const questions = course.quiz.filter((q) => q.lessonId === lesson.id);
    render(<LearnPanel />);

    fireEvent.click(
      screen.getByRole('button', { name: new RegExp(lesson.title) }),
    );
    for (let index = 1; index < lesson.slides.length; index++) {
      fireEvent.click(screen.getByRole('button', { name: /Next/ }));
    }
    fireEvent.click(screen.getByRole('button', { name: /^Quiz$/ }));

    // Answer every question right.
    questions.forEach((question, index) => {
      const list = screen.getByRole('list');
      const label =
        question.type === 'mcq'
          ? question.options![question.correctIndex!]
          : question.correctAnswer
            ? 'True'
            : 'False';
      // Each option starts with its letter (A, B…).
      const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      fireEvent.click(
        within(list).getByRole('button', { name: new RegExp(`${escaped}$`) }),
      );
      expect(screen.getByText('Right answer!')).toBeInTheDocument();
      fireEvent.click(
        screen.getByRole('button', {
          name:
            index === questions.length - 1 ? /See my score/ : /Next question/,
        }),
      );
    });

    expect(useLearnProgressStore.getState().bestQuizScores[lesson.id]).toBe(
      100,
    );
  });

  it('records review cards the user knew', () => {
    render(<LearnPanel />);

    fireEvent.click(screen.getByRole('tab', { name: /Cards/ }));
    fireEvent.click(screen.getByRole('button', { name: /Show the answer/ }));
    fireEvent.click(screen.getByRole('button', { name: /I knew it/ }));

    expect(useLearnProgressStore.getState().knownCards).toEqual([
      course.flashcards[0].id,
    ]);
  });
});
