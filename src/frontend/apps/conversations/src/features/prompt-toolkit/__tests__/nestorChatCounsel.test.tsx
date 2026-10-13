import { act, renderHook } from '@testing-library/react';

import { useNestorChat } from '../chat/useNestorChat';
import { useMainConversationStore } from '../stores/useMainConversationStore';
import { messagesOf, useNestorChatStore } from '../stores/useNestorChatStore';
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

const sent = (fetchMock: ReturnType<typeof vi.spyOn>, call: number) =>
  JSON.parse((fetchMock.mock.calls[call][1] as RequestInit).body as string) as {
    messages: { role: string; content: string }[];
  };

const DRAFT = 'réponds à l’agent pour son télétravail';

const ADVICE = {
  good: ['Vous dites à qui répondre.'],
  tips: [
    { text: 'Dites la longueur voulue.', why: 'Sinon une page entière.' },
    { text: 'Dites le ton.', why: 'Pour un collègue, simple suffit.' },
  ],
};

const settle = () => new Promise((resolve) => setTimeout(resolve, 0));

describe('Nestor gives his advice before any text', () => {
  const setChatInput = vi.fn();
  beforeEach(() => {
    vi.restoreAllMocks();
    setChatInput.mockReset();
    useNestorChatStore.setState({ chats: {} });
    usePromptToolkitStore.setState({ chatInput: DRAFT, setChatInput });
    useMainConversationStore.setState({
      turns: [],
      latestCompletedAssistantMessageId: null,
      isAssistantResponding: false,
    });
  });

  it('« Améliorer mon texte »: the advice first, no question, then the choice', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(completion(ADVICE));
    const { result } = renderHook(() => useNestorChat('French'));
    await act(async () => {
      result.current.runBar('improve');
      await settle();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    const counsel = thread().at(-1)!;
    expect(counsel).toMatchObject({
      kind: 'counsel',
      draft: DRAFT,
      advice: { tips: ADVICE.tips },
      rounds: [
        { id: 'give-text', primary: true },
        { id: 'two-versions' },
        { id: 'fix-myself' },
        { id: 'say' },
      ],
    });
    expect(thread().some((message) => message.kind === 'question')).toBe(false);
  });

  it('« Compléter » after the analysis leads to the advice, not to questions', async () => {
    useNestorChatStore.getState().post('c1', {
      kind: 'analysis',
      draft: DRAFT,
      check: {
        present: [],
        grid: [],
        missing: [{ short: 'forme', question: 'Quelle forme ?', choices: [] }],
        message: '',
      },
    });
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(completion(ADVICE));
    const { result } = renderHook(() => useNestorChat('French'));
    await act(async () => {
      result.current.runRound(thread().at(-1)!.id, { id: 'complete' });
      await settle();
    });
    expect(thread().at(-1)).toMatchObject({ kind: 'counsel' });
    expect(thread().some((message) => message.kind === 'question')).toBe(false);
  });

  it('the analysis offers « Le dire » beside its buttons', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      completion({
        grid: [],
        present: [],
        missing: [{ short: 'forme', question: 'Quelle forme ?' }],
        message: 'Il manque la forme.',
      }),
    );
    const { result } = renderHook(() => useNestorChat('French'));
    await act(async () => {
      result.current.runBar('analyse');
      await settle();
    });
    expect(thread().at(-1)?.rounds).toEqual([
      { id: 'complete', primary: true },
      { id: 'create-without' },
      { id: 'say' },
    ]);
  });

  it('« Me proposer 2 versions »: two versions written with the advice', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(completion(ADVICE))
      .mockResolvedValueOnce(
        completion({
          versions: [
            { title: 'Courte', text: 'Rédige une réponse courte.' },
            { title: 'Détaillée', text: 'Rédige une réponse détaillée.' },
          ],
        }),
      );
    const { result } = renderHook(() => useNestorChat('French'));
    await act(async () => {
      result.current.runBar('improve');
      await settle();
    });
    await act(async () => {
      result.current.runRound(thread().at(-1)!.id, { id: 'two-versions' });
      await settle();
    });
    expect(thread().at(-1)).toMatchObject({
      kind: 'versions',
      items: [
        { title: 'Courte', text: 'Rédige une réponse courte.' },
        { title: 'Détaillée', text: 'Rédige une réponse détaillée.' },
      ],
      rounds: [{ id: 'say' }],
    });
    const input = sent(fetchMock, 1).messages.at(-1)?.content ?? '';
    expect(input).toContain('Dites la longueur voulue.');
    expect(input).toContain(DRAFT);
  });

  it('« Me donner le bon texte »: one version only', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(completion(ADVICE))
      .mockResolvedValueOnce(
        completion({
          versions: [{ title: 'Courte', text: 'Rédige une réponse courte.' }],
        }),
      );
    const { result } = renderHook(() => useNestorChat('French'));
    await act(async () => {
      result.current.runBar('improve');
      await settle();
    });
    await act(async () => {
      result.current.runRound(thread().at(-1)!.id, { id: 'give-text' });
      await settle();
    });
    const versions = thread().at(-1)!;
    expect(versions).toMatchObject({ kind: 'versions' });
    expect(versions.kind === 'versions' && versions.items).toHaveLength(1);
  });

  it('a version put in the field can be cancelled', () => {
    useNestorChatStore.getState().post('c1', {
      kind: 'versions',
      draft: DRAFT,
      items: [
        { title: 'Courte', text: 'courte' },
        { title: 'Détaillée', text: 'détaillée' },
      ],
    });
    const { result } = renderHook(() => useNestorChat('French'));
    act(() => result.current.placeChoice(thread().at(-1)!.id, 1));
    expect(setChatInput).toHaveBeenCalledWith('détaillée');
    const placed = thread().at(-1)!;
    expect(placed).toMatchObject({ kind: 'placed', previous: DRAFT });
    act(() => result.current.runRound(placed.id, { id: 'undo' }));
    expect(setChatInput).toHaveBeenLastCalledWith(DRAFT);
  });

  it('« Je corrige moi-même »: back to the field, no AI call', () => {
    useNestorChatStore
      .getState()
      .post('c1', { kind: 'counsel', draft: DRAFT, advice: ADVICE });
    const fetchMock = vi.spyOn(global, 'fetch');
    const { result } = renderHook(() => useNestorChat('French'));
    act(() =>
      result.current.runRound(thread().at(-1)!.id, { id: 'fix-myself' }),
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(thread().at(-1)).toMatchObject({ kind: 'hint', hint: 'fix-myself' });
  });

  it('« Le dire » opens the microphone and keeps the buttons', () => {
    const id = useNestorChatStore.getState().post('c1', {
      kind: 'counsel',
      draft: DRAFT,
      advice: ADVICE,
      rounds: [{ id: 'give-text', primary: true }, { id: 'say' }],
    });
    const { result } = renderHook(() => useNestorChat('French'));
    act(() => result.current.runRound(id, { id: 'say' }));
    expect(result.current.sheetOpen).toBe(true);
    expect(thread()).toHaveLength(1);
    expect(thread()[0].rounds).toHaveLength(2);
  });
});

