import { act, renderHook } from '@testing-library/react';

import type { RequestAdvice } from '../chat/nestorChatApi';
import { useNestorChat } from '../chat/useNestorChat';
import { useCoachPrefsStore } from '../stores/useCoachPrefsStore';
import { useMainConversationStore } from '../stores/useMainConversationStore';
import { messagesOf, useNestorChatStore } from '../stores/useNestorChatStore';
import { useProfileStore } from '../stores/useProfileStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));
vi.mock('@/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils')>()),
  useConversationRouteId: () => 'c1',
}));

const completion = (content: object) =>
  new Response(
    JSON.stringify({
      choices: [{ message: { content: JSON.stringify(content) } }],
    }),
    { status: 200 },
  );
const thread = () => messagesOf(useNestorChatStore.getState().chats, 'c1');
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

const ADVICE: RequestAdvice = {
  good: [],
  tips: [
    {
      text: 'Dites la longueur voulue.',
      why: 'Sinon une page.',
      add: 'en 5 lignes',
      part: 'form',
    },
    {
      text: 'Dites le ton.',
      why: '',
      add: 'sur un ton courtois',
      part: 'tone',
    },
  ],
};

describe('the coach, step by step', () => {
  let field = '';
  const setChatInput = vi.fn((text: string) => {
    field = text;
    usePromptToolkitStore.setState({ chatInput: text });
  });
  beforeEach(() => {
    vi.restoreAllMocks();
    field = 'Réponds à l’agent sur son télétravail.';
    useNestorChatStore.setState({ chats: {} });
    usePromptToolkitStore.setState({ chatInput: field, setChatInput });
    useMainConversationStore.setState({
      turns: [],
      latestCompletedAssistantMessageId: null,
      isAssistantResponding: false,
    });
    useCoachPrefsStore.getState().reset();
    useProfileStore.setState({ job: { id: 'rh', label: 'Gestionnaire RH' } });
  });

  it('a task of the job: the start of a request and one reflex', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      completion({
        request: 'Rédige une fiche de poste d’une page.',
        reflex: 'Dites qui va lire.',
      }),
    );
    const { result } = renderHook(() => useNestorChat('French'));
    await act(async () => {
      result.current.startTask('rédiger une fiche de poste');
      await settle();
    });
    const [said, starter] = thread().slice(-2);
    expect(said).toMatchObject({
      kind: 'user',
      text: 'Rédiger une fiche de poste',
    });
    expect(starter).toMatchObject({
      kind: 'starter',
      request: 'Rédige une fiche de poste d’une page.',
      reflex: 'Dites qui va lire.',
      rounds: [{ id: 'say' }],
    });
    act(() => result.current.placeChoice(starter.id, 0));
    expect(field).toBe('Rédige une fiche de poste d’une page.');
  });

  it('« Ajouter » puts the advice’s words in the field', () => {
    const id = useNestorChatStore
      .getState()
      .post('c1', { kind: 'counsel', draft: field, advice: ADVICE });
    const { result } = renderHook(() => useNestorChat('French'));
    act(() => result.current.tipAction(id, 0, 'added'));
    expect(field).toBe('Réponds à l’agent sur son télétravail, en 5 lignes.');
    expect(thread()[0]).toMatchObject({ tipStates: { 0: 'added' } });
  });

  it('« Ajouter » keeps a pasted text after the request', () => {
    field = 'Réponds à l’agent.\n\nCourriel reçu :\n« Bonjour… »';
    usePromptToolkitStore.setState({ chatInput: field });
    const id = useNestorChatStore
      .getState()
      .post('c1', { kind: 'counsel', draft: field, advice: ADVICE });
    const { result } = renderHook(() => useNestorChat('French'));
    act(() => result.current.tipAction(id, 1, 'added'));
    expect(field).toBe(
      'Réponds à l’agent, sur un ton courtois.\n\nCourriel reçu :\n« Bonjour… »',
    );
  });

  it('« Je le fais déjà » is remembered and never advised again', async () => {
    const id = useNestorChatStore
      .getState()
      .post('c1', { kind: 'counsel', draft: field, advice: ADVICE });
    const { result } = renderHook(() => useNestorChat('French'));
    act(() => result.current.tipAction(id, 0, 'known'));
    expect(useCoachPrefsStore.getState().knownParts).toEqual(['form']);
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(completion(ADVICE));
    await act(async () => {
      result.current.runBar('improve');
      await settle();
    });
    const sent = fetchMock.mock.calls[0][1]?.body as string;
    expect(sent).toContain('already does these by themselves: form');
    const counsel = thread().at(-1);
    expect(counsel?.kind === 'counsel' && counsel.advice.tips).toHaveLength(1);
  });

  it('« Je corrige moi-même », then « J’ai corrigé »: the code checks the words to add', () => {
    const id = useNestorChatStore.getState().post('c1', {
      kind: 'counsel',
      draft: field,
      advice: ADVICE,
      rounds: [{ id: 'fix-myself' }],
    });
    const { result } = renderHook(() => useNestorChat('French'));
    act(() => result.current.runRound(id, { id: 'fix-myself' }));
    const hint = thread().at(-1)!;
    expect(hint).toMatchObject({
      kind: 'hint',
      hint: 'fix-myself',
      rounds: [{ id: 'check-fix', primary: true }, { id: 'say' }],
    });
    // The user wrote the length, not the tone; a pasted note does not count.
    usePromptToolkitStore.setState({
      chatInput:
        'Réponds à l’agent en 5 lignes.\n\nNote : réponse sur un ton courtois.',
    });
    const fetchMock = vi.spyOn(global, 'fetch');
    act(() => result.current.runRound(hint.id, { id: 'check-fix' }));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(thread().at(-1)).toMatchObject({
      kind: 'fixcheck',
      tips: ['Dites la longueur voulue.', 'Dites le ton.'],
      done: [true, false],
      message: expect.stringContaining('Still to do'),
    });
  });

  it('advice with nothing to add is checked by Nestor himself', async () => {
    const id = useNestorChatStore.getState().post('c1', {
      kind: 'counsel',
      draft: field,
      advice: {
        good: [],
        tips: [
          { text: 'Dites la longueur voulue.', why: '', add: 'en 5 lignes' },
          { text: 'Collez le courriel reçu.', why: '' },
        ],
      },
    });
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(completion({ done: [true], message: '' }));
    const { result } = renderHook(() => useNestorChat('French'));
    await act(async () => {
      result.current.runRound(id, { id: 'check-fix' });
      await settle();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock.mock.calls[0][1]?.body as string).toContain(
      'Collez le courriel reçu.',
    );
    expect(fetchMock.mock.calls[0][1]?.body as string).not.toContain(
      'Dites la longueur voulue.',
    );
    expect(thread().at(-1)).toMatchObject({
      kind: 'fixcheck',
      done: [false, true],
    });
  });

  it('personal data: nothing leaves before the user decides', async () => {
    field = 'Réponds à l’agent 1 85 05 78 006 084 36 sur ses congés.';
    usePromptToolkitStore.setState({ chatInput: field });
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(completion(ADVICE));
    const { result } = renderHook(() => useNestorChat('French'));
    act(() => result.current.runBar('improve'));
    expect(fetchMock).not.toHaveBeenCalled();
    const stop = thread().at(-1)!;
    expect(stop).toMatchObject({
      kind: 'sensitive',
      kinds: ['nir'],
      rounds: [
        { id: 'remove-sensitive', primary: true },
        { id: 'send-anyway' },
        { id: 'say' },
      ],
    });
    await act(async () => {
      result.current.runRound(stop.id, { id: 'send-anyway' });
      await settle();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(thread().at(-1)).toMatchObject({ kind: 'counsel' });
  });

  it('« Réessayer » after failed versions writes the versions again', async () => {
    const id = useNestorChatStore.getState().post('c1', {
      kind: 'counsel',
      draft: field,
      advice: ADVICE,
    });
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(new Response('', { status: 504 }))
      .mockResolvedValueOnce(
        completion({
          versions: [{ title: 'Courte', text: 'Réponds en 5 lignes.' }],
        }),
      );
    const { result } = renderHook(() => useNestorChat('French'));
    await act(async () => {
      result.current.runRound(id, { id: 'give-text' });
      await settle();
    });
    const error = thread().at(-1)!;
    expect(error).toMatchObject({ kind: 'error' });
    await act(async () => {
      result.current.runRound(error.id, { id: 'retry' });
      await settle();
    });
    expect(thread().at(-1)).toMatchObject({ kind: 'versions' });
    // The versions again, never the advice again.
    expect(fetchMock.mock.calls[1][1]?.body as string).toContain('<advice>');
  });

  it('after an answer, figures found nowhere in what the user gave are named', async () => {
    useMainConversationStore.setState({
      turns: [
        { role: 'user', text: 'Note : demandé au moins 48 heures à l’avance.' },
        {
          role: 'assistant',
          text: 'Possible si la demande est faite 72 heures avant.',
        },
      ],
    });
    vi.spyOn(global, 'fetch').mockResolvedValue(
      completion({ worked: 'Bien.', try: 'Vérifiez.' }),
    );
    const { result } = renderHook(() => useNestorChat('French'));
    await act(async () => {
      result.current.postAdvice('m1');
      await settle();
    });
    expect(thread().at(-1)).toMatchObject({ kind: 'advice', unfound: ['72'] });
  });

  it('the review gives what was said, a request to keep and a case to practise', async () => {
    useMainConversationStore.setState({
      turns: [
        {
          role: 'user',
          text: 'Réponds en 5 lignes à l’agent.\n\nCourriel reçu :\n« Bonjour, je voudrais changer de jour de télétravail. »',
        },
        { role: 'assistant', text: 'Bonjour…' },
      ],
      latestCompletedAssistantMessageId: 'm1',
    });
    const store = useNestorChatStore.getState();
    const grid = (form: string) => [
      { part: 'task' as const, words: 'Réponds' },
      { part: 'reader' as const, words: 'l’agent' },
      { part: 'material' as const, words: '' },
      { part: 'form' as const, words: form },
      { part: 'tone' as const, words: '' },
    ];
    store.post('c1', {
      kind: 'analysis',
      draft: 'a',
      check: {
        present: [],
        grid: grid('en 5 lignes'),
        missing: [],
        message: '',
      },
    });
    store.post('c1', {
      kind: 'analysis',
      draft: 'b',
      check: { present: [], grid: grid(''), missing: [], message: '' },
    });
    vi.spyOn(global, 'fetch').mockResolvedValue(
      completion({ summary: 'Bien.', strengths: [], tips: ['Dites le ton.'] }),
    );
    const { result } = renderHook(() => useNestorChat('French'));
    await act(async () => {
      result.current.runBar('review');
      await settle();
    });
    const review = thread().at(-1)!;
    expect(review).toMatchObject({
      kind: 'review',
      favorite: 'Réponds en 5 lignes à l’agent.',
      caseId: 'rh-1',
    });
    expect(review.kind === 'review' && review.progress?.[0]).toEqual({
      part: 'task',
      said: 2,
      total: 2,
    });
  });
});
