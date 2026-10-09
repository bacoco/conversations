import { act, fireEvent, render, screen } from '@testing-library/react';

import { CoachPanel } from '../components/CoachPanel';
import { useCoachHistoryStore } from '../stores/useCoachHistoryStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

// No conversation open: the follow-up card stays out of the way.
vi.mock('@/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils')>()),
  useConversationRouteId: () => undefined,
}));

const mockShowToast = vi.fn();
vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

const completion = (content: object) =>
  new Response(
    JSON.stringify({
      choices: [{ message: { content: JSON.stringify(content) } }],
    }),
    { status: 200 },
  );

const ANALYSIS = {
  score: 42,
  verdict: 'Précisez le public visé.',
  competencies: {
    task: 70,
    context: 20,
    format: 10,
    audience: 0,
    constraints: 30,
    verification: 0,
  },
  strengths: ['La tâche est claire.'],
  suggestions: ['Indiquez à qui s’adresse la réponse.'],
};

const analyse = () =>
  fireEvent.click(screen.getByRole('button', { name: /Analyse my prompt/ }));

describe('<CoachPanel />', () => {
  const setChatInput = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
    usePromptToolkitStore.setState({
      chatInput: '',
      setChatInput,
      coachMode: 'manual',
    });
    useCoachHistoryStore.setState({ entries: [] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('stays quiet while the input is empty', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<CoachPanel />);

    expect(
      screen.queryByRole('img', { name: /out of 100/ }),
    ).not.toBeInTheDocument();
    // Robin introduces himself and explains the steps, without any call.
    expect(
      screen.getByRole('heading', { name: /I am Robin/ }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('warns about personal data without calling the model', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    usePromptToolkitStore.setState({ chatInput: 'mail à a.b@c.fr' });

    render(<CoachPanel />);

    // Without an i18n instance, `t` returns keys without interpolation.
    expect(screen.getByRole('alert')).toHaveTextContent(
      'Your prompt seems to contain',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('grades the prompt on request and shows the suggestions', async () => {
    const fetchMock = vi.fn().mockResolvedValue(completion(ANALYSIS));
    vi.stubGlobal('fetch', fetchMock);
    usePromptToolkitStore.setState({
      chatInput: 'Résume le rapport annuel',
    });

    render(<CoachPanel />);
    analyse();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/albert/v1/chat/completions');
    expect(init.credentials).toBe('include');
    expect(String(init.body)).toContain('Résume le rapport annuel');

    expect(
      await screen.findByRole('img', { name: /out of 100/ }),
    ).toBeInTheDocument();
    expect(screen.getByText('Précisez le public visé.')).toBeInTheDocument();
    expect(
      screen.getByText('Indiquez à qui s’adresse la réponse.'),
    ).toBeInTheDocument();
  });

  it('rewrites the prompt and replaces the chat input', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(completion(ANALYSIS))
      .mockResolvedValueOnce(
        completion({
          improved_prompt: 'Résume le rapport annuel pour la direction.',
          changes: ['Ajout du public'],
        }),
      );
    vi.stubGlobal('fetch', fetchMock);
    usePromptToolkitStore.setState({
      chatInput: 'Résume le rapport annuel',
    });

    render(<CoachPanel />);
    analyse();
    await screen.findByRole('img', { name: /out of 100/ });

    fireEvent.click(
      screen.getByRole('button', { name: /Suggest a better version/ }),
    );

    expect(
      await screen.findByText('Résume le rapport annuel pour la direction.'),
    ).toBeInTheDocument();
    // The rewrite applies the coach's own advice.
    const [, init] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(String(init.body)).toContain('Apply this advice');

    fireEvent.click(screen.getByRole('button', { name: 'Replace my prompt' }));
    expect(setChatInput).toHaveBeenCalledWith(
      'Résume le rapport annuel pour la direction.',
    );
  });

  it('shows a reading state while the coach works', async () => {
    let resolve: (value: Response) => void = () => {};
    vi.stubGlobal(
      'fetch',
      vi.fn(() => new Promise<Response>((r) => (resolve = r))),
    );
    usePromptToolkitStore.setState({
      chatInput: 'Résume le rapport annuel',
    });

    render(<CoachPanel />);
    analyse();
    expect(
      screen.getByText('The coach is reading your prompt…'),
    ).toBeInTheDocument();

    await act(async () => resolve(completion(ANALYSIS)));
    expect(
      await screen.findByRole('img', { name: /out of 100/ }),
    ).toBeInTheDocument();
  });

  it('records the grade in the history when the prompt is sent', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(completion(ANALYSIS)));
    usePromptToolkitStore.setState({
      chatInput: 'Résume le rapport annuel',
    });

    render(<CoachPanel />);
    analyse();
    await screen.findByRole('img', { name: /out of 100/ });

    // Sending the message empties the chat input.
    act(() => usePromptToolkitStore.setState({ chatInput: '' }));

    expect(useCoachHistoryStore.getState().entries).toMatchObject([
      { excerpt: 'Résume le rapport annuel', score: 42 },
    ]);
  });

  it('waits for the button in on-demand mode', async () => {
    const fetchMock = vi.fn().mockResolvedValue(completion(ANALYSIS));
    vi.stubGlobal('fetch', fetchMock);
    usePromptToolkitStore.setState({
      coachMode: 'manual',
      chatInput: 'Résume le rapport annuel',
    });

    // The floating button lines up with the chat composer.
    render(
      <>
        <form>
          <textarea name="inputchat-textarea" />
        </form>
        <CoachPanel />
      </>,
    );
    await act(() => vi.advanceTimersByTimeAsync(6000));
    expect(fetchMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Analyse my prompt/ }));
    expect(
      await screen.findByRole('img', { name: /out of 100/ }),
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(1);
    // Up to date: the button is disabled until the prompt changes.
    expect(
      screen.getByRole('button', { name: /Analysis up to date/ }),
    ).toBeDisabled();

    // Editing the prompt makes the analysis stale, still without any call.
    act(() =>
      usePromptToolkitStore.setState({
        chatInput: 'Résume le rapport annuel pour la direction',
      }),
    );
    await act(() => vi.advanceTimersByTimeAsync(6000));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole('button', { name: /Update the analysis/ }),
    ).toBeEnabled();
  });

  it('offers a retry when the coach is unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{}', { status: 429 })),
    );
    usePromptToolkitStore.setState({
      chatInput: 'Résume le rapport annuel',
    });

    render(<CoachPanel />);
    analyse();

    expect(
      await screen.findByText('Too many requests: wait a minute, then retry.'),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
