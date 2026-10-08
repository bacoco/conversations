import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Competency } from '../coach/coachApi';

/** Small on purpose: enough to show progress, not a prompt archive. */
export const HISTORY_MAX_ENTRIES = 10;
export const HISTORY_EXCERPT_LENGTH = 80;

export interface CoachHistoryEntry {
  excerpt: string;
  score: number;
  competencies: Record<Competency, number>;
  sentAt: number;
}

interface CoachHistoryState {
  entries: CoachHistoryEntry[];
  record: (
    prompt: string,
    score: number,
    competencies: Record<Competency, number>,
  ) => void;
  clear: () => void;
}

export const toExcerpt = (prompt: string) => {
  const flat = prompt.replace(/\s+/g, ' ').trim();
  return flat.length > HISTORY_EXCERPT_LENGTH
    ? `${flat.slice(0, HISTORY_EXCERPT_LENGTH - 1)}…`
    : flat;
};

/** Grades of the last prompts sent, newest first, kept in this browser only. */
export const useCoachHistoryStore = create<CoachHistoryState>()(
  persist(
    (set) => ({
      entries: [],
      record: (prompt, score, competencies) =>
        set((state) => ({
          entries: [
            {
              excerpt: toExcerpt(prompt),
              score,
              competencies,
              sentAt: Date.now(),
            },
            ...state.entries,
          ].slice(0, HISTORY_MAX_ENTRIES),
        })),
      clear: () => set({ entries: [] }),
    }),
    { name: 'prompt-coach-history' },
  ),
);
