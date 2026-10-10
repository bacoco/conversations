import { create } from 'zustand';

import type { ConversationContextTurn } from '../coach/coachApi';

/**
 * Ephemeral bridge between the main chat and the right panel. It deliberately
 * is not persisted: the current chat remains the source of truth and the
 * panel never replays a message after a reload. The panel only reads it, and
 * sends a message to the assistant when the user explicitly asks to.
 */
interface MainConversationState {
  turns: ConversationContextTurn[];
  /** Set only once the latest assistant message is fully finished. */
  latestCompletedAssistantMessageId: string | null;
  isAssistantResponding: boolean;
  /** Sends a message to the assistant, leaving the user's draft alone. */
  sendQuestion: ((question: string) => void) | null;
  publish: (state: {
    turns: ConversationContextTurn[];
    latestCompletedAssistantMessageId: string | null;
    isAssistantResponding: boolean;
  }) => void;
  clear: () => void;
  registerQuestionSender: (sender: (question: string) => void) => () => void;
}

const initialState = {
  turns: [] as ConversationContextTurn[],
  latestCompletedAssistantMessageId: null,
  isAssistantResponding: false,
  sendQuestion: null,
};

export const useMainConversationStore = create<MainConversationState>()(
  (set, get) => ({
    ...initialState,
    publish: (state) => set(state),
    clear: () =>
      set({
        turns: [],
        latestCompletedAssistantMessageId: null,
        isAssistantResponding: false,
      }),
    registerQuestionSender: (sender) => {
      set({ sendQuestion: sender });
      return () => {
        if (get().sendQuestion === sender) {
          set({ sendQuestion: null });
        }
      };
    },
  }),
);
