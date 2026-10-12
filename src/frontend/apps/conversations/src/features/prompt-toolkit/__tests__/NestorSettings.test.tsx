import { fireEvent, render, screen } from '@testing-library/react';

import { NestorHeaderTools, NestorSettings } from '../chat/NestorSettings';
import { useCoachPrefsStore } from '../stores/useCoachPrefsStore';
import { messagesOf, useNestorChatStore } from '../stores/useNestorChatStore';
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
});
