import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { JobCase, JobId, casesOf } from '../../jobs/jobs';

/** Cases done: case id → when, in this browser and for this account only. */
export type CasesDone = Record<string, number>;

/**
 * The plan of a week of the programme (« Votre semaine »): chosen the first
 * time the week is shown, then kept all week so that each action can be
 * ticked once it is really done.
 */
export interface WeekPlan {
  /** 1 the calendar week the programme started, then one more each week. */
  week: number;
  jobId: JobId;
  /** When the plan was made (ms): a case done after it is done this week. */
  at: number;
  caseId: string | null;
  /** The course step to do, by its lesson id; null once the course is done. */
  lessonId: string | null;
  /** Cards or questions were due: a review is part of the week. */
  review: boolean;
}

interface CasesState {
  done: CasesDone;
  /** A case asked from elsewhere (the home page): the course opens it. */
  requested: string | null;
  /** « Le cas de la semaine » hidden from the home page by the user. */
  weeklyHidden: boolean;
  setWeeklyHidden: (hidden: boolean) => void;
  /** The days Nestor was used (YYYY-MM-DD, the last 30): « Votre semaine » waits for a few. */
  daysUsed: string[];
  noteDay: (date?: Date) => void;
  /** When the programme was first shown (ms); null: not yet. */
  programmeStart: number | null;
  /** The plan of the week shown last. */
  weekPlan: WeekPlan | null;
  startProgramme: (at: number) => void;
  setWeekPlan: (plan: WeekPlan) => void;
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
      weeklyHidden: false,
      setWeeklyHidden: (weeklyHidden) => set({ weeklyHidden }),
      daysUsed: [],
      noteDay: (date = new Date()) =>
        set((state) => {
          const day = [
            date.getFullYear(),
            String(date.getMonth() + 1).padStart(2, '0'),
            String(date.getDate()).padStart(2, '0'),
          ].join('-');
          return state.daysUsed.includes(day)
            ? state
            : { daysUsed: [...state.daysUsed, day].slice(-30) };
        }),
      programmeStart: null,
      weekPlan: null,
      // Started once: the weeks count from the first time it was shown.
      startProgramme: (at) =>
        set((state) =>
          state.programmeStart === null ? { programmeStart: at } : state,
        ),
      setWeekPlan: (weekPlan) => set({ weekPlan }),
      request: (caseId) => set({ requested: caseId }),
      clearRequest: () => set({ requested: null }),
      markDone: (caseId, at = Date.now()) =>
        set((state) => ({ done: { ...state.done, [caseId]: at } })),
      reset: () => set({ done: {} }),
    }),
    {
      name: 'nestor-cases',
      partialize: (state) => ({
        done: state.done,
        weeklyHidden: state.weeklyHidden,
        daysUsed: state.daysUsed,
        programmeStart: state.programmeStart,
        weekPlan: state.weekPlan,
      }),
    },
  ),
);

/**
 * « Votre semaine » is offered after a few days of use: shown on the very
 * first day, a programme of work would discourage.
 */
export const WEEK_AFTER_DAYS = 3;

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
