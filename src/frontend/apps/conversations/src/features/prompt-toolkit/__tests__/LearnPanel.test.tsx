import { fireEvent, render, screen, within } from '@testing-library/react';

import { useAiAvailability } from '../coach/aiAvailability';
import { LearnPanel } from '../learn/LearnPanel';
import { COURSE_EN } from '../learn/content/en';
import { COURSE_FR } from '../learn/content/fr';
import { useLearnProgressStore } from '../learn/useLearnProgressStore';
import { useCoachHistoryStore } from '../stores/useCoachHistoryStore';

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

// Without an i18n instance the UI language is undefined: English content.
const course = COURSE_EN;

describe('course content', () => {
  it('has the same structure in French and English', () => {
    const shape = (c: typeof COURSE_FR) => ({
      lessons: c.lessons.map((l) => [
        l.id,
        l.skills,
        l.slides.map((s) => [
          s.kind,
          s.skill,
          s.choices?.length,
          s.better,
          s.reasons?.map((r) => r.isRight),
          s.parts?.map((p) => p.label !== undefined),
          s.blank,
          s.options?.length,
          Boolean(s.example),
          Boolean(s.keyTakeaway),
        ]),
      ]),
      quiz: c.quiz.map((q) => [
        q.id,
        q.lessonId,
        q.type,
        q.correctIndex,
        q.correctAnswer,
        q.options?.length,
        q.pieces?.length,
        q.items?.map((i) => i.helps),
        Boolean(q.hint),
        q.placement,
        Boolean(q.prompt),
      ]),
      flashcards: c.flashcards.map((f) => [f.id, f.lessonId]),
    });
    expect(shape(COURSE_EN)).toEqual(shape(COURSE_FR));
  });

  it.each([
    ['fr', COURSE_FR],
    ['en', COURSE_EN],
  ])('has valid answers and screens (%s)', (_, content) => {
    for (const question of content.quiz) {
      const isValid =
        question.type === 'true-false'
          ? typeof question.correctAnswer === 'boolean'
          : question.type === 'order'
            ? (question.pieces?.length ?? 0) >= 2
            : question.type === 'sort'
              ? (question.items?.length ?? 0) >= 2
              : question.options?.[question.correctIndex ?? -1] !== undefined;
      expect(isValid).toBe(true);
    }
    // A hint never gives the answer away.
    const giveaways = content.quiz.filter(
      (q) =>
        q.hint &&
        q.options &&
        q.correctIndex !== undefined &&
        q.hint.includes(q.options[q.correctIndex]),
    );
    expect(giveaways).toEqual([]);

    const slides = content.lessons.flatMap((lesson) => lesson.slides);
    const brokenChoices = slides.filter(
      (slide) =>
        slide.kind === 'choose' &&
        (!slide.choices?.[slide.better ?? -1] ||
          !slide.reasons?.some((r) => r.isRight)),
    );
    expect(brokenChoices).toEqual([]);
    const brokenFills = slides.filter((slide) => {
      if (slide.kind !== 'fill') {
        return false;
      }
      const hidden = slide.parts?.[slide.blank ?? -1];
      return !hidden?.label || !slide.options?.includes(hidden.text);
    });
    expect(brokenFills).toEqual([]);
    // Short screens: 60 words at most.
    const longScreens = slides.filter(
      (slide) => slide.content.split(/\s+/).length > 60,
    );
    expect(longScreens).toEqual([]);
    // One question per lesson for the level test.
    expect(content.quiz.filter((q) => q.placement)).toHaveLength(
      content.lessons.length,
    );
  });
});

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** Answers every question of the quiz on screen right. */
const answerQuizRight = (questions: typeof course.quiz) => {
  questions.forEach((question, index) => {
    // The answers are the last list on screen, after the bar of the step.
    const list = screen.getAllByRole('list').at(-1)!;
    const label =
      question.type === 'true-false'
        ? question.correctAnswer
          ? 'True'
          : 'False'
        : question.options![question.correctIndex!];
    fireEvent.click(
      within(list).getByRole('button', {
        name: new RegExp(`${escape(label)}$`),
      }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Check my answer' }));
    expect(screen.getByRole('status')).toHaveTextContent(question.explanation);
    fireEvent.click(
      screen.getByRole('button', {
        name: index === questions.length - 1 ? /See my score/ : /Next question/,
      }),
    );
  });
};

/** Does the exercise of a "which works better?" screen: the main button asks for it. */
const doChoose = (slide: (typeof course.lessons)[number]['slides'][number]) => {
  if (slide.kind !== 'choose') {
    return;
  }
  const better = slide.choices![slide.better ?? 0];
  fireEvent.click(
    screen.getByRole('button', { name: new RegExp(escape(better.prompt)) }),
  );
  const reason = slide.reasons?.find((item) => item.isRight);
  if (reason) {
    fireEvent.click(screen.getByRole('button', { name: reason.label }));
    fireEvent.click(screen.getByRole('button', { name: 'Check my answer' }));
  }
};

describe('<LearnPanel />', () => {
  beforeEach(() => {
    useLearnProgressStore.getState().reset();
    useCoachHistoryStore.setState({ entries: [] });
    // Without the coach: no practice time, to walk the other times.
    useAiAvailability.setState({ status: 'unavailable' });
  });
  afterEach(() => useAiAvailability.setState({ status: 'available' }));

  it('shows the lesson to do now and one button, the rest one click away', () => {
    render(<LearnPanel />);

    expect(screen.queryByRole('tab')).not.toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: course.lessons[0].title }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Start' })).toBeInTheDocument();
    // No list of steps on the first screen.
    expect(screen.queryByRole('list')).not.toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'See the whole course' }),
    );
    const steps = screen.getByRole('list', {
      name: 'The steps of the course',
    });
    expect(within(steps).getAllByRole('listitem')).toHaveLength(
      course.lessons.length,
    );
  });

  // A whole step, screen by screen: longer than most tests.
  it('walks a step in order: read, remember, check', () => {
    const lesson = course.lessons[0];
    const cards = course.flashcards.filter((c) => c.lessonId === lesson.id);
    const questions = course.quiz.filter((q) => q.lessonId === lesson.id);
    render(<LearnPanel />);

    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    // Read.
    expect(
      screen.getByRole('heading', { name: lesson.slides[0].title }),
    ).toBeInTheDocument();
    lesson.slides.forEach((slide, index) => {
      // A screen with an exercise: its "Check" first, at the main button's place.
      doChoose(slide);
      if (index < lesson.slides.length - 1) {
        fireEvent.click(screen.getByRole('button', { name: /^Next$/ }));
      }
    });
    fireEvent.click(screen.getByRole('button', { name: /Continue/ }));
    expect(useLearnProgressStore.getState().completedLessons).toEqual([
      lesson.id,
    ]);
    // No pause between two times: the next one follows at once.
    expect(screen.queryByText('Reading done')).not.toBeInTheDocument();

    // Remember: each card once.
    cards.forEach(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Show the answer' }));
      fireEvent.click(screen.getByRole('button', { name: /I knew it/ }));
    });
    expect(useLearnProgressStore.getState().knownCards).toEqual(
      cards.map((c) => c.id),
    );

    // Check, then the end of the step.
    answerQuizRight(questions);
    fireEvent.click(screen.getByRole('button', { name: 'Finish the step' }));
    expect(useLearnProgressStore.getState().bestQuizScores[lesson.id]).toBe(
      100,
    );
    expect(
      screen.getByRole('heading', { name: 'Step {{number}} completed' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Next step: {{number}} · {{title}}' }),
    ).toBeInTheDocument();
    expect(useLearnProgressStore.getState().currentStep).toBeNull();
  }, 20000);

  it('lets the user pass a time they already know', () => {
    render(<LearnPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'I already know: go to {{stage}}' }),
    );

    expect(useLearnProgressStore.getState().doneStages['lesson-1']).toEqual([
      'read',
    ]);
    expect(
      screen.getByRole('button', { name: 'Show the answer' }),
    ).toBeInTheDocument();
  });

  it('stops here and keeps the place for later', () => {
    render(<LearnPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    doChoose(course.lessons[0].slides[0]);
    fireEvent.click(screen.getByRole('button', { name: /^Next$/ }));
    // The way out stays on the top left, whatever the screen.
    expect(
      screen.getByRole('button', { name: 'Stop here, resume later' }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Stop here, resume later' }),
    );

    expect(useLearnProgressStore.getState().sessions).toHaveLength(1);
    expect(screen.getByText('To resume')).toBeInTheDocument();
  });

  it('resumes the step in progress from the path', () => {
    useLearnProgressStore.setState({
      completedLessons: ['lesson-1'],
      currentStep: 'lesson-3',
      slidePositions: { 'lesson-3': 2 },
    });
    render(<LearnPanel />);

    expect(screen.getByText('To resume')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    expect(
      screen.getByRole('heading', { name: course.lessons[2].slides[2].title }),
    ).toBeInTheDocument();
  });

  it('brings back the cards seen in a step, to review', () => {
    const cards = course.flashcards.filter((c) => c.lessonId === 'lesson-1');
    useLearnProgressStore.setState({
      completedLessons: ['lesson-1'],
      doneStages: { 'lesson-1': ['read', 'cards'] },
    });
    render(<LearnPanel />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Review {{count}} items' }),
    );
    cards.forEach(() => {
      fireEvent.click(screen.getByRole('button', { name: 'Show the answer' }));
      fireEvent.click(screen.getByRole('button', { name: /I knew it/ }));
    });

    expect(screen.getByText('Review done')).toBeInTheDocument();
    expect(useLearnProgressStore.getState().knownCards).toEqual(
      cards.map((c) => c.id),
    );
  });

  it('practises with the coach: a challenge, graded by it', () => {
    useAiAvailability.setState({ status: 'available' });
    render(<LearnPanel />);

    fireEvent.click(
      screen.getByRole('button', { name: 'See the whole course' }),
    );
    fireEvent.click(
      screen.getByRole('button', { name: new RegExp(course.lessons[1].title) }),
    );
    fireEvent.click(screen.getByRole('button', { name: /Practise/ }));

    expect(
      screen.getByRole('heading', { name: 'Your turn: fix this request' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Have it graded/ }),
    ).toBeInTheDocument();
  });

  it('shows the skills from the course before the coach read a request', () => {
    useAiAvailability.setState({ status: 'available' });
    useLearnProgressStore.setState({ completedLessons: ['lesson-1'] });
    render(<LearnPanel />);
    fireEvent.click(
      screen.getByRole('button', { name: 'See the whole course' }),
    );

    // Folded until opened.
    expect(screen.queryByText('Discovered')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'My skills' }));
    expect(
      screen.getByText(
        'From the course. Once the coach reads your requests, it adds what it sees.',
      ),
    ).toBeInTheDocument();
  });

  it('adds what the coach saw in real requests, with the step to learn it', () => {
    useAiAvailability.setState({ status: 'available' });
    const grades = {
      task: 80,
      context: 70,
      sources: 0,
      format: 20,
      audience: 70,
      examples: 0,
      constraints: 50,
      verification: 0,
    };
    useCoachHistoryStore.setState({
      entries: [
        { excerpt: 'Résume…', score: 60, competencies: grades, sentAt: 1 },
        {
          excerpt: 'Rédige…',
          score: 50,
          competencies: { ...grades, format: 70, audience: 20 },
          sentAt: 2,
        },
      ],
    });
    render(<LearnPanel />);
    fireEvent.click(
      screen.getByRole('button', { name: 'See the whole course' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'My skills' }));

    // Seen at least once: discovered; never seen nor learnt: to discover.
    expect(screen.getAllByText('Discovered')).toHaveLength(4);
    expect(screen.getAllByText('To discover')).toHaveLength(4);

    // "Ask for things to be checked" is taught in step 5.
    const links = screen.getAllByRole('button', {
      name: 'See step {{number}}',
    });
    fireEvent.click(links[links.length - 1]);
    expect(
      screen.getByRole('heading', { name: 'Step {{number}} · {{title}}' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('heading', { name: course.lessons[4].slides[1].title }),
    ).toBeInTheDocument();
  });

  it('keeps a level reached, even when the requests slip', () => {
    useLearnProgressStore.setState({ skillLevels: { task: 3 } });
    render(<LearnPanel />);
    fireEvent.click(
      screen.getByRole('button', { name: 'See the whole course' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'My skills' }));
    expect(screen.getByText('Mastered')).toBeInTheDocument();
  });

  it('puts the review first when enough is due and no step is under way', () => {
    const done = ['read', 'cards', 'quiz'] as const;
    useLearnProgressStore.setState({
      doneStages: Object.fromEntries(
        ['lesson-1', 'lesson-2', 'lesson-3'].map((id) => [id, [...done]]),
      ),
    });
    render(<LearnPanel />);
    expect(
      screen.getByRole('heading', { name: 'Your review' }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Review' })).toBeInTheDocument();
  });

  it('offers a checkpoint once its steps are done', () => {
    const steps = ['lesson-1', 'lesson-2', 'lesson-3'];
    const stages = ['read', 'cards', 'quiz'] as const;
    useLearnProgressStore.setState({
      doneStages: Object.fromEntries(steps.map((id) => [id, [...stages]])),
      knownCards: course.flashcards.map((card) => card.id),
      cardSchedule: Object.fromEntries(
        course.flashcards.map((card) => [
          card.id,
          { box: 2, due: Date.now() + 1e9 },
        ]),
      ),
    });
    render(<LearnPanel />);
    expect(
      screen.getByRole('heading', { name: 'Check what stuck' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Start' }));
    expect(
      screen.getByText('Question {{current}} of {{total}}'),
    ).toBeInTheDocument();
  });

  it('offers the level test on a first visit only', () => {
    render(<LearnPanel />);
    fireEvent.click(
      screen.getByRole('button', {
        name: 'I have already used an AI: test my level',
      }),
    );
    expect(
      screen.getByRole('heading', { name: 'Test my level' }),
    ).toBeInTheDocument();
  });
});
