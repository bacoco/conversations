import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
  within,
} from '@testing-library/react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { NestorThread } from '../chat/NestorThread';
import {
  CLOSE_CASE_MIN_SCORE,
  CLOSE_MODEL_MIN_SCORE,
  clearCloseMatchVectors,
  findCloseMatches,
} from '../chat/closeMatches';
import { useCloseMatches } from '../chat/useCloseMatches';
import type { NestorChat } from '../chat/useNestorChat';
import { PISTES_DELAY_MS } from '../chat/usePistes';
import { CoachPanel } from '../components/CoachPanel';
import { JOB_IDS, casesOf } from '../jobs/jobs';
import { getPromptLibrary } from '../library/content';
import { useCoachPrefsStore } from '../stores/useCoachPrefsStore';
import { useMainConversationStore } from '../stores/useMainConversationStore';
import { useNestorChatStore } from '../stores/useNestorChatStore';
import { useProfileStore } from '../stores/useProfileStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';
import { useTrainerStore } from '../stores/useTrainerStore';

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));
vi.mock('../chat/nestorChatApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../chat/nestorChatApi')>()),
  suggestPistes: () =>
    Promise.resolve([
      'Réponds à cet usager en t’excusant du double prélèvement',
    ]),
}));
vi.mock('@/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils')>()),
  useConversationRouteId: () => 'c1',
}));

beforeAll(async () => {
  // A real English instance: the lines are checked with their titles.
  await i18n.use(initReactI18next).init({
    lng: 'en',
    resources: { en: { translation: {} } },
    nsSeparator: false,
    keySeparator: false,
    interpolation: { escapeValue: false },
  });
});

const QUERY = 'réponds à cet usager qui se plaint de son prélèvement';
const allCases = JOB_IDS.flatMap(casesOf);
const prompts = getPromptLibrary('fr').prompts;

/**
 * Embeddings stand-in: the request points one way; each text is given its
 * closeness to it (the cosine), the rest points elsewhere.
 */
