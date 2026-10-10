import { act, fireEvent, render, screen } from '@testing-library/react';

import { CoachPanel } from '../components/CoachPanel';
import { useCoachHistoryStore } from '../stores/useCoachHistoryStore';
import { useCoachTipsStore } from '../stores/useCoachTipsStore';
import { useMainConversationStore } from '../stores/useMainConversationStore';
import { useProfileStore } from '../stores/useProfileStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

// No conversation open: the review has nothing to read.
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
  verdict: 'Vous savez ce que vous voulez ; dites maintenant pour qui.',
  competencies: {
    task: 70,
    context: 20,
    format: 10,
    audience: 0,
    constraints: 30,
    verification: 0,
    sources: 0,
    examples: 0,
  },
  strengths: ['Vous dites ce que vous voulez : un résumé.'],
  suggestions: ['Indiquez à qui s’adresse la réponse.'],
};

const QUESTION = {
  message: 'Pour qui est ce résumé ?',
  suggestions: ['La direction', 'Mon équipe', 'Pour moi'],
};

const FINAL = {
  final_prompt: 'Résume le rapport annuel pour la direction.',
  message: 'Bien vu, la direction !',
};

/** Albert stand-in: answers each kind of call by what its body asks. */
const albert = (answer: (body: string) => object | undefined) =>
  vi.fn((_url: string, init?: RequestInit) => {
    const content = answer((init?.body as string | undefined) ?? '');
    return Promise.resolve(
      content ? completion(content) : new Response('{}', { status: 500 }),
    );
  });

const isAnalysis = (body: string) => body.includes('competencies');
const isQuestions = (body: string) => body.includes('<draft>');

/** Analysis, then the guided questions: one question, then the request. */
const readingAlbert = (analysis: object = ANALYSIS) => {
  let questions = 0;
  return albert((body) => {
    if (isAnalysis(body)) {
      return analysis;
    }
    if (isQuestions(body)) {
      questions += 1;
      return questions === 1 ? QUESTION : FINAL;
    }
    return undefined;
  });
};

const read = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Read my request' }));

