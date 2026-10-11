import { act, fireEvent, render, screen } from '@testing-library/react';

import { CoachPanel } from '../components/CoachPanel';
import { useCoachTipsStore } from '../stores/useCoachTipsStore';
import { useMainConversationStore } from '../stores/useMainConversationStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));
// The fact check runs on each answer: answered here, without the network.
const mockCheckAnswerFacts = vi.fn().mockResolvedValue([]);
vi.mock('../coach/coachApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../coach/coachApi')>()),
  checkAnswerFacts: (...args: unknown[]) =>
    mockCheckAnswerFacts(...args) as Promise<string[]>,
}));
vi.mock('@/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils')>()),
  useConversationRouteId: () => undefined,
}));

const completion = (content: object) =>
  new Response(
    JSON.stringify({
      choices: [{ message: { content: JSON.stringify(content) } }],
    }),
  );

const TURNS = [
  { role: 'user' as const, text: 'Prépare une note sur le budget.' },
  { role: 'assistant' as const, text: 'Voici une première trame de note.' },
];

describe('the coach after an answer', () => {
  const sendQuestion = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    usePromptToolkitStore.setState({ chatInput: '' });
    useMainConversationStore.setState({
      turns: TURNS,
      latestCompletedAssistantMessageId: 'assistant-1',
      isAssistantResponding: false,
      sendQuestion,
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('asks whether it suits, and prepares a correction without the model', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<CoachPanel />);

    expect(
      screen.getByText('The Assistant has answered. Does it suit you?'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Too long' }));

    expect(screen.getByText('Correction ready')).toBeInTheDocument();
    const correction =
      'Keep the same information, but in half the text: short sentences, one idea per line.';
    expect(screen.getByText(correction)).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
    // Nothing leaves without a click.
    expect(sendQuestion).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole('button', { name: 'Send to the Assistant' }),
    );
    expect(sendQuestion).toHaveBeenCalledWith(correction);
    expect(
      screen.getByText('Sent. I will be here when the answer arrives.'),
    ).toBeInTheDocument();
  });

  it('lets the user edit or cancel a correction', () => {
    render(<CoachPanel />);
    fireEvent.click(
      screen.getByRole('button', { name: 'The tone does not suit' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Warmer' }));

    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Your correction' }), {
      target: { value: 'Sois plus chaleureux, et tutoie.' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Send to the Assistant' }),
    );
    expect(sendQuestion).toHaveBeenCalledWith(
      'Sois plus chaleureux, et tutoie.',
    );
  });

  it('comes back to the question when a correction is cancelled', () => {
    render(<CoachPanel />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Not the right format' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'A table' }));
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(
      screen.getByRole('button', { name: 'Too long' }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Correction ready')).not.toBeInTheDocument();
  });

  it('adds what is missing, in the user’s words', () => {
    render(<CoachPanel />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Something is missing' }),
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'What is missing' }), {
      target: { value: 'le montant total' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    // Without an i18n instance, `t` returns keys without interpolation.
    expect(
      screen.getByText(
        'Add this to your answer: {{what}}. Keep the rest as it is.',
      ),
    ).toBeInTheDocument();
    expect(screen.getByText('le montant total')).toBeInTheDocument();
  });

  it('rewrites the request when the answer is not what was wanted', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        completion({
          prompt: 'Rédige la note elle-même, en une page.',
          why: 'Vous attendiez la note, pas une trame.',
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    render(<CoachPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Not what I wanted' }));
    fireEvent.change(
      screen.getByRole('textbox', { name: 'What you expected' }),
      {
        target: { value: 'La note complète' },
      },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Continue' }));

    expect(
      await screen.findByText('Rédige la note elle-même, en une page.'),
    ).toBeInTheDocument();
    const body = (
      fetchMock.mock.calls[0] as unknown as [string, RequestInit]
    )[1].body as string;
    expect(body).toContain('Prépare une note sur le budget.');
    expect(body).toContain('La note complète');
  });

  it('says what to check when the user doubts the answer', () => {
    render(<CoachPanel />);
    fireEvent.click(
      screen.getByRole('button', { name: 'I am not sure it is accurate' }),
    );
    expect(
      screen.getByText(/I do not check the substance/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/For each point of your answer, say whether it comes/),
    ).toBeInTheDocument();
  });

  it('suggests two next questions on request; a click sends one', async () => {
    const fetchMock = vi.fn(() =>
      Promise.resolve(
        completion({
          questions: [
            'Peux-tu détailler la première partie ?',
            'Quels risques ?',
          ],
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    render(<CoachPanel />);
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.click(
      screen.getByRole('button', { name: 'Suggest a next step' }),
    );
    const question = await screen.findByRole('button', {
      name: 'Peux-tu détailler la première partie ?',
    });
    fireEvent.click(question);
    expect(sendQuestion).toHaveBeenCalledWith(
      'Peux-tu détailler la première partie ?',
    );
  });

  it('gives Nestor’s view in the panel, then talks about it', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        completion({ message: 'La trame est claire ; précisez le public.' }),
      )
      .mockResolvedValueOnce(
        completion({ message: 'La direction, par exemple.' }),
      );
    vi.stubGlobal('fetch', fetchMock);
    render(<CoachPanel />);

    fireEvent.click(
      screen.getByRole('button', { name: 'Nestor’s view on this exchange' }),
    );
    expect(
      await screen.findByText('La trame est claire ; précisez le public.'),
    ).toBeInTheDocument();

    fireEvent.change(
      screen.getByRole('textbox', {
        name: 'A question for Nestor about this exchange',
      }),
      { target: { value: 'Quel public ?' } },
    );
    fireEvent.click(screen.getByRole('button', { name: 'Send' }));
    expect(
      await screen.findByText('La direction, par exemple.'),
    ).toBeInTheDocument();
    // The conversation in the centre is never written to.
    expect(sendQuestion).not.toHaveBeenCalled();
  });

  it('waits for the assistant to finish, without calling the model', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    useMainConversationStore.setState({
      latestCompletedAssistantMessageId: null,
      isAssistantResponding: true,
    });
    render(<CoachPanel />);

    expect(
      screen.getByText(
        'The Assistant is writing its answer… Then I will ask you whether it suits you.',
      ),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('starts over on a new answer, with a tip after a correction', () => {
    useCoachTipsStore.setState({ shown: {} });
    render(<CoachPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Hard to understand' }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Send to the Assistant' }),
    );

    // The Assistant answers the correction.
    act(() =>
      useMainConversationStore.setState({
        isAssistantResponding: true,
        latestCompletedAssistantMessageId: null,
      }),
    );
    act(() =>
      useMainConversationStore.setState({
        isAssistantResponding: false,
        latestCompletedAssistantMessageId: 'assistant-2',
        turns: [...TURNS, { role: 'assistant', text: 'Plus simple.' }],
      }),
    );

    expect(screen.getByText('To remember')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Too long' }),
    ).toBeInTheDocument();
  });

  it('offers to redo the request itself, with the coach', () => {
    const setChatInput = vi.fn();
    usePromptToolkitStore.setState({ chatInput: '', setChatInput });
    vi.stubGlobal('fetch', vi.fn());
    render(<CoachPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Too long' }));
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Or redo my request, with the coach',
      }),
    );
    expect(setChatInput).toHaveBeenCalledWith(
      'Prépare une note sur le budget.',
    );
  });
});

describe('the facts of an answer', () => {
  beforeEach(() => {
    usePromptToolkitStore.setState({ chatInput: '' });
    useMainConversationStore.setState({
      turns: TURNS,
      latestCompletedAssistantMessageId: 'assistant-1',
      isAssistantResponding: false,
      sendQuestion: vi.fn(),
    });
  });

  it('says the answer is not ready, and opens the workshop', async () => {
    mockCheckAnswerFacts.mockResolvedValueOnce([
      'La cause du retard : « afflux de demandes »',
    ]);
    vi.stubGlobal('fetch', vi.fn());
    render(<CoachPanel />);
    expect(
      await screen.findByText('This answer is not ready to be sent yet'),
    ).toBeInTheDocument();
    expect(mockCheckAnswerFacts).toHaveBeenCalledWith(
      'Prépare une note sur le budget.',
      'Voici une première trame de note.',
      expect.any(String),
      expect.any(AbortSignal),
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'Make it ready with Nestor' }),
    );
    expect(
      screen.getByText('La cause du retard : « afflux de demandes »'),
    ).toBeInTheDocument();
    // The workshop says itself what is left: the warning goes.
    expect(
      screen.queryByText('This answer is not ready to be sent yet'),
    ).not.toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});

describe('an answer asked from a tool', () => {
  it('opens the workshop by itself', async () => {
    mockCheckAnswerFacts.mockResolvedValueOnce(['Un délai : « 15 jours »']);
    vi.stubGlobal('fetch', vi.fn());
    usePromptToolkitStore.setState({ chatInput: '', finishNextAnswer: false });
    useMainConversationStore.setState({
      turns: TURNS,
      latestCompletedAssistantMessageId: 'assistant-1',
      isAssistantResponding: false,
    });
    render(<CoachPanel />);
    act(() => {
      usePromptToolkitStore.setState({ finishNextAnswer: true });
    });
    expect(
      await screen.findByText('{{count}} points to settle before sending'),
    ).toBeInTheDocument();
    vi.unstubAllGlobals();
  });
});

describe('gaps left in an answer', () => {
  it('lists the brackets and counts the places to complete', async () => {
    const { answerGaps } = await import('../components/CoachAnswer');
    expect(
      answerGaps(
        'Nous ne pouvons pas donner de date À COMPLÉTER.\nCordialement,\n[Votre nom] [Votre service]',
      ),
    ).toEqual({ brackets: ['[Votre nom]', '[Votre service]'], marks: 1 });
    expect(answerGaps('Bonjour, voici la réponse.')).toEqual({
      brackets: [],
      marks: 0,
    });
  });
});