describe('Nestor acts on what he is told', () => {
  const setChatInput = vi.fn();
  beforeEach(() => {
    vi.restoreAllMocks();
    useNestorChatStore.setState({ chats: {} });
    usePromptToolkitStore.setState({ chatInput: DRAFT, setChatInput });
    useMainConversationStore.setState({
      turns: [],
      latestCompletedAssistantMessageId: null,
      isAssistantResponding: false,
    });
  });

  it('« Regarde ce que j’ai écrit » runs the analysis of the field', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        completion({
          message: 'Je regarde la demande de votre champ.',
          action: 'analyse',
        }),
      )
      .mockResolvedValueOnce(
        completion({ grid: [], present: [], missing: [], message: 'Clair.' }),
      );
    const { result } = renderHook(() => useNestorChat('French'));
    await act(async () => {
      result.current.askNestor('Regarde ce que j’ai écrit', 'voice');
      await settle();
      await settle();
    });
    expect(sent(fetchMock, 0).messages[0].content).toContain(DRAFT);
    expect(thread().map((message) => message.kind)).toEqual([
      'user',
      'reply',
      'analysis',
    ]);
  });

  it('« Améliore-le » with an answer and a request: Nestor asks which', async () => {
    useMainConversationStore.setState({
      turns: [
        { role: 'user', text: DRAFT },
        { role: 'assistant', text: 'Bonjour, votre demande…' },
      ],
      latestCompletedAssistantMessageId: 'a1',
    });
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      completion({ message: 'Vous parlez de quoi ?', action: 'clarify' }),
    );
    const { result } = renderHook(() => useNestorChat('French'));
    await act(async () => {
      result.current.askNestor('Améliore-le', 'voice');
      await settle();
    });
    expect(thread().at(-1)).toMatchObject({
      kind: 'reply',
      text: 'Vous parlez de quoi ?',
      rounds: [
        { id: 'clarify-request' },
        { id: 'clarify-answer' },
        { id: 'say' },
      ],
    });
  });

  it('« Ma demande » after that question gives the advice on the request', async () => {
    const id = useNestorChatStore.getState().post('c1', {
      kind: 'reply',
      text: 'Vous parlez de quoi ?',
      rounds: [{ id: 'clarify-request' }, { id: 'clarify-answer' }],
    });
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(completion(ADVICE));
    const { result } = renderHook(() => useNestorChat('French'));
    await act(async () => {
      result.current.runRound(id, { id: 'clarify-request' });
      await settle();
    });
    expect(thread().at(-1)).toMatchObject({ kind: 'counsel' });
  });

  it('a question with no button behind it gets a coach’s answer', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      completion({
        message: 'Demandez-le à l’Assistant avec les colonnes voulues.',
        prompt: 'Fais un tableau des règles de cette note.',
      }),
    );
    const { result } = renderHook(() => useNestorChat('French'));
    await act(async () => {
      result.current.askNestor('Comment je fais un tableau ?', 'voice');
      await settle();
    });
    expect(thread().at(-1)).toMatchObject({
      kind: 'reply',
      prompt: 'Fais un tableau des règles de cette note.',
      rounds: [{ id: 'say' }],
    });
  });
  it('with an empty field, « améliore-le » never runs a button on nothing', async () => {
    usePromptToolkitStore.setState({ chatInput: '' });
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      completion({
        message: 'Demandez-lui d’ajouter une phrase sur le chef de bureau.',
        action: 'improve',
        prompt:
          'Ajoute une phrase qui invite l’agent à contacter son chef de bureau.',
      }),
    );
    const { result } = renderHook(() => useNestorChat('French'));
    await act(async () => {
      result.current.askNestor('Améliore-le', 'voice');
      await settle();
    });
    expect(thread().some((message) => message.kind === 'hint')).toBe(false);
    expect(thread().at(-1)).toMatchObject({
      kind: 'reply',
      prompt:
        'Ajoute une phrase qui invite l’agent à contacter son chef de bureau.',
      rounds: [{ id: 'say' }],
    });
  });
});
