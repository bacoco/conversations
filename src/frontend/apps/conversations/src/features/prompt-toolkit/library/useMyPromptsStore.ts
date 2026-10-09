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
  rename: (id: string, title: string) => void;
  /** Adds prompts from an exported file; returns how many were new. */
  importPrompts: (items: { title?: string; prompt: string }[]) => number;
}

/** The file format of "My prompts", to move them to another computer. */
export const MY_PROMPTS_FILE_VERSION = 1;

export const exportMyPrompts = (prompts: MyPrompt[]) =>
  JSON.stringify(
    {
      version: MY_PROMPTS_FILE_VERSION,
      prompts: prompts.map(({ title, prompt }) => ({ title, prompt })),
    },
    null,
    2,
  );

/** Reads an exported file; throws when it is not one. */
export const parseMyPromptsFile = (text: string) => {
  const data = JSON.parse(text) as { prompts?: unknown };
  if (!data || !Array.isArray(data.prompts)) {
    throw new Error('Not a My prompts file');
  }
  return data.prompts
    .map((item) => item as { title?: unknown; prompt?: unknown })
    .filter((item) => typeof item.prompt === 'string' && item.prompt.trim())
    .map((item) => ({
      prompt: String(item.prompt),
      title: typeof item.title === 'string' ? item.title : undefined,
    }));
};

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
      rename: (id, title) => {
        const name = title.trim();
        if (!name) {
          return;
        }
        set((state) => ({
          prompts: state.prompts.map((item) =>
            item.id === id ? { ...item, title: name } : item,
          ),
        }));
      },
      importPrompts: (items) =>
        // Same text already saved: skipped, so importing twice is harmless.
        items.filter((item) => get().save(item.prompt, item.title)).length,
    }),
    { name: 'prompt-my-prompts' },
  ),
);
