import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { CoachFollowUp, CoachNote, CoachReply } from '../coach/coachApi';

/** A question asked with a button under a note, and Nestor's reply. */
export interface CoachThreadReply extends CoachReply {
  ask: CoachFollowUp;
}

export interface CoachThreadEntry extends CoachNote {
  id: string;
  replies: CoachThreadReply[];
}

interface CoachThread {
  entries: CoachThreadEntry[];
  updatedAt: number;
}

/** A working day of conversations, not an archive. */
export const THREAD_MAX_CONVERSATIONS = 20;
export const THREAD_MAX_ENTRIES = 15;

interface CoachThreadState {
  threads: Record<string, CoachThread>;
  addNote: (conversationId: string, note: CoachNote) => void;
  addReply: (
    conversationId: string,
    entryId: string,
    reply: CoachThreadReply,
  ) => void;
  clear: (conversationId: string) => void;
}

const EMPTY: CoachThreadEntry[] = [];

/** The coach's notes on one conversation, oldest first. */
export const threadOf = (
  threads: Record<string, CoachThread>,
  conversationId: string | undefined,
) => (conversationId ? (threads[conversationId]?.entries ?? EMPTY) : EMPTY);

const keepRecent = (threads: Record<string, CoachThread>) =>
  Object.fromEntries(
    Object.entries(threads)
      .sort(([, a], [, b]) => b.updatedAt - a.updatedAt)
      .slice(0, THREAD_MAX_CONVERSATIONS),
  );

/**
 * The coach's thread, by conversation. It lives in this tab only
 * (sessionStorage): it survives a reload, not a shared computer.
 */
export const useCoachThreadStore = create<CoachThreadState>()(
  persist(
    (set) => ({
      threads: {},
      addNote: (conversationId, note) =>
        set((state) => ({
          threads: keepRecent({
            ...state.threads,
            [conversationId]: {
              entries: [
                ...threadOf(state.threads, conversationId),
                {
                  ...note,
                  id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
                  replies: [],
                },
              ].slice(-THREAD_MAX_ENTRIES),
              updatedAt: Date.now(),
            },
          }),
        })),
      addReply: (conversationId, entryId, reply) =>
        set((state) => {
          const entries = threadOf(state.threads, conversationId);
          if (!entries.some((entry) => entry.id === entryId)) {
            return state;
          }
          return {
            threads: {
              ...state.threads,
              [conversationId]: {
                entries: entries.map((entry) =>
                  entry.id === entryId
                    ? { ...entry, replies: [...entry.replies, reply] }
                    : entry,
                ),
                updatedAt: Date.now(),
              },
            },
          };
        }),
      clear: (conversationId) =>
        set((state) => {
          const threads = { ...state.threads };
          delete threads[conversationId];
          return { threads };
        }),
    }),
    {
      name: 'nestor-coach-thread',
      storage: createJSONStorage(() => sessionStorage),
    },
  ),
);
