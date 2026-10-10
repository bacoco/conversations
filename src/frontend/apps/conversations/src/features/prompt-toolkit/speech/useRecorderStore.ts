import { create } from 'zustand';

import { appendText } from './transcribe';

interface RecorderState {
  /** The transcription, or the text pasted by the person. */
  text: string;
  setText: (text: string) => void;
  append: (text: string) => void;
}

/**
 * Outside the screen so that leaving it never loses the text: the pieces
 * still being transcribed land here. Kept in memory only, like the audio.
 */
export const useRecorderStore = create<RecorderState>()((set) => ({
  text: '',
  setText: (text) => set({ text }),
  append: (text) => set((state) => ({ text: appendText(state.text, text) })),
}));
