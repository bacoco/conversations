import { fireEvent, render, screen } from '@testing-library/react';

import { EraseThreadBar } from '../chat/EraseThreadBar';
import { NEW_CHAT_KEY, useNestorChatStore } from '../stores/useNestorChatStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

vi.mock('@/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils')>()),
  useConversationRouteId: () => undefined,
}));

describe('<EraseThreadBar />: the bin of the coach’s header', () => {
  beforeEach(() => {
    useNestorChatStore.getState().clear(NEW_CHAT_KEY);
    useNestorChatStore.getState().post(NEW_CHAT_KEY, {
      kind: 'request',
      n: 1,
      at: 1,
    } as never);
  });

  it('nothing until the bin is clicked', () => {
    usePromptToolkitStore.setState({ eraseAsked: false });
    render(<EraseThreadBar />);
    expect(screen.queryByRole('button', { name: 'Yes, erase it' })).toBeNull();
  });

  it('asks once, then erases Nestor’s thread for this conversation', () => {
    usePromptToolkitStore.setState({ eraseAsked: true });
    render(<EraseThreadBar />);
    fireEvent.click(screen.getByRole('button', { name: 'Yes, erase it' }));
    expect(
      useNestorChatStore.getState().chats[NEW_CHAT_KEY]?.messages ?? [],
    ).toEqual([]);
    expect(usePromptToolkitStore.getState().eraseAsked).toBe(false);
  });

  it('« No, keep it » keeps everything', () => {
    usePromptToolkitStore.setState({ eraseAsked: true });
    render(<EraseThreadBar />);
    fireEvent.click(screen.getByRole('button', { name: 'No, keep it' }));
    expect(
      useNestorChatStore.getState().chats[NEW_CHAT_KEY]?.messages,
    ).toHaveLength(1);
    expect(usePromptToolkitStore.getState().eraseAsked).toBe(false);
  });
});
