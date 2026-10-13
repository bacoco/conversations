import { JobId, caseById } from '../../jobs/jobs';
import {
  ProgressSnapshot,
  Step,
  cardsToReview,
  isStepDone,
  nextStep,
  questionsToReview,
} from '../steps';
import { DAY_MS } from '../useLearnProgressStore';

import { CasesDone, WeekPlan, weeklyCase } from './casesProgress';

export type { WeekPlan };

/** Monday, midnight, of the calendar week of a moment (local time). */
const mondayOf = (at: number) => {
  const date = new Date(at);
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate() - ((date.getDay() + 6) % 7),
  ).getTime();
};

/** Cards and questions due for review at a given moment. */
const dueCount = (steps: Step[], progress: ProgressSnapshot, now: number) =>
  cardsToReview(steps, progress, now).length +
  questionsToReview(steps, progress).length;

/**
 * The week of the programme: 1 the calendar week it started, one more each
 * Monday. Weeks missed are skipped, and it never goes below 1.
 */
export const programmeWeek = (start: number, now: number) =>
  // Rounded: a week with a change of hour is not exactly 7 × 24 hours.
  Math.max(1, 1 + Math.round((mondayOf(now) - mondayOf(start)) / (7 * DAY_MS)));

/**
 * What the week offers: the next case of the job (its levels rise as the
 * cases are done; once all are, one to practise again), the next step of
 * the course, and a review when cards or questions are due.
 */
export const planWeek = (
  week: number,
  jobId: JobId,
  done: CasesDone,
  steps: Step[],
  progress: ProgressSnapshot,
  now: number,
): WeekPlan => ({
  week,
  jobId,
  at: now,
  caseId: weeklyCase(jobId, done, new Date(now))?.id ?? null,
  lessonId: nextStep(steps, progress)?.lesson.id ?? null,
  review: dueCount(steps, progress, now) > 0,
});

/**
 * The plan to show: the one kept while it is this week's and this job's,
 * else a new one. The week never goes back, even with a clock set back.
 */
export const weekPlanFor = ({
  stored,
  start,
  jobId,
  done,
  steps,
  progress,
  now,
}: {
  stored: WeekPlan | null;
  start: number;
  jobId: JobId;
  done: CasesDone;
  steps: Step[];
  progress: ProgressSnapshot;
  now: number;
}): WeekPlan => {
  const week = Math.max(programmeWeek(start, now), stored?.week ?? 1);
  if (stored && stored.week === week && stored.jobId === jobId) {
    return stored;
  }
  return planWeek(week, jobId, done, steps, progress, now);
};

export type WeekActionKind = 'case' | 'lesson' | 'review';

export interface WeekAction {
  kind: WeekActionKind;
  /** The case id, the lesson id, or « review ». */
  id: string;
  isDone: boolean;
}

/**
 * The actions of a week, ticked only once really done: the case finished
 * since the plan was made, the course step completed, nothing left to
 * review.
 */
export const weekActions = (
  plan: WeekPlan,
  done: CasesDone,
  steps: Step[],
  progress: ProgressSnapshot,
  now = Date.now(),
): WeekAction[] => {
  const actions: WeekAction[] = [];
  if (plan.caseId && caseById(plan.caseId)) {
    actions.push({
      kind: 'case',
      id: plan.caseId,
      isDone: (done[plan.caseId] ?? 0) >= plan.at,
    });
  }
  const step = steps.find((item) => item.lesson.id === plan.lessonId);
  if (step) {
    actions.push({
      kind: 'lesson',
      id: step.lesson.id,
      isDone: isStepDone(step, progress),
    });
  }
  if (plan.review) {
    actions.push({
      kind: 'review',
      id: 'review',
      isDone: dueCount(steps, progress, now) === 0,
    });
  }
  return actions;
};
