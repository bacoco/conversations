import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { appendText } from './transcribe';

interface RecorderState {
  /** The transcription, or the text pasted by the person. */
  text: string;
  /** When the text last changed, to say how recent it is; 0 when empty. */
  updatedAt: number;
  setText: (text: string) => void;
  append: (text: string) => void;
}

/**
 * Outside the screen so that leaving it never loses the text: the pieces
 * still being transcribed land here. The text survives a reload of the page
 * but stays in this browser tab only, and goes when the tab is closed; the
 * audio is never kept.
 */
export const useRecorderStore = create<RecorderState>()(
  persist(
    (set) => ({
      text: '',
      updatedAt: 0,
      setText: (text) => set({ text, updatedAt: text ? Date.now() : 0 }),
      append: (text) =>
        set((state) => ({
          text: appendText(state.text, text),
          updatedAt: Date.now(),
        })),
    }),
    {
      name: 'nestor-recorder',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({ text: state.text, updatedAt: state.updatedAt }),
    },
  ),
);
