import { act, renderHook } from '@testing-library/react';

import { useNestorAuto } from '../chat/useNestorAuto';
import { useNestorChat } from '../chat/useNestorChat';
import { useMainConversationStore } from '../stores/useMainConversationStore';
import {
  NEW_CHAT_KEY,
  messagesOf,
  useNestorChatStore,
} from '../stores/useNestorChatStore';

const mockRoute = vi.hoisted(() => ({ id: undefined as string | undefined }));

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));
vi.mock('@/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils')>()),
  useConversationRouteId: () => mockRoute.id,
}));

describe('useNestorAuto — the thread before the first send', () => {
  beforeEach(() => {
    mockRoute.id = undefined;
    useNestorChatStore.setState({ chats: {} });
    useMainConversationStore.setState({
      turns: [],
      latestCompletedAssistantMessageId: null,
      isAssistantResponding: false,
    });
  });

  it('the thread written before sending follows the new conversation, only that one', () => {
    useNestorChatStore
      .getState()
      .post(NEW_CHAT_KEY, { kind: 'reply', text: 'avant' });
    const { rerender } = renderHook(() =>
      useNestorAuto(useNestorChat('French'), 'French'),
    );
    mockRoute.id = 'c9';
    act(() =>
      useMainConversationStore.setState({
        turns: [{ role: 'user', text: 'x' }],
        isAssistantResponding: true,
      }),
    );
    rerender();
    expect(
      messagesOf(useNestorChatStore.getState().chats, 'c9')[0],
    ).toMatchObject({ text: 'avant' });
  });

  it('opening an older conversation never takes the new thread', () => {
    useNestorChatStore
      .getState()
      .post(NEW_CHAT_KEY, { kind: 'reply', text: 'avant' });
    const { rerender } = renderHook(() =>
      useNestorAuto(useNestorChat('French'), 'French'),
    );
    mockRoute.id = 'old';
    act(() =>
      useMainConversationStore.setState({
        turns: [
          { role: 'user', text: '1' },
          { role: 'assistant', text: '2' },
          { role: 'user', text: '3' },
        ],
      }),
    );
    rerender();
    expect(messagesOf(useNestorChatStore.getState().chats, 'old')).toEqual([]);
  });

  it('opening an older conversation of one request never takes the new thread', () => {
    useNestorChatStore
      .getState()
      .post(NEW_CHAT_KEY, { kind: 'reply', text: 'avant' });
    const { rerender } = renderHook(() =>
      useNestorAuto(useNestorChat('French'), 'French'),
    );
    mockRoute.id = 'old';
    act(() =>
      useMainConversationStore.setState({
        turns: [
          { role: 'user', text: '1' },
          { role: 'assistant', text: '2' },
        ],
      }),
    );
    rerender();
    expect(messagesOf(useNestorChatStore.getState().chats, 'old')).toEqual([]);
    expect(
      messagesOf(useNestorChatStore.getState().chats, NEW_CHAT_KEY),
    ).toHaveLength(1);
  });

  it('an older conversation with its answer never takes the new thread', () => {
    useNestorChatStore
      .getState()
      .post(NEW_CHAT_KEY, { kind: 'reply', text: 'avant' });
    const { rerender } = renderHook(() =>
      useNestorAuto(useNestorChat('French'), 'French'),
    );
    mockRoute.id = 'old';
    act(() =>
      useMainConversationStore.setState({
        turns: [
          { role: 'user', text: '1' },
          { role: 'assistant', text: '2' },
        ],
        latestCompletedAssistantMessageId: 'm1',
      }),
    );
    rerender();
    expect(messagesOf(useNestorChatStore.getState().chats, 'old')).toEqual([]);
  });

  it('on the new page, an earlier answer still in memory gets no advice', () => {
    const fetchMock = vi.spyOn(global, 'fetch');
    renderHook(() => useNestorAuto(useNestorChat('French'), 'French'));
    act(() =>
      useMainConversationStore.setState({
        turns: [
          { role: 'user', text: 'avant' },
          { role: 'assistant', text: 'réponse' },
        ],
        latestCompletedAssistantMessageId: 'old-answer',
      }),
    );
    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      messagesOf(useNestorChatStore.getState().chats, NEW_CHAT_KEY),
    ).toEqual([]);
    fetchMock.mockRestore();
  });
});