describe('<CoachPanel />', () => {
  const setChatInput = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.clearAllMocks();
    usePromptToolkitStore.setState({ chatInput: '', setChatInput });
    useMainConversationStore.setState({
      turns: [],
      latestCompletedAssistantMessageId: null,
      isAssistantResponding: false,
      sendQuestion: null,
    });
    useProfileStore.setState({ isBeginner: false });
    useCoachHistoryStore.setState({ entries: [] });
    useCoachTipsStore.setState({ shown: {} });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('explains how it helps while nothing is written, without any call', () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    render(<CoachPanel />);

    expect(
      screen.getByRole('heading', { name: 'The coach' }),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(
      screen.getByRole('button', { name: 'Help me write my request' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Start from an example' }),
    ).toBeInTheDocument();
    // One screen: no tabs to choose a mode.
    expect(screen.queryByRole('radiogroup')).not.toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('opens the library to start from an example', () => {
    render(<CoachPanel />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Start from an example' }),
    );
    expect(usePromptToolkitStore.getState()).toMatchObject({
      mode: 'tools',
      toolRequest: 'library',
    });
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

  it('reads the request on demand: what works, then what is missing', async () => {
    const fetchMock = readingAlbert();
    vi.stubGlobal('fetch', fetchMock);
    usePromptToolkitStore.setState({ chatInput: 'Résume le rapport annuel' });

    render(<CoachPanel />);
    read();

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/albert/v1/chat/completions');
    expect(init.credentials).toBe('include');
    expect(init.body as string).toContain('Résume le rapport annuel');

    expect(await screen.findByText('What already works')).toBeInTheDocument();
    expect(
      screen.getByText('Vous dites ce que vous voulez : un résumé.'),
    ).toBeInTheDocument();
    expect(screen.getByText(ANALYSIS.verdict)).toBeInTheDocument();
    // Nestor asks for what is missing, with ready answers.
    expect(
      await screen.findByText('Pour qui est ce résumé ?'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'La direction' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Send it as is' }),
    ).toBeInTheDocument();
    // The grid and the advice stay folded under "More details".
    expect(
      screen.queryByRole('heading', { name: 'The 4 rules of a good prompt' }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'More details' }));
    expect(
      screen.getByRole('heading', { name: 'The 4 rules of a good prompt' }),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Indiquez à qui s’adresse la réponse.'),
    ).toBeInTheDocument();
  });

  it('completes the request with a ready answer and puts it in the message field', async () => {
    vi.stubGlobal('fetch', readingAlbert());
    usePromptToolkitStore.setState({ chatInput: 'Résume le rapport annuel' });

    render(<CoachPanel />);
    read();
    fireEvent.click(
      await screen.findByRole('button', { name: 'La direction' }),
    );

    expect(
      await screen.findByText('Your request is ready'),
    ).toBeInTheDocument();
    expect(screen.getByText(FINAL.final_prompt)).toBeInTheDocument();
    // One habit to remember, for the rule this request needed most.
    expect(screen.getByText('To remember')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Say who it is for: the tone and the level change with it.',
      ),
    ).toBeInTheDocument();
    // What Nestor added, next to the user's own words.
    fireEvent.click(screen.getByRole('button', { name: 'Show what changes' }));
    expect(screen.getByText('pour la direction.')).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Put in the message field' }),
    );
    expect(setChatInput).toHaveBeenCalledWith(FINAL.final_prompt);
    act(() => {
      usePromptToolkitStore.setState({ chatInput: FINAL.final_prompt });
    });
    expect(
      screen.getByText(
        'It is in the message field: read it again, then send it when you are ready.',
      ),
    ).toBeInTheDocument();
  });

  it('asks nothing more of a clear request, unless the user wants to', async () => {
    vi.stubGlobal('fetch', readingAlbert({ ...ANALYSIS, score: 88 }));
    usePromptToolkitStore.setState({ chatInput: 'Résume le rapport annuel' });

    render(<CoachPanel />);
    read();

    fireEvent.click(
      await screen.findByRole('button', { name: 'Strengthen it anyway' }),
    );
    expect(
      await screen.findByText('Pour qui est ce résumé ?'),
    ).toBeInTheDocument();
  });

  it('sends the request as it is, through the composer', async () => {
    vi.stubGlobal('fetch', readingAlbert({ ...ANALYSIS, score: 88 }));
    usePromptToolkitStore.setState({ chatInput: 'Résume le rapport annuel' });
    const onSubmit = vi.fn((event: { preventDefault: () => void }) =>
      event.preventDefault(),
    );

    render(
      <>
        <form onSubmit={onSubmit}>
          <textarea name="inputchat-textarea" />
        </form>
        <CoachPanel />
      </>,
    );
    read();
    fireEvent.click(
      await screen.findByRole('button', { name: 'Send it as is' }),
    );

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('rewrites the request from "More details"', async () => {
    const fetchMock = albert((body) =>
      body.includes('improved_prompt')
        ? {
            improved_prompt: 'Résume le rapport annuel pour la direction.',
            changes: ['Ajout du public'],
          }
        : undefined,
    );
    vi.stubGlobal('fetch', fetchMock);
    usePromptToolkitStore.setState({ chatInput: 'Résume le rapport annuel' });

    render(<CoachPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'More details' }));
    fireEvent.click(
      screen.getByRole('button', { name: /Suggest a better version/ }),
    );

    expect(
      await screen.findByText('Résume le rapport annuel pour la direction.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Ajout du public')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Put in the message field' }),
    );
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
    usePromptToolkitStore.setState({ chatInput: 'Résume le rapport annuel' });

    render(<CoachPanel />);
    read();
    expect(
      screen.getByText('Nestor is reading your request…'),
    ).toBeInTheDocument();

    act(() => {
      resolve(completion(QUESTION));
    });
    expect(
      await screen.findByText('Pour qui est ce résumé ?'),
    ).toBeInTheDocument();
  });

  it('records the grade in the history when the request is sent', async () => {
    vi.stubGlobal('fetch', readingAlbert());
    usePromptToolkitStore.setState({ chatInput: 'Résume le rapport annuel' });

    render(<CoachPanel />);
    read();
    await screen.findByText('What already works');

    // Sending the message empties the chat input.
    act(() => {
      usePromptToolkitStore.setState({ chatInput: '' });
    });

    expect(useCoachHistoryStore.getState().entries).toMatchObject([
      { excerpt: 'Résume le rapport annuel', score: 42 },
    ]);
  });

  it('reads only when asked, and says when the reading is out of date', async () => {
    const fetchMock = readingAlbert();
    vi.stubGlobal('fetch', fetchMock);
    usePromptToolkitStore.setState({ chatInput: 'Résume le rapport annuel' });

    render(
      <>
        <form>
          <textarea name="inputchat-textarea" />
        </form>
        <CoachPanel />
      </>,
    );
    await act(() => vi.advanceTimersByTimeAsync(6000));
    // Only the light check of the 4 rules runs while typing: no reading.
    const analyses = () =>
      fetchMock.mock.calls.filter(([, init]) =>
        isAnalysis(init?.body as string),
      );
    expect(analyses()).toHaveLength(0);

    read();
    await screen.findByText('What already works');
    expect(analyses()).toHaveLength(1);
    expect(
      screen.getByRole('button', { name: 'Reading up to date' }),
    ).toBeDisabled();

    act(() => {
      usePromptToolkitStore.setState({
        chatInput: 'Résume le rapport annuel pour la direction',
      });
    });
    await act(() => vi.advanceTimersByTimeAsync(6000));
    expect(analyses()).toHaveLength(1);
    expect(
      screen.getByText('Your request has changed since I read it.'),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Read my request again' }),
    ).toBeEnabled();
  });

  it('offers a retry when the coach is unavailable', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('{}', { status: 429 })),
    );
    usePromptToolkitStore.setState({ chatInput: 'Résume le rapport annuel' });

    render(<CoachPanel />);
    read();

    expect(
      await screen.findByText('Too many requests: wait a minute, then retry.'),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: 'Retry' }).length,
    ).toBeGreaterThan(0);
  });

  it('runs nothing while the panel is hidden', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    usePromptToolkitStore.setState({ chatInput: 'Résume le rapport annuel' });

    render(<CoachPanel isActive={false} />);
    await act(() => vi.advanceTimersByTimeAsync(6000));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      screen.queryByRole('button', { name: 'Read my request' }),
    ).not.toBeInTheDocument();
  });

  it('helps write a request from nothing, with ready answers', async () => {
    let questions = 0;
    const fetchMock = albert((body) => {
      if (!isQuestions(body)) {
        return undefined;
      }
      questions += 1;
      return questions === 1
        ? { message: 'À qui écrivez-vous ?', suggestions: ['Un usager'] }
        : { final_prompt: 'Rédige un courriel courtois à un usager.' };
    });
    vi.stubGlobal('fetch', fetchMock);

    render(<CoachPanel />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Help me write my request' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'An email' }));
    expect(
      (fetchMock.mock.calls[0][1] as RequestInit).body as string,
    ).toContain('Write an email.');
    fireEvent.click(await screen.findByRole('button', { name: 'Un usager' }));
    expect(
      await screen.findByText('Your request is ready'),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole('button', { name: 'Put in the message field' }),
    );
    expect(setChatInput).toHaveBeenCalledWith(
      'Rédige un courriel courtois à un usager.',
    );
  });

  it('offers a review of the exchange after a few requests', () => {
    useMainConversationStore.setState({
      turns: [
        { role: 'user', text: 'Résume le rapport.' },
        { role: 'assistant', text: 'Voici le résumé.' },
        { role: 'user', text: 'Pour la direction.' },
        { role: 'assistant', text: 'Voici la version pour la direction.' },
      ],
      latestCompletedAssistantMessageId: 'assistant-2',
    });

    render(<CoachPanel />);
    fireEvent.click(
      screen.getByRole('button', { name: /Review this exchange/ }),
    );

    expect(
      screen.getByRole('heading', { name: 'Session review' }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Back to the coach' }));
    expect(
      screen.getByText('The Assistant has answered. Does it suit you?'),
    ).toBeInTheDocument();
  });
});
