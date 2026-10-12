import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { NestorMessage, NewMessage, Round } from '../chat/types';

/** The thread before the conversation exists; it moves to it once sent. */
export const NEW_CHAT_KEY = 'new';
/** A working day of conversations, not an archive. */
export const CHAT_MAX_CONVERSATIONS = 20;
export const CHAT_MAX_MESSAGES = 120;

interface NestorChat {
  messages: NestorMessage[];
  action: number;
  updatedAt: number;
}

interface NestorChatState {
  chats: Record<string, NestorChat>;
  /** A new user action: what came before folds into one line. */
  beginAction: (key: string) => void;
  /** Adds a message; the rounds of earlier messages go away. */
  post: (key: string, message: NewMessage) => string;
  /** A round was clicked: the rounds of that message go away. */
  consumeRounds: (key: string, messageId: string) => void;
  /** "Annuler": the event stays in the thread, marked undone. */
  markUndone: (key: string, messageId: string) => void;
  /** The thread written before the conversation existed moves to it. */
  adopt: (from: string, to: string) => void;
  clear: (key: string) => void;
}

const EMPTY: NestorMessage[] = [];
const EMPTY_ROUNDS: Round[] = [];

export const messagesOf = (
  chats: Record<string, NestorChat>,
  key: string,
): NestorMessage[] => chats[key]?.messages ?? EMPTY;

export const actionOf = (chats: Record<string, NestorChat>, key: string) =>
  chats[key]?.action ?? 0;

/** The rounds waiting under the latest message, if any. */
export const pendingRounds = (messages: NestorMessage[]): Round[] =>
  messages.at(-1)?.rounds ?? EMPTY_ROUNDS;

const newId = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;

const keepRecent = (chats: Record<string, NestorChat>) =>
  Object.fromEntries(
    Object.entries(chats)
      .sort(([, a], [, b]) => b.updatedAt - a.updatedAt)
      .slice(0, CHAT_MAX_CONVERSATIONS),
  );

const withChat = (
  chats: Record<string, NestorChat>,
  key: string,
  change: (chat: NestorChat) => Omit<NestorChat, 'updatedAt'>,
) =>
  keepRecent({
    ...chats,
    [key]: {
      ...change(chats[key] ?? { messages: [], action: 0, updatedAt: 0 }),
      updatedAt: Date.now(),
    },
  });

const withoutRounds = (message: NestorMessage): NestorMessage => {
  if (!message.rounds) {
    return message;
  }
  const { rounds: _rounds, ...rest } = message;
  return rest;
};

/**
 * Nestor's thread, by conversation. It lives in this tab only
 * (sessionStorage): it survives a reload, not a shared computer.
 */
export const useNestorChatStore = create<NestorChatState>()(
  persist(
    (set) => ({
      chats: {},
      beginAction: (key) =>
        set((state) => ({
          chats: withChat(state.chats, key, (chat) => ({
            ...chat,
            action: chat.action + 1,
          })),
        })),
      post: (key, message) => {
        const id = newId();
        set((state) => ({
          chats: withChat(state.chats, key, (chat) => ({
            action: chat.action,
            messages: [
              ...chat.messages.map(withoutRounds),
              { ...message, id, action: chat.action },
            ].slice(-CHAT_MAX_MESSAGES),
          })),
        }));
        return id;
      },
      consumeRounds: (key, messageId) =>
        set((state) => ({
          chats: withChat(state.chats, key, (chat) => ({
            ...chat,
            messages: chat.messages.map((message) =>
              message.id === messageId ? withoutRounds(message) : message,
            ),
          })),
        })),
      markUndone: (key, messageId) =>
        set((state) => ({
          chats: withChat(state.chats, key, (chat) => ({
            ...chat,
            messages: chat.messages.map((message) =>
              message.id === messageId &&
              (message.kind === 'placed' || message.kind === 'chosen')
                ? { ...message, undone: true }
                : message,
            ),
          })),
        })),
      adopt: (from, to) =>
        set((state) => {
          const source = state.chats[from];
          if (!source?.messages.length || state.chats[to]?.messages.length) {
            return state;
          }
          const chats = { ...state.chats, [to]: source };
          delete chats[from];
          return { chats };
        }),
      clear: (key) =>
        set((state) => {
          const chats = { ...state.chats };
          delete chats[key];
          return { chats };
        }),
    }),
    {
      name: 'nestor-chat',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
