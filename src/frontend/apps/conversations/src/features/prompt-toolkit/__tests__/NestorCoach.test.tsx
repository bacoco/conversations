import { act, fireEvent, render, screen } from '@testing-library/react';

import { CoachPanel } from '../components/CoachPanel';
import { useMainConversationStore } from '../stores/useMainConversationStore';
import { useNestorChatStore } from '../stores/useNestorChatStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';
import { useTrainerStore } from '../stores/useTrainerStore';

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));
vi.mock('../chat/nestorChatApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../chat/nestorChatApi')>()),
  suggestPistes: () =>
    Promise.resolve(['Invite l’équipe à la réunion de lancement']),
}));
vi.mock('@/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils')>()),
  useConversationRouteId: () => 'c1',
}));

describe('the coach is one chat with Nestor', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });
  beforeEach(() => {
    useNestorChatStore.setState({ chats: {} });
    usePromptToolkitStore.setState({ chatInput: '', setChatInput: vi.fn() });
    useMainConversationStore.setState({
      turns: [],
      latestCompletedAssistantMessageId: null,
      isAssistantResponding: false,
    });
  });

  // A heavy render: some slack on a loaded machine.
  it(
    'a case in training: its card instead of the thread, the bar below',
    { timeout: 15_000 },
    () => {
      useTrainerStore.getState().start('rh-1', 'coach');
      render(<CoachPanel />);
      expect(
        screen.getByRole('list', { name: 'Steps of the case' }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('toolbar', { name: 'Nestor’s buttons' }),
      ).toBeInTheDocument();
      // The coach used meanwhile: the thread, and « Reprendre » to go back.
      fireEvent.click(screen.getByRole('button', { name: 'Analyse my text' }));
      expect(
        screen.queryByRole('list', { name: 'Steps of the case' }),
      ).toBeNull();
      fireEvent.click(screen.getByRole('button', { name: /Resume the case/ }));
      expect(
        screen.getByRole('list', { name: 'Steps of the case' }),
      ).toBeInTheDocument();
      act(() => useTrainerStore.getState().stop());
    },
  );

  it('welcome, the fixed bar, and no mode tabs', () => {
    render(<CoachPanel />);
    expect(
      screen.getByRole('toolbar', { name: 'Nestor’s buttons' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('tab')).toBeNull();
    expect(screen.queryByText('Live')).toBeNull();
  });

  it('"Analyser mon texte" with an empty field answers in the thread', () => {
    render(<CoachPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Analyse my text' }));
    expect(
      screen.getByText(
        'First write your request in the middle, in the Assistant’s field.',
      ),
    ).toBeInTheDocument();
  });

  it('"Demander à Nestor" opens the window over the thread', () => {
    render(<CoachPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Ask Nestor' }));
    expect(
      screen.getByRole('dialog', { name: 'Ask Nestor' }),
    ).toBeInTheDocument();
  });

  it('ideas go once Nestor answers, and come back when the text changes', async () => {
    const idea = 'Invite l’équipe à la réunion de lancement';
    usePromptToolkitStore.setState({ chatInput: 'Fais un courriel' });
    render(<CoachPanel />);
    expect(
      await screen.findByText(idea, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
    act(() => {
      useNestorChatStore
        .getState()
        .post('c1', { kind: 'hint', hint: 'write-first' });
    });
    expect(screen.queryByText(idea)).toBeNull();
    act(() => {
      usePromptToolkitStore.setState({ chatInput: 'Fais un courriel court' });
    });
    expect(
      await screen.findByText(idea, undefined, { timeout: 3000 }),
    ).toBeInTheDocument();
  });

  it('no ideas over a long request with a pasted text: a click would lose it', async () => {
    usePromptToolkitStore.setState({
      chatInput: `Résume cette note pour ma directrice : ${'Le décret modifie les seuils. '.repeat(10)}`,
    });
    render(<CoachPanel />);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    expect(
      screen.queryByText('Invite l’équipe à la réunion de lancement'),
    ).toBeNull();
  });
});
