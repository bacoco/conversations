import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Competency, RequestKind } from '../coach/coachApi';

/** Enough for a few weeks of progress, not a prompt archive. */
export const HISTORY_MAX_ENTRIES = 60;

/** Grades only: not a word of the request is ever kept. */
export interface CoachHistoryEntry {
  score: number;
  competencies: Record<Competency, number>;
  sentAt: number;
  kind?: RequestKind;
  /** The rank of this request in its conversation: 1 for the first. */
  turn?: number;
}

interface CoachHistoryState {
  entries: CoachHistoryEntry[];
  /** `request` is what was graded; it is never stored. */
  record: (
    request: string,
    score: number,
    competencies: Record<Competency, number>,
    details?: { kind?: RequestKind; turn?: number },
  ) => void;
  clear: () => void;
}

/** Grades of the last prompts sent, newest first, kept in this browser only. */
export const useCoachHistoryStore = create<CoachHistoryState>()(
  persist(
    (set) => ({
      entries: [],
      record: (_request, score, competencies, details) =>
        set((state) => ({
          entries: [
            { score, competencies, sentAt: Date.now(), ...details },
            ...state.entries,
          ].slice(0, HISTORY_MAX_ENTRIES),
        })),
      clear: () => set({ entries: [] }),
    }),
    {
      name: 'prompt-coach-history',
      // v1: the 80-character excerpt of each request is gone, also from the
      // entries kept by an older version.
      version: 1,
      migrate: (persisted) => {
        const stored = (persisted ?? {}) as {
          entries?: (CoachHistoryEntry & { excerpt?: string })[];
        };
        return {
          entries: (stored.entries ?? []).map(
            ({ excerpt: _excerpt, ...entry }) => entry,
          ),
        } as CoachHistoryState;
      },
    },
  ),
);
