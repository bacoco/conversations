import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface MyStyleState {
  /** The user's writing style, in a few lines, kept in this browser only. */
  style: string;
  setStyle: (style: string) => void;
}

export const useMyStyleStore = create<MyStyleState>()(
  persist(
    (set) => ({
      style: '',
      setStyle: (style) => set({ style: style.trim() }),
    }),
    { name: 'prompt-my-style' },
  ),
);
