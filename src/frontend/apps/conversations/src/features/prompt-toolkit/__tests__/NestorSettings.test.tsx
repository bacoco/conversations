import { fireEvent, render, screen, within } from '@testing-library/react';

import { NestorHeaderTools, NestorSettings } from '../chat/NestorSettings';
import { useCoachPrefsStore } from '../stores/useCoachPrefsStore';
import { messagesOf, useNestorChatStore } from '../stores/useNestorChatStore';
import { useProfileStore } from '../stores/useProfileStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

vi.mock('@/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils')>()),
  useConversationRouteId: () => 'c1',
}));

describe('Nestor’s settings', () => {
  beforeEach(() => {
    useCoachPrefsStore.getState().reset();
    useNestorChatStore.setState({ chats: {} });
  });

  it('the header switch is the same "Auto" as the settings', () => {
    render(<NestorHeaderTools />);
    fireEvent.click(screen.getByRole('switch', { name: 'Auto' }));
    expect(useCoachPrefsStore.getState().auto).toBe(false);
  });

  it('Auto off greys its four lines, which come back as they were', () => {
    useCoachPrefsStore.getState().setAuto(false);
    render(<NestorSettings onClose={vi.fn()} />);
    expect(
      screen.getByRole('switch', { name: 'Ideas while I type' }),
    ).toBeDisabled();
    expect(
      screen.getByRole('switch', { name: 'Ideas while I type' }),
    ).toBeChecked();
  });

  it('erases the thread only after a confirmation', () => {
    useNestorChatStore.getState().post('c1', { kind: 'reply', text: 'x' });
    render(<NestorSettings onClose={vi.fn()} />);
    const thread = () => messagesOf(useNestorChatStore.getState().chats, 'c1');
    fireEvent.click(
      screen.getByRole('button', { name: 'Erase only Nestor’s thread' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'No, keep it' }));
    expect(thread()).toHaveLength(1);
    fireEvent.click(
      screen.getByRole('button', { name: 'Erase only Nestor’s thread' }),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Yes, erase it' }));
    expect(thread()).toHaveLength(0);
  });

  it('never offers to analyse at a pause, and never promises to be right', () => {
    render(<NestorSettings onClose={vi.fn()} />);
    expect(
      screen.queryByRole('switch', { name: 'Analyse when I pause' }),
    ).toBeNull();
    expect(screen.queryByText(/never makes anything up/)).toBeNull();
    expect(screen.getByText(/Nestor can be wrong/)).toBeInTheDocument();
  });

  it('has no bottom bar', () => {
    render(<NestorSettings onClose={vi.fn()} />);
    expect(screen.queryByRole('toolbar')).toBeNull();
  });

  it('leaving the coach closes the settings: back in, the chat shows', () => {
    const store = usePromptToolkitStore.getState;
    for (const leave of [
      () => store().goHome(),
      () => store().goWelcome(),
      () => store().openSection('tools'),
      () => store().startCoach(),
    ]) {
      store().setShowNestorSettings(true);
      leave();
      expect(store().showNestorSettings).toBe(false);
    }
  });

  it('offers the ten jobs of the ministry, and the beginner mode', () => {
    render(<NestorSettings onClose={vi.fn()} />);
    const jobs = screen.getByRole('combobox', { name: 'My field' });
    // "Not specified", then the ten jobs.
    expect(within(jobs).getAllByRole('option')).toHaveLength(11);
    fireEvent.change(jobs, { target: { value: 'controle' } });
    expect(useProfileStore.getState().job?.id).toBe('controle');
    fireEvent.click(screen.getByRole('switch', { name: 'I am a beginner' }));
    expect(useProfileStore.getState().isBeginner).toBe(true);
  });
});
