import { act, render, renderHook, screen } from '@testing-library/react';

import { NestorBar } from '../chat/NestorBar';
import { examplePairs } from '../chat/examples';
import type { NestorChat } from '../chat/useNestorChat';
import { useDemoGuide } from '../demo/useDemoGuide';
import {
  DEMO_KEY,
  startDemo,
  stopDemo,
  useDemoStore,
} from '../stores/useDemoStore';
import { messagesOf, useNestorChatStore } from '../stores/useNestorChatStore';
import { useProfileStore } from '../stores/useProfileStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

const demoThread = () =>
  messagesOf(useNestorChatStore.getState().chats, DEMO_KEY);

describe('the demo: the real buttons, explained right after', () => {
  const setChatInput = vi.fn();
  beforeEach(() => {
    setChatInput.mockClear();
    useNestorChatStore.setState({ chats: {} });
    useDemoStore.getState().stop();
    useProfileStore.setState({ job: { id: 'rh', label: 'Gestionnaire RH' } });
    usePromptToolkitStore.setState({
      chatInput: 'mon brouillon',
      setChatInput,
      showHome: true,
      mode: 'learn',
    });
  });

  it('starts on the coach with an example of the job in the field', () => {
    usePromptToolkitStore.setState({ hasSeenWelcome: false });
    startDemo();
    // The welcome film never hides the demo.
    expect(usePromptToolkitStore.getState().hasSeenWelcome).toBe(true);
    expect(useDemoStore.getState().active).toBe(true);
    expect(usePromptToolkitStore.getState()).toMatchObject({
      mode: 'coach',
      showHome: false,
    });
    expect(setChatInput).toHaveBeenCalledWith(examplePairs('rh')[0].before);
    expect(useDemoStore.getState().notes).toEqual([
      { after: '', step: 'intro' },
    ]);
  });

  it('« Quitter la démo » gives back the user’s text and forgets the demo', () => {
    startDemo();
    stopDemo();
    expect(useDemoStore.getState().active).toBe(false);
    expect(setChatInput).toHaveBeenLastCalledWith('mon brouillon');
    expect(demoThread()).toEqual([]);
    expect(useDemoStore.getState().notes).toEqual([]);
  });

  it('after a button has done its work, Nestor explains it; the ring moves on', () => {
    startDemo();
    const echo = { id: 'u', action: 2, kind: 'user', via: 'action', text: 'x' };
    const chatAt = (messages: unknown[], busy: string | null) =>
      ({ messages, busy }) as unknown as NestorChat;
    const { result, rerender } = renderHook(({ chat }) => useDemoGuide(chat), {
      initialProps: { chat: chatAt([], null) },
    });
    expect(result.current.next).toBe('analyse');
    act(() => result.current.onBar('analyse'));
    rerender({ chat: chatAt([echo], 'analyse') });
    // Still working: nothing explained yet.
    expect(useDemoStore.getState().notes).toHaveLength(1);
    rerender({
      chat: chatAt([echo, { id: 'a', action: 2, kind: 'analysis' }], null),
    });
    // Under the answer, never in the thread: its buttons stay.
    expect(useDemoStore.getState().notes.at(-1)).toEqual({
      after: 'a',
      step: 'analyse',
    });
    expect(demoThread()).toEqual([]);
    expect(result.current.next).toBe('improve');
  });

  it('the ring sits on the next button of the bar', () => {
    const chat = { busy: null, runBar: vi.fn() } as unknown as NestorChat;
    render(<NestorBar chat={chat} highlight="improve" />);
    expect(
      screen.getByRole('button', { name: /Improve my text/ }),
    ).toHaveAttribute('data-next', 'true');
    expect(
      screen.getByRole('button', { name: /Analyse my text/ }),
    ).not.toHaveAttribute('data-next');
  });
});
