import { act, fireEvent, render, screen } from '@testing-library/react';

import { CoachPanel } from '../components/CoachPanel';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));
vi.mock('@/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils')>()),
  useConversationRouteId: () => undefined,
}));

/** Embeddings stand-in: texts about minutes are close to each other. */
const embeddingsResponse = (body: string) => {
  const { input } = JSON.parse(body) as { input: string[] };
  return new Response(
    JSON.stringify({
      data: input.map((text, index) => ({
        index,
        embedding: text.includes('minutes') ? [1, 0] : [0, 1],
      })),
    }),
  );
};

describe('coach modes', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    usePromptToolkitStore.setState({ chatInput: '', coachMode: 'manual' });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('switches mode from the selector shown at the top', () => {
    render(<CoachPanel />);
    fireEvent.click(screen.getByRole('radio', { name: /As you type/ }));
    expect(usePromptToolkitStore.getState().coachMode).toBe('instant');
  });

  it('offers the closest ready-made requests by meaning as you type', async () => {
    const fetchMock = vi.fn((url: string, init: RequestInit) =>
      Promise.resolve(embeddingsResponse(init.body as string)),
    );
    vi.stubGlobal('fetch', fetchMock);
    const setChatInput = vi.fn();
    usePromptToolkitStore.setState({
      coachMode: 'instant',
      chatInput: 'Write the minutes of this morning meeting',
      setChatInput,
    });

    render(<CoachPanel />);
    await act(() => vi.advanceTimersByTimeAsync(700));

    const request = await screen.findByRole('button', {
      name: /Write the minutes of this meeting/,
    });
    // Only embeddings: no chat model is called while typing.
    fetchMock.mock.calls.forEach(([url]) =>
      expect(String(url).endsWith('embeddings')).toBe(true),
    );
    fireEvent.click(request);
    expect(setChatInput).toHaveBeenCalledWith(
      'Write the minutes of this meeting',
    );
  });

  it('writes versions and finds library prompts on request', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string, init: RequestInit) =>
        String(url).endsWith('embeddings')
          ? Promise.resolve(embeddingsResponse(init.body as string))
          : Promise.resolve(
              new Response(
                JSON.stringify({
                  choices: [
                    {
                      message: {
                        content: JSON.stringify({
                          prompts: [
                            {
                              title: 'Version courte',
                              prompt: 'Rédige le CR.',
                              why: 'Rapide.',
                            },
                          ],
                        }),
                      },
                    },
                  ],
                }),
              ),
            ),
      ),
    );
    usePromptToolkitStore.setState({
      coachMode: 'assist',
      chatInput: 'Write the minutes of this morning meeting',
    });

    render(<CoachPanel />);
    await act(async () => {
      fireEvent.click(
        screen.getByRole('button', { name: 'Help me with this prompt' }),
      );
    });

    expect(await screen.findByText('Version courte')).toBeInTheDocument();
    expect(screen.getAllByText('Meeting minutes').length).toBeGreaterThan(0);
  });
});

describe('embedding batches', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('sends the library to Albert in batches of 64 texts at most', async () => {
    const { searchPhrases } = await import('../library/embeddingSearch');
    const fetchMock = vi.fn((url: string, init: RequestInit) =>
      Promise.resolve(embeddingsResponse(init.body as string)),
    );
    vi.stubGlobal('fetch', fetchMock);
    await searchPhrases('minutes', 'fr');
    fetchMock.mock.calls.forEach(([, init]) => {
      const { input } = JSON.parse(String(init.body)) as { input: string[] };
      expect(input.length).toBeLessThanOrEqual(64);
    });
    expect(fetchMock.mock.calls.length).toBeGreaterThan(2);
  });
});
