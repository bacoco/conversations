import { act, renderHook } from '@testing-library/react';

import { useTrainer } from '../chat/useTrainer';
import { caseById } from '../jobs/jobs';
import { useCasesStore } from '../learn/cases/casesProgress';
import { useMainConversationStore } from '../stores/useMainConversationStore';
import { useProfileStore } from '../stores/useProfileStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';
import { startTraining, useTrainerStore } from '../stores/useTrainerStore';

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const completion = (content: object) =>
  new Response(
    JSON.stringify({
      choices: [{ message: { content: JSON.stringify(content) } }],
    }),
    { status: 200 },
  );
const settle = () => new Promise((resolve) => setTimeout(resolve, 0));
const CASE = caseById('rh-1')!;
const trainer = () => useTrainerStore.getState();

describe('the trainer, step by step', () => {
  let field = '';
  const setChatInput = vi.fn((text: string) => {
    field = text;
    usePromptToolkitStore.setState({ chatInput: text });
  });
  beforeEach(() => {
    vi.restoreAllMocks();
    field = '';
    usePromptToolkitStore.setState({
      chatInput: '',
      setChatInput,
      mode: 'learn',
      showHome: false,
    });
    useMainConversationStore.setState({
      turns: [],
      latestCompletedAssistantMessageId: null,
      isAssistantResponding: false,
    });
    useProfileStore.setState({ job: { id: 'rh', label: 'Gestionnaire RH' } });
    useCasesStore.setState({ done: {} });
    startTraining('rh-1');
  });

  it('« J’ai lu »: the texts of the case wait in the field, under the request', () => {
    const { result } = renderHook(() => useTrainer('French'));
    act(() => result.current.readDone());
    expect(trainer().step).toBe('ask');
    expect(field).toBe(`\n\n${CASE.material}`);
  });

  it('« Partir de la demande d’un débutant »: the vague request above the texts', () => {
    const { result } = renderHook(() => useTrainer('French'));
    act(() => result.current.readDone());
    act(() => result.current.useBeginnerRequest());
    expect(field).toBe(`${CASE.startingRequest}\n\n${CASE.material}`);
  });

  it('« C’est ma demande » with nothing written: Nestor says so, no call', () => {
    const fetchMock = vi.spyOn(global, 'fetch');
    const { result } = renderHook(() => useTrainer('French'));
    act(() => result.current.readDone());
    act(() => result.current.myRequestDone());
    expect(fetchMock).not.toHaveBeenCalled();
    expect(trainer().step).toBe('ask');
    expect(result.current.notice).toBe('write-first');
  });

  it('« C’est ma demande »: the advice on it', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      completion({
        good: ['Vous avez donné le courriel.'],
        tips: [
          {
            text: 'Citez ses deux questions.',
            why: '',
            add: 'en répondant à ses deux questions',
            part: 'task',
          },
        ],
      }),
    );
    const { result } = renderHook(() => useTrainer('French'));
    act(() => result.current.readDone());
    usePromptToolkitStore.setState({
      chatInput: `Réponds à l’agent.\n\n${CASE.material}`,
    });
    await act(async () => {
      result.current.myRequestDone();
      await settle();
    });
    expect(trainer().step).toBe('advice');
    expect(trainer().advice?.tips).toHaveLength(1);
    act(() => result.current.tipAction(0, 'added'));
    expect(field.split('\n\n')[0]).toBe(
      'Réponds à l’agent, en répondant à ses deux questions.',
    );
  });

  it('« J’ai corrigé »: the key points checked on the request alone', async () => {
    useTrainerStore.getState().update({ step: 'advice' });
    usePromptToolkitStore.setState({
      chatInput: `Réponds à l’agent en t’appuyant uniquement sur la note.\n\n${CASE.material}`,
    });
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        completion({ done: [true, false, false], message: '' }),
      );
    const { result } = renderHook(() => useTrainer('French'));
    await act(async () => {
      result.current.corrected();
      await settle();
    });
    const sent = fetchMock.mock.calls[0][1]?.body as string;
    expect(sent).toContain('uniquement sur la note');
    // The pasted texts never count as the user's words.
    expect(sent).not.toContain('bureau des achats');
    expect(trainer()).toMatchObject({
      step: 'compare',
      mine: 'Réponds à l’agent en t’appuyant uniquement sur la note.',
      points: [true, false, false],
    });
  });

  it('« Envoyer la bonne demande », then the answer: what to check', () => {
    useTrainerStore.getState().update({ step: 'compare' });
    const { result, rerender } = renderHook(() => useTrainer('French'));
    act(() => result.current.useGood());
    expect(field).toBe(`${CASE.goodRequest}\n\n${CASE.material}`);
    expect(trainer().placed).toBe('good');
    act(() => {
      useMainConversationStore.setState({
        turns: [
          { role: 'user', text: field },
          { role: 'assistant', text: 'Le délai est de 72 heures.' },
        ],
        latestCompletedAssistantMessageId: 'a1',
        isAssistantResponding: false,
      });
    });
    rerender();
    expect(trainer()).toMatchObject({ step: 'verify', unfound: ['72'] });
  });

  it('« J’ai vérifié »: the case is done, the next one of the job is offered', () => {
    useTrainerStore.getState().update({ step: 'verify' });
    const { result } = renderHook(() => useTrainer('French'));
    act(() => result.current.check(0, true));
    act(() => result.current.verified());
    expect(trainer().step).toBe('done');
    expect(useCasesStore.getState().done['rh-1']).toBeDefined();
    expect(result.current.nextCaseId).toBe('rh-2');
    act(() => result.current.nextCase());
    expect(trainer()).toMatchObject({ caseId: 'rh-2', step: 'read' });
  });

  it('« Revenir au coach » ends the case, back where the user was', () => {
    const { result } = renderHook(() => useTrainer('French'));
    act(() => result.current.leave());
    expect(trainer().caseId).toBeNull();
    expect(usePromptToolkitStore.getState().mode).toBe('learn');
  });
});
