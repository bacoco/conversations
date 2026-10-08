import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MyPrompt {
  id: string;
  title: string;
  prompt: string;
  savedAt: number;
}

/** Keeps the library readable: a title from the first words. */
export const titleFrom = (prompt: string, max = 60) => {
  const firstLine = prompt.trim().split('\n')[0].replace(/\s+/g, ' ');
  return firstLine.length > max ? `${firstLine.slice(0, max - 1)}…` : firstLine;
};

interface MyPromptsState {
  /** The user's own prompts, newest first, kept in this browser only. */
  prompts: MyPrompt[];
  /** Saves a prompt; false when the same text is already saved. */
  save: (prompt: string, title?: string) => boolean;
  remove: (id: string) => void;
}

export const useMyPromptsStore = create<MyPromptsState>()(
  persist(
    (set, get) => ({
      prompts: [],
      save: (prompt, title) => {
        const text = prompt.trim();
        if (!text || get().prompts.some((item) => item.prompt === text)) {
          return false;
        }
        set((state) => ({
          prompts: [
            {
              id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
              title: title?.trim() || titleFrom(text),
              prompt: text,
              savedAt: Date.now(),
            },
            ...state.prompts,
          ],
        }));
        return true;
      },
      remove: (id) =>
        set((state) => ({
          prompts: state.prompts.filter((item) => item.id !== id),
        })),
    }),
    { name: 'prompt-my-prompts' },
  ),
);
