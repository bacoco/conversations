import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Competency, RequestKind } from '../coach/coachApi';

/** Enough for a few weeks of progress, not a prompt archive. */
export const HISTORY_MAX_ENTRIES = 60;
export const HISTORY_EXCERPT_LENGTH = 80;

export interface CoachHistoryEntry {
  excerpt: string;
  score: number;
  competencies: Record<Competency, number>;
  sentAt: number;
  kind?: RequestKind;
  /** The rank of this request in its conversation: 1 for the first. */
  turn?: number;
}

interface CoachHistoryState {
  entries: CoachHistoryEntry[];
  record: (
    prompt: string,
    score: number,
    competencies: Record<Competency, number>,
    details?: { kind?: RequestKind; turn?: number },
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
      record: (prompt, score, competencies, details) =>
        set((state) => ({
          entries: [
            {
              excerpt: toExcerpt(prompt),
              score,
              competencies,
              sentAt: Date.now(),
              ...details,
            },
            ...state.entries,
          ].slice(0, HISTORY_MAX_ENTRIES),
        })),
      clear: () => set({ entries: [] }),
    }),
    { name: 'prompt-coach-history' },
  ),
);
