import { fireEvent, render, screen, within } from '@testing-library/react';

import { useAiAvailability } from '../coach/aiAvailability';
import { QuizView } from '../learn/QuizView';
import type { QuizQuestion } from '../learn/types';
import { useLearnProgressStore } from '../learn/useLearnProgressStore';

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const mcq: QuizQuestion = {
  id: 'q-a',
  lessonId: 'lesson-1',
  type: 'mcq',
  question: 'Which one?',
  options: ['Wrong one', 'Right one'],
  correctIndex: 1,
  explanation: 'Because it is right.',
  hint: 'Think of the reader.',
};

const order: QuizQuestion = {
  id: 'q-b',
  lessonId: 'lesson-2',
  type: 'order',
  question: 'Put in order',
  pieces: ['First', 'Second', 'Third'],
  explanation: 'Task first.',
};

const sort: QuizQuestion = {
  id: 'q-c',
  lessonId: 'lesson-3',
  type: 'sort',
  question: 'Does it help?',
  items: [
    { text: 'The reader', helps: true },
    { text: 'Politeness', helps: false },
  ],
  explanation: 'The reader helps.',
};

const pick = (name: string) => {
  const list = screen.getAllByRole('list').at(-1)!;
  fireEvent.click(within(list).getByRole('button', { name: new RegExp(name) }));
};

describe('<QuizView />', () => {
  beforeEach(() => {
    useLearnProgressStore.getState().reset();
    useAiAvailability.setState({ status: 'unavailable' });
  });
  afterEach(() => useAiAvailability.setState({ status: 'available' }));

  it('checks only when asked, and brings a missed question back at the end', () => {
    render(
      <QuizView
        title="Quiz"
        scope="lesson-1"
        questions={[mcq]}
        onBack={vi.fn()}
      />,
    );
    const check = screen.getByRole('button', { name: 'Check my answer' });
    expect(check).toBeDisabled();

    pick('Wrong one');
    // Changing one's mind is allowed until checked.
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    fireEvent.click(check);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Because it is right.',
    );
    expect(
      screen.getByText('This question comes back at the end.'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Next question' }));

    expect(screen.getByText('A question to try again')).toBeInTheDocument();
    pick('Right one');
    fireEvent.click(screen.getByRole('button', { name: 'Check my answer' }));
    fireEvent.click(screen.getByRole('button', { name: 'See my score' }));

    // The score counts the first try; the question is kept for review.
    expect(useLearnProgressStore.getState().bestQuizScores['lesson-1']).toBe(0);
    expect(
      useLearnProgressStore.getState().questionsToReview['q-a'],
    ).toBeDefined();
  });

  it('keeps a right answer given without being sure for review', () => {
    render(<QuizView title="Quiz" questions={[mcq]} onBack={vi.fn()} />);
    pick('Right one');
    fireEvent.click(
      screen.getByRole('checkbox', { name: 'I am not sure of my answer' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Check my answer' }));
    expect(
      screen.getByText(
        'Right! It will still come back in a review, to be sure.',
      ),
    ).toBeInTheDocument();
    expect(
      useLearnProgressStore.getState().questionsToReview['q-a'],
    ).toBeDefined();
  });

  it('gives a hint on demand, and none when done without help', () => {
    const { unmount } = render(
      <QuizView title="Quiz" questions={[mcq]} onBack={vi.fn()} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'A hint' }));
    expect(screen.getByText('Think of the reader.')).toBeInTheDocument();
    unmount();

    render(
      <QuizView
        title="Quiz"
        questions={[mcq]}
        onBack={vi.fn()}
        showHints={false}
      />,
    );
    expect(
      screen.queryByRole('button', { name: 'A hint' }),
    ).not.toBeInTheDocument();
  });

  it('puts pieces in order, one tap each', () => {
    render(<QuizView title="Quiz" questions={[order]} onBack={vi.fn()} />);
    const check = screen.getByRole('button', { name: 'Check my answer' });
    fireEvent.click(screen.getByRole('button', { name: 'First' }));
    fireEvent.click(screen.getByRole('button', { name: 'Second' }));
    expect(check).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Third' }));
    fireEvent.click(check);
    expect(screen.getByRole('status')).toHaveTextContent('Task first.');
    expect(screen.queryByText('The right order')).not.toBeInTheDocument();
  });

  it('sorts what helps the AI and what does not', () => {
    render(<QuizView title="Quiz" questions={[sort]} onBack={vi.fn()} />);
    const reader = screen.getByRole('group', { name: 'The reader' });
    const politeness = screen.getByRole('group', { name: 'Politeness' });
    fireEvent.click(
      within(reader).getByRole('button', { name: 'Helps the AI' }),
    );
    fireEvent.click(
      within(politeness).getByRole('button', { name: 'Helps the AI' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Check my answer' }));
    expect(screen.getByText('It does not help.')).toBeInTheDocument();
  });

  it('points to the steps to go over again', () => {
    const onOpenLesson = vi.fn();
    render(
      <QuizView
        title="Quiz"
        questions={[mcq]}
        onBack={vi.fn()}
        retryMistakes={false}
        lessonLabel={() => 'Step 1 · Understand'}
        onOpenLesson={onOpenLesson}
      />,
    );
    pick('Wrong one');
    fireEvent.click(screen.getByRole('button', { name: 'Check my answer' }));
    fireEvent.click(screen.getByRole('button', { name: 'See my score' }));
    fireEvent.click(
      screen.getByRole('button', { name: /Step 1 · Understand/ }),
    );
    expect(onOpenLesson).toHaveBeenCalledWith('lesson-1');
  });
});
