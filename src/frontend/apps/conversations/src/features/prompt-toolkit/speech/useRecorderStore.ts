import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { appendText } from './transcribe';

interface RecorderState {
  /** The transcription, or the text pasted by the person. */
  text: string;
  /** When the text last changed, to say how recent it is; 0 when empty. */
  updatedAt: number;
  /** Whose text it is: the signed-in user it was kept for. */
  owner: string;
  /** True once checked against the signed-in user, in this page. */
  isClaimed: boolean;
  setText: (text: string) => void;
  append: (text: string) => void;
  /** The text kept for someone else is dropped, never shown. */
  claim: (userId: string) => void;
}

/**
 * Outside the screen so that leaving it never loses the text: the pieces
 * still being transcribed land here. The text survives a reload of the page
 * but stays in this browser tab only, goes when the tab is closed, and only
 * comes back for the same signed-in user (on a shared computer, the next
 * person never sees it). The audio is never kept.
 */
export const useRecorderStore = create<RecorderState>()(
  persist(
    (set, get) => ({
      text: '',
      updatedAt: 0,
      owner: '',
      isClaimed: false,
      setText: (text) => set({ text, updatedAt: text ? Date.now() : 0 }),
      append: (text) =>
        set((state) => ({
          text: appendText(state.text, text),
          updatedAt: Date.now(),
        })),
      claim: (userId) =>
        set(
          get().owner === userId
            ? { isClaimed: true }
            : { text: '', updatedAt: 0, owner: userId, isClaimed: true },
        ),
    }),
    {
      name: 'nestor-recorder',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        text: state.text,
        updatedAt: state.updatedAt,
        owner: state.owner,
      }),
    },
  ),
);
