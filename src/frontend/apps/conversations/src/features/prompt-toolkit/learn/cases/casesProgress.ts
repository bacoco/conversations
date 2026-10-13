import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { JobCase, JobId, casesOf } from '../../jobs/jobs';

/** Cases done: case id → when, in this browser and for this account only. */
export type CasesDone = Record<string, number>;

interface CasesState {
  done: CasesDone;
  /** A case asked from elsewhere (the home page): the course opens it. */
  requested: string | null;
  markDone: (caseId: string, at?: number) => void;
  request: (caseId: string) => void;
  clearRequest: () => void;
  reset: () => void;
}

export const useCasesStore = create<CasesState>()(
  persist(
    (set) => ({
      done: {},
      requested: null,
      request: (caseId) => set({ requested: caseId }),
      clearRequest: () => set({ requested: null }),
      markDone: (caseId, at = Date.now()) =>
        set((state) => ({ done: { ...state.done, [caseId]: at } })),
      reset: () => set({ done: {} }),
    }),
    { name: 'nestor-cases', partialize: (state) => ({ done: state.done }) },
  ),
);

/** Level 1 is open; a level opens once a case of the level below is done. */
export const isUnlocked = (jobId: JobId, level: number, done: CasesDone) =>
  level <= 1 ||
  casesOf(jobId).some((item) => item.level === level - 1 && done[item.id]);

/** The first case not done yet whose level is open; null when all are. */
export const nextCase = (jobId: JobId, done: CasesDone): JobCase | null =>
  casesOf(jobId).find(
    (item) => !done[item.id] && isUnlocked(jobId, item.level, done),
  ) ?? null;

/** The week of the year, to change the case to practise again each week. */
const weekNumber = (now: Date) => {
  const start = new Date(now.getFullYear(), 0, 1);
  return Math.floor((now.getTime() - start.getTime()) / (7 * 24 * 3600 * 1000));
};

/**
 * The case of the week: the next one to do; once all are done, one of
 * them to practise again, a different one each week.
 */
export const weeklyCase = (
  jobId: JobId,
  done: CasesDone,
  now = new Date(),
): JobCase | null => {
  const next = nextCase(jobId, done);
  if (next) {
    return next;
  }
  const cases = casesOf(jobId);
  return cases.length ? cases[weekNumber(now) % cases.length] : null;
};