const stubEmbeddings = (closeness: Record<string, number>) => {
  const fetchMock = vi.fn((_url: string, init: RequestInit) => {
    const { input } = JSON.parse(init.body as string) as { input: string[] };
    return Promise.resolve(
      new Response(
        JSON.stringify({
          data: input.map((text, index) => {
            if (text === QUERY) return { index, embedding: [1, 0] };
            const title = Object.keys(closeness).find((key) =>
              text.startsWith(`${key}\n`),
            );
            const cos = title === undefined ? 0 : closeness[title];
            return { index, embedding: [cos, Math.sqrt(1 - cos * cos)] };
          }),
        }),
      ),
    );
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
};

describe('findCloseMatches', () => {
  beforeEach(() => clearCloseMatchVectors());
  afterEach(() => vi.unstubAllGlobals());

  it('the closest case and the closest model, each when really close', async () => {
    const [case1, case2] = allCases;
    stubEmbeddings({
      [case1.title]: 0.8,
      [case2.title]: 0.9,
      [prompts[3].title]: 0.7,
    });
    const found = await findCloseMatches(QUERY, { cases: allCases, prompts });
    expect(found.caseMatch?.id).toBe(case2.id);
    expect(found.model?.id).toBe(prompts[3].id);
  });

  it('nothing really close: no case, no model', async () => {
    stubEmbeddings({
      [allCases[0].title]: CLOSE_CASE_MIN_SCORE - 0.02,
      [prompts[0].title]: CLOSE_MODEL_MIN_SCORE - 0.02,
    });
    const found = await findCloseMatches(QUERY, { cases: allCases, prompts });
    expect(found).toEqual({ caseMatch: null, model: null });
  });

  it('the cases and the library are embedded once, in batches of 64', async () => {
    const fetchMock = stubEmbeddings({});
    await findCloseMatches(QUERY, { cases: allCases, prompts });
    fetchMock.mock.calls.forEach(([, init]) => {
      const { input } = JSON.parse(init.body as string) as { input: string[] };
      expect(input.length).toBeLessThanOrEqual(64);
    });
    const first = fetchMock.mock.calls.length;
    await findCloseMatches(`${QUERY} demain`, { cases: allCases, prompts });
    // Only the new request is embedded the second time.
    expect(fetchMock.mock.calls.length).toBe(first + 1);
  });
});

describe('useCloseMatches', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    clearCloseMatchVectors();
    useProfileStore.setState({ job: null });
    useCoachPrefsStore.setState({ auto: true, autoPistes: true });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const settle = async () => {
    await act(async () => {
      await vi.advanceTimersByTimeAsync(PISTES_DELAY_MS);
    });
    // The embeddings calls, then the state update.
    for (let i = 0; i < 5; i += 1) {
      await act(async () => {
        await Promise.resolve();
      });
    }
  };

  it('asks only after a pause in typing, then shows what is close', async () => {
    const target = casesOf('rh')[0];
    const fetchMock = stubEmbeddings({ [target.title]: 0.9 });
    const { result } = renderHook(() => useCloseMatches(QUERY, true));
    expect(fetchMock).not.toHaveBeenCalled();
    await settle();
    expect(result.current.caseMatch?.id).toBe(target.id);
    expect(result.current.model).toBeNull();
  });

  it('with a job: only the cases of that job', async () => {
    useProfileStore.setState({ job: { id: 'rh', label: 'RH' } });
    const elsewhere = casesOf('comptable')[0];
    const ownJob = casesOf('rh')[1];
    stubEmbeddings({ [elsewhere.title]: 0.95, [ownJob.title]: 0.8 });
    const { result } = renderHook(() => useCloseMatches(QUERY, true));
    await settle();
    expect(result.current.caseMatch?.id).toBe(ownJob.id);
  });

  it('never the case already put on hold', async () => {
    const target = casesOf('rh')[0];
    stubEmbeddings({ [target.title]: 0.9 });
    const { result } = renderHook(() =>
      useCloseMatches(QUERY, true, target.id),
    );
    await settle();
    expect(result.current.caseMatch).toBeNull();
  });

  it.each([
    ['too short', 'un mail'],
    ['too long', `${QUERY} `.repeat(5)],
    ['personal data', `${QUERY} : jean.dupont@exemple.fr`],
  ])('nothing leaves when the text is %s', async (_why, text) => {
    const fetchMock = stubEmbeddings({});
    const { result } = renderHook(() => useCloseMatches(text, true));
    await settle();
    expect(fetchMock).not.toHaveBeenCalled();
    expect(result.current).toEqual({ caseMatch: null, model: null });
  });

  it('nothing when disabled (« Auto » off), and it goes when typing stops', async () => {
    const target = casesOf('rh')[0];
    const fetchMock = stubEmbeddings({ [target.title]: 0.9 });
    const { result, rerender } = renderHook(
      ({ text, enabled }) => useCloseMatches(text, enabled),
      { initialProps: { text: QUERY, enabled: false } },
    );
    await settle();
    expect(fetchMock).not.toHaveBeenCalled();
    rerender({ text: QUERY, enabled: true });
    await settle();
    expect(result.current.caseMatch?.id).toBe(target.id);
    // The field emptied (sent or erased): nothing left on screen.
    rerender({ text: '', enabled: true });
    expect(result.current).toEqual({ caseMatch: null, model: null });
  });
});

describe('close matches in the thread', () => {
  const chat = {
    messages: [],
    action: 1,
    busy: null,
    questions: {
      items: [],
      current: null,
      answers: [],
      skipped: [],
      done: false,
    },
    runRound: vi.fn(),
    choosePiste: vi.fn(),
  } as unknown as NestorChat;

  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });
  beforeEach(() => {
    usePromptToolkitStore.setState({
      chatInput: QUERY,
      fill: null,
      showHome: false,
    });
    useTrainerStore.getState().stop();
  });

  it('two discreet lines under the ideas; the case opens the trainer', () => {
    const target = casesOf('rh')[0];
    render(
      <NestorThread
        chat={chat}
        pistes={['Réponds à cet usager en t’excusant']}
        close={{ caseMatch: target, model: prompts[0] }}
      />,
    );
    const lines = screen.getByRole('group', { name: 'Close to your request' });
    expect(within(lines).getAllByRole('button')).toHaveLength(2);
    fireEvent.click(
      screen.getByRole('button', {
        name: `Practise on a close case: ${target.title}`,
      }),
    );
    expect(useTrainerStore.getState().caseId).toBe(target.id);
    expect(usePromptToolkitStore.getState().mode).toBe('coach');
    act(() => useTrainerStore.getState().stop());
  });

  it('the model opens Nestor’s questions, with what is already written', () => {
    render(
      <NestorThread
        chat={chat}
        pistes={[]}
        close={{ caseMatch: null, model: prompts[0] }}
      />,
    );
    expect(
      screen.queryByRole('button', { name: /Practise on a close case/ }),
    ).toBeNull();
    fireEvent.click(
      screen.getByRole('button', {
        name: `A close model: ${prompts[0].title}`,
      }),
    );
    expect(usePromptToolkitStore.getState().fill).toMatchObject({
      template: prompts[0].prompt,
      title: prompts[0].title,
      context: QUERY,
    });
  });

  it('nothing close: nothing shown', () => {
    render(
      <NestorThread
        chat={chat}
        pistes={[]}
        close={{ caseMatch: null, model: null }}
      />,
    );
    expect(
      screen.queryByRole('group', { name: 'Close to your request' }),
    ).toBeNull();
  });
});

describe('in the coach, while the user types', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });
  beforeEach(() => {
    clearCloseMatchVectors();
    useNestorChatStore.setState({ chats: {} });
    useProfileStore.setState({ job: { id: 'rh', label: 'RH' } });
    useCoachPrefsStore.setState({ auto: true, autoPistes: true });
    useMainConversationStore.setState({
      turns: [],
      latestCompletedAssistantMessageId: null,
      isAssistantResponding: false,
    });
    useTrainerStore.getState().stop();
    usePromptToolkitStore.setState({
      chatInput: '',
      setChatInput: vi.fn(),
      fill: null,
      showHome: false,
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('the close case shows under the ideas; a click starts training on it', async () => {
    const target = casesOf('rh')[0];
    stubEmbeddings({ [target.title]: 0.9 });
    render(<CoachPanel />);
    expect(
      screen.queryByRole('group', { name: 'Close to your request' }),
    ).toBeNull();
    act(() => {
      usePromptToolkitStore.setState({ chatInput: QUERY });
    });
    fireEvent.click(
      await screen.findByRole(
        'button',
        { name: `Practise on a close case: ${target.title}` },
        { timeout: 3000 },
      ),
    );
    expect(useTrainerStore.getState().caseId).toBe(target.id);
    expect(
      screen.getByRole('list', { name: 'Steps of the case' }),
    ).toBeInTheDocument();
    act(() => useTrainerStore.getState().stop());
  });

  it('« Auto » off: nothing is looked up', async () => {
    useCoachPrefsStore.setState({ auto: false });
    const fetchMock = stubEmbeddings({});
    render(<CoachPanel />);
    act(() => {
      usePromptToolkitStore.setState({ chatInput: QUERY });
    });
    await act(
      () =>
        new Promise((resolve) => setTimeout(resolve, PISTES_DELAY_MS + 200)),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
