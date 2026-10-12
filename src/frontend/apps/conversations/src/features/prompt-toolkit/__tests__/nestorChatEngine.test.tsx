import { act, renderHook } from '@testing-library/react';

import { useNestorAuto } from '../chat/useNestorAuto';
import { useNestorChat } from '../chat/useNestorChat';
import { useCoachPrefsStore } from '../stores/useCoachPrefsStore';
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

describe('useNestorChat', () => {
  const setChatInput = vi.fn();
  beforeEach(() => {
    vi.restoreAllMocks();
    useNestorChatStore.setState({ chats: {} });
    usePromptToolkitStore.setState({ chatInput: '', setChatInput });
    useMainConversationStore.setState({
      turns: [],
      latestCompletedAssistantMessageId: null,
      isAssistantResponding: false,
    });
  });

  it('an empty field: a hint in the thread, no AI call', () => {
    const fetchMock = vi.spyOn(global, 'fetch');
    const { result } = renderHook(() => useNestorChat('French'));
    act(() => result.current.runBar('analyse'));
    expect(fetchMock).not.toHaveBeenCalled();
    expect(thread().at(-1)).toMatchObject({
      kind: 'hint',
      hint: 'write-first',
    });
  });

  it('analyse → complete → three bounded questions → version with no blank', async () => {
    usePromptToolkitStore.setState({
      chatInput: 'Fais un courriel pour inviter l’équipe',
    });
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        completion({
          present: ['La tâche'],
          missing: [
            {
              short: 'équipe',
              question: 'Quelle équipe ?',
              choices: ['Mon bureau'],
            },
            { short: 'date', question: 'Quelle date ?', choices: [] },
            { short: 'salle', question: 'Quelle salle ?', choices: [] },
          ],
          message: '« L’équipe » reste vague : laquelle ?',
        }),
      )
      .mockResolvedValueOnce(
        completion({
          version:
            'Rédige un courriel pour inviter toute l’équipe du bureau 3.',
        }),
      );
    const { result } = renderHook(() => useNestorChat('French'));
    await act(() => {
      result.current.runBar('analyse');
      return Promise.resolve();
    });
    const analysis = thread().at(-1)!;
    expect(analysis).toMatchObject({
      kind: 'analysis',
      rounds: [{ id: 'complete', primary: true }, { id: 'create-without' }],
    });

    act(() => result.current.runRound(analysis.id, { id: 'complete' }));
    expect(thread().at(-1)).toMatchObject({ kind: 'question', index: 0 });
    act(() =>
      result.current.answerQuestion('toute l’équipe du bureau 3', 'voice'),
    );
    expect(thread().at(-1)).toMatchObject({ kind: 'question', index: 1 });
    act(() => result.current.answerQuestion('Je ne sais pas', 'skip'));
    await act(() => {
      result.current.answerQuestion('Arrêter les questions', 'stop');
      return Promise.resolve();
    });

    const version = thread().at(-1)!;
    expect(version).toMatchObject({
      kind: 'version',
      missing: ['date', 'salle'],
    });
    expect(version.rounds?.[0]).toEqual({
      id: 'redo-with-missing',
      primary: true,
    });
  });

  it('putting the version in the field keeps the draft for "Annuler"', () => {
    usePromptToolkitStore.setState({ chatInput: 'brouillon' });
    useNestorChatStore.getState().post('c1', {
      kind: 'version',
      original: 'brouillon',
      version: 'version',
      missing: [],
    });
    const { result } = renderHook(() => useNestorChat('French'));
    act(() => result.current.placeVersion(thread().at(-1)!.id));
    expect(setChatInput).toHaveBeenCalledWith('version');
    const placed = thread().at(-1)!;
    expect(placed).toMatchObject({ kind: 'placed', previous: 'brouillon' });
    act(() => result.current.runRound(placed.id, { id: 'undo' }));
    expect(setChatInput).toHaveBeenLastCalledWith('brouillon');
  });

  it('a new request never takes the answers of an earlier one', async () => {
    useNestorChatStore.getState().post('c1', {
      kind: 'question',
      index: 0,
      items: [{ short: 'équipe', question: 'Quelle équipe ?', choices: [] }],
    });
    const q = messagesOf(useNestorChatStore.getState().chats, 'c1')[0];
    useNestorChatStore.getState().post('c1', {
      kind: 'user',
      text: 'le bureau 3',
      via: 'voice',
      answers: q.id,
    });
    useNestorChatStore.getState().post('c1', {
      kind: 'version',
      original: 'a',
      version: 'b',
      missing: [],
    });
    usePromptToolkitStore.setState({ chatInput: 'Résume ce texte' });
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        completion({ version: 'Résume ce texte en 5 points.' }),
      );
    const { result } = renderHook(() => useNestorChat('French'));
    await act(() => {
      result.current.runBar('improve');
      return Promise.resolve();
    });
    expect(fetchMock.mock.calls[0][1]?.body as string).not.toContain(
      'bureau 3',
    );
  });

  it('the review before any answer says when it will be possible', () => {
    const { result } = renderHook(() => useNestorChat('French'));
    act(() => result.current.runBar('review'));
    expect(thread().at(-1)).toMatchObject({
      kind: 'hint',
      hint: 'review-after-answer',
    });
  });

  it('a failed call leaves a retry, never a dead end', async () => {
    usePromptToolkitStore.setState({ chatInput: 'Fais un courriel' });
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response('', { status: 500 }),
    );
    const { result } = renderHook(() => useNestorChat('French'));
    await act(() => {
      result.current.runBar('analyse');
      return Promise.resolve();
    });
    expect(thread().at(-1)).toMatchObject({
      kind: 'error',
      retry: 'analyse',
      rounds: [{ id: 'retry', primary: true }],
    });
  });

  it('"Voir des exemples" with no job: three everyday requests', () => {
    const { result } = renderHook(() => useNestorChat('French'));
    act(() => result.current.runRound('hello', { id: 'examples' }));
    expect(thread().at(-1)).toMatchObject({ kind: 'pistes' });
    expect((thread().at(-1) as { phrases: string[] }).phrases).toHaveLength(3);
  });

  it('never offers a way to go on that holds a blank', () => {
    const { result } = renderHook(() => useNestorChat('French'));
    act(() =>
      result.current.postSuites('m1', [
        {
          kind: 'standard',
          axis: 'deepen',
          questions: [
            'Voici le message : [insérer le message ici]',
            'Donne un exemple',
          ],
        },
        { kind: 'extra', label: 'Trous', questions: ['Date : ___'] },
      ]),
    );
    expect(thread().at(-1)).toMatchObject({
      kind: 'suites',
      groups: [
        { kind: 'standard', axis: 'deepen', questions: ['Donne un exemple'] },
      ],
    });
  });
});

describe('useNestorAuto', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    useNestorChatStore.setState({ chats: {} });
    useCoachPrefsStore.getState().reset();
  });

  it('marks each request sent with "Demande n"', () => {
    const { result, rerender } = renderHook(() => {
      const chat = useNestorChat('French');
      useNestorAuto(chat, 'French');
      return chat;
    });
    act(() =>
      useMainConversationStore.setState({
        turns: [{ role: 'user', text: 'Fais un courriel' }],
        isAssistantResponding: true,
      }),
    );
    rerender();
    expect(result.current.messages.at(-1)).toMatchObject({
      kind: 'request',
      n: 1,
    });
  });

  it('Auto off: no advice after an answer', () => {
    useCoachPrefsStore.getState().setAuto(false);
    const fetchMock = vi.spyOn(global, 'fetch');
    renderHook(() => useNestorAuto(useNestorChat('French'), 'French'));
    act(() =>
      useMainConversationStore.setState({
        turns: [
          { role: 'user', text: 'a' },
          { role: 'assistant', text: 'b' },
        ],
        latestCompletedAssistantMessageId: 'm1',
      }),
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
