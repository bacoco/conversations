import { act, fireEvent, render, screen } from '@testing-library/react';

import { CoachPanel } from '../components/CoachPanel';
import { useMainConversationStore } from '../stores/useMainConversationStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
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
    { status: 200 },
  );

describe('the coach after an answer', () => {
  const setChatInput = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    usePromptToolkitStore.setState({
      chatInput: '',
      setChatInput,
      coachMode: 'instant',
    });
    useMainConversationStore.setState({
      turns: [
        { role: 'user', text: 'Rédige un courriel pour la réunion.' },
        { role: 'assistant', text: 'Voici le courriel.' },
      ],
      latestCompletedAssistantMessageId: 'answer-1',
      isAssistantResponding: false,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('prepares two next questions by itself; a click puts one in the field', async () => {
    const fetchMock = vi.fn((_url: string, init?: RequestInit) =>
      Promise.resolve(
        (init?.body as string).includes('next questions')
          ? completion({
              questions: ['Ajoute l’ordre du jour.', 'Fais plus court.'],
            })
          : new Response('{}', { status: 500 }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    render(<CoachPanel />);

    // Prepared without a click, while "as you type" stays shown.
    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1));
    fireEvent.click(screen.getByRole('button', { name: 'Next questions' }));
    fireEvent.click(
      await screen.findByRole('button', { name: /Ajoute l’ordre du jour/ }),
    );
    expect(setChatInput).toHaveBeenCalledWith('Ajoute l’ordre du jour.');
  });

  it('gives Nestor’s view in the panel when asked, with nothing to type', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, init?: RequestInit) =>
        Promise.resolve(
          (init?.body as string).includes('coaching note')
            ? completion({ message: 'Précisez le public visé.' })
            : completion({ questions: [] }),
        ),
      ),
    );
    render(<CoachPanel />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Nestor’s view on this exchange' }),
    );
    expect(
      await screen.findByText('Précisez le public visé.'),
    ).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('names the parts the answer leaves to complete, and reads a new answer by itself', async () => {
    const fetchMock = vi.fn((_url: string, init?: RequestInit) =>
      Promise.resolve(
        (init?.body as string).includes('coaching note')
          ? completion({ message: 'Donnez la date et la salle.' })
          : completion({ questions: [] }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    usePromptToolkitStore.setState({ coachMode: 'advice' });
    render(<CoachPanel />);
    expect(
      await screen.findByText('Donnez la date et la salle.'),
    ).toBeInTheDocument();

    // A new answer, with gaps, while "Advice" is shown: read at once.
    await act(async () => {
      useMainConversationStore.setState({
        turns: [
          { role: 'user', text: 'Annonce la réunion.' },
          { role: 'assistant', text: 'Réunion le [date] en salle [salle].' },
        ],
        latestCompletedAssistantMessageId: 'answer-2',
      });
      await Promise.resolve();
    });
    expect(await screen.findByText('[date] · [salle]')).toBeInTheDocument();
    await vi.waitFor(() => {
      const advice = fetchMock.mock.calls
        .map(([, init]) => (init?.body as string) ?? '')
        .filter((body) => body.includes('coaching note'));
      expect(advice).toHaveLength(2);
      expect(advice[1]).toContain('[date], [salle]');
    });
  });
});
