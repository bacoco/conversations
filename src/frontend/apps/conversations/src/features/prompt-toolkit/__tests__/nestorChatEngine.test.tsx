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
          lesson: 'Dites quelle équipe dès le début.',
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
      lesson: 'Dites quelle équipe dès le début.',
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
      .mockResolvedValueOnce(
        completion({ present: ['Le résumé'], missing: [], message: 'Claire.' }),
      )
      .mockResolvedValueOnce(
        completion({ version: 'Résume ce texte en 5 points.' }),
      );
    const { result } = renderHook(() => useNestorChat('French'));
    await act(() => {
      result.current.runBar('improve');
      return Promise.resolve();
    });
    const bodies = fetchMock.mock.calls.map((call) => call[1]?.body as string);
    expect(bodies).toHaveLength(2);
    expect(bodies.join('\n')).not.toContain('bureau 3');
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

  it('answers to questions rewrite the request they are about, not an older version', async () => {
    const store = useNestorChatStore.getState();
    store.post('c1', {
      kind: 'version',
      original: 'A',
      version: 'Version de la demande A',
      missing: [],
    });
    store.post('c1', {
      kind: 'analysis',
      draft: 'Demande B sur le budget',
      check: {
        present: [],
        missing: [{ short: 'année', question: 'Quelle année ?', choices: [] }],
        message: 'm',
      },
    });
    store.post('c1', {
      kind: 'question',
      index: 0,
      items: [{ short: 'année', question: 'Quelle année ?', choices: [] }],
    });
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        completion({ version: 'Demande B sur le budget 2026.' }),
      );
    const { result } = renderHook(() => useNestorChat('French'));
    await act(() => {
      result.current.answerQuestion('2026', 'choice');
      return Promise.resolve();
    });
    const body = fetchMock.mock.calls[0][1]?.body as string;
    expect(body).toContain('Demande B sur le budget');
    expect(body).not.toContain('Version de la demande A');
  });

  it('advice still running when a new request is sent is dropped, never shown after it', async () => {
    useMainConversationStore.setState({
      turns: [
        { role: 'user', text: 'Fais un courriel' },
        { role: 'assistant', text: 'Bonjour à tous' },
      ],
    });
    let answer: (response: Response) => void = () => undefined;
    vi.spyOn(global, 'fetch').mockReturnValue(
      new Promise<Response>((resolve) => {
        answer = resolve;
      }),
    );
    const { result } = renderHook(() => useNestorChat('French'));
    act(() => result.current.postAdvice('m1'));
    act(() => result.current.postRequest(2));
    await act(() => {
      answer(completion({ issue: 'Trop tard.', try: 'Rien.' }));
      return new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(thread().some((message) => message.kind === 'advice')).toBe(false);
    expect(thread().at(-1)).toMatchObject({ kind: 'request', n: 2 });
  });

  it('"Améliorer" on a vague request asks what is missing first, then writes', async () => {
    usePromptToolkitStore.setState({ chatInput: 'aide moi compte rendu' });
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      completion({
        present: ['Le compte rendu'],
        missing: [
          { short: 'réunion', question: 'De quelle réunion ?', choices: [] },
        ],
        message: 'Il me faut la réunion.',
      }),
    );
    const { result } = renderHook(() => useNestorChat('French'));
    await act(() => {
      result.current.runBar('improve');
      return Promise.resolve();
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(thread().at(-1)).toMatchObject({
      kind: 'question',
      index: 0,
    });
  });

  it('what the user clicked shows on their side, before Nestor answers', () => {
    const { result } = renderHook(() => useNestorChat('French'));
    act(() => result.current.runBar('analyse'));
    const [said, hint] = thread().slice(-2);
    expect(said).toMatchObject({
      kind: 'user',
      via: 'action',
      text: 'Analyse my text',
    });
    expect(hint).toMatchObject({ kind: 'hint', hint: 'write-first' });
  });

  it('a round clicked shows on the user’s side too', () => {
    const store = useNestorChatStore.getState();
    const id = store.post('c1', {
      kind: 'analysis',
      draft: 'x',
      check: {
        present: [],
        missing: [{ short: 'date', question: 'Quelle date ?', choices: [] }],
        message: 'm',
      },
      rounds: [{ id: 'complete', primary: true }],
    });
    const { result } = renderHook(() => useNestorChat('French'));
    act(() => result.current.runRound(id, { id: 'complete', primary: true }));
    expect(thread().slice(-2)[0]).toMatchObject({
      kind: 'user',
      via: 'action',
      text: 'Complete them',
    });
  });

  it('the review never hears of advice that no later request could apply', async () => {
    useMainConversationStore.setState({
      turns: [
        { role: 'user', text: 'Fais un courriel' },
        { role: 'assistant', text: 'Voici' },
      ],
      latestCompletedAssistantMessageId: 'm1',
      isAssistantResponding: false,
    });
    useNestorChatStore.getState().post('c1', {
      kind: 'advice',
      note: { exchanges: 1, tryNow: 'Ajoutez l’heure', applied: null } as never,
      missing: [],
      answerId: 'm1',
    });
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      completion({
        summary: 'Bien.',
        strengths: ['Clair'],
        habits: [],
        tips: ['a', 'b', 'c'],
        grades: [],
      }),
    );
    const { result } = renderHook(() => useNestorChat('French'));
    await act(() => {
      result.current.runBar('review');
      return Promise.resolve();
    });
    expect(fetchMock.mock.calls[0][1]?.body as string).not.toContain(
      'Ajoutez l’heure',
    );
  });

  it('advice on an answer with blanks keeps them, to warn first', async () => {
    useMainConversationStore.setState({
      turns: [
        { role: 'user', text: 'Fais un courriel' },
        { role: 'assistant', text: 'Rendez-vous à [heure] en salle B12.' },
      ],
    });
    vi.spyOn(global, 'fetch').mockResolvedValue(
      completion({ issue: 'Il manque l’heure.', try: 'Donnez l’heure.' }),
    );
    const { result } = renderHook(() => useNestorChat('French'));
    await act(() => {
      result.current.postAdvice('m1');
      return new Promise((resolve) => setTimeout(resolve, 0));
    });
    expect(thread().at(-1)).toMatchObject({
      kind: 'advice',
      gaps: [expect.stringContaining('heure')],
    });
  });

  it('the review is told which advice was applied, never left to guess', async () => {
    useMainConversationStore.setState({
      turns: [
        { role: 'user', text: 'Résume' },
        { role: 'assistant', text: 'R1' },
        { role: 'user', text: 'Plus court' },
        { role: 'assistant', text: 'R2' },
      ],
      latestCompletedAssistantMessageId: 'm2',
      isAssistantResponding: false,
    });
    const store = useNestorChatStore.getState();
    store.post('c1', {
      kind: 'advice',
      note: { upTo: 2, tryNow: 'Dites pour qui', applied: null } as never,
      missing: [],
      answerId: 'm1',
    });
    store.post('c1', {
      kind: 'advice',
      note: { upTo: 4, tryNow: 'Gardez ce format', applied: false } as never,
      missing: [],
      answerId: 'm2',
    });
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      completion({
        summary: 'Bien.',
        strengths: [],
        habits: [],
        tips: ['a', 'b', 'c'],
        grades: [],
      }),
    );
    const { result } = renderHook(() => useNestorChat('French'));
    await act(() => {
      result.current.runBar('review');
      return Promise.resolve();
    });
    expect(fetchMock.mock.calls[0][1]?.body as string).toContain(
      'Dites pour qui (applied: no)',
    );
  });

  it('pasted notes as an answer end the questions: they answer the rest', async () => {
    const items = [
      { short: 'notes', question: 'Collez vos notes ?', choices: [] },
      { short: 'équipe', question: 'Quelle équipe ?', choices: [] },
      { short: 'sujets', question: 'Quels sujets ?', choices: [] },
    ];
    const store = useNestorChatStore.getState();
    store.post('c1', {
      kind: 'analysis',
      draft: 'Fais le compte rendu',
      check: { present: [], missing: items, message: 'm' },
    });
    store.post('c1', { kind: 'question', index: 0, items });
    const fetchMock = vi
      .spyOn(global, 'fetch')
      // A fresh answer each time: a body can be read once.
      .mockImplementation(() =>
        Promise.resolve(
          completion({
            version:
              'Rédige le compte rendu de la réunion à partir de ces notes : Présents Paul, Inès ; congés de décembre.',
          }),
        ),
      );
    const { result } = renderHook(() => useNestorChat('French'));
    await act(() => {
      result.current.answerQuestion(
        'Présents : Paul, Inès, Marc. On a parlé du planning des congés de décembre : chacun pose ses jours avant le 15 novembre. Marc vérifie le budget formation.',
        'keyboard',
      );
      return Promise.resolve();
    });
    expect(thread().some((m) => m.kind === 'question' && m.index === 1)).toBe(
      false,
    );
    // The version is written (a second try when it leaves notes out).
    expect(fetchMock).toHaveBeenCalled();
    expect(thread().at(-1)).toMatchObject({ kind: 'version', missing: [] });
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
