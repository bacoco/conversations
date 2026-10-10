/**
 * What the coach can tell from the requests it read, without the model:
 * the habit to work on this week, what changed since last time, the week's
 * recap. Kept in this browser only, like the history it reads.
 */
import type { CoachHistoryEntry } from '../stores/useCoachHistoryStore';

import type { Competency, PromptAnalysis } from './coachApi';

/** A habit is there from this grade. */
export const HABIT_GRADE = 60;
/** The habits the weekly focus can pick: the ones any request may need. */
export const FOCUS_SKILLS: Competency[] = [
  'task',
  'context',
  'audience',
  'format',
  'sources',
  'constraints',
];
/** Judged on a trend, never on one request. */
const RECENT = 5;
const MIN_FOR_FOCUS = 3;
const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** The start of the week (Monday, 0:00, local time) of a moment. */
export const startOfWeek = (time: number) => {
  const date = new Date(time);
  const day = (date.getDay() + 6) % 7;
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - day);
  return date.getTime();
};

/** The share of recent requests where each habit is there. */
const habitShares = (entries: CoachHistoryEntry[]) => {
  const recent = entries.slice(0, RECENT);
  return FOCUS_SKILLS.map((skill) => ({
    skill,
    share:
      recent.filter((entry) => (entry.competencies[skill] ?? 0) >= HABIT_GRADE)
        .length / Math.max(recent.length, 1),
  }));
};

/**
 * The one habit to work on: the least present in the last requests. None
 * before a few requests, nor when every habit is mostly there.
 */
export const weeklyFocus = (entries: CoachHistoryEntry[]) => {
  if (entries.length < MIN_FOR_FOCUS) {
    return null;
  }
  const [weakest] = habitShares(entries).sort((a, b) => a.share - b.share);
  return weakest && weakest.share < 0.6 ? weakest.skill : null;
};

/**
 * "Last time, the format was not there; this time it is." Compared with the
 * request read just before, only for a habit that came back.
 */
export const comebackSkill = (
  previous: CoachHistoryEntry | undefined,
  current: PromptAnalysis,
): Competency | null => {
  if (!previous) {
    return null;
  }
  return (
    FOCUS_SKILLS.find(
      (skill) =>
        (previous.competencies[skill] ?? 0) < HABIT_GRADE &&
        (current.competencies[skill] ?? 0) >= HABIT_GRADE,
    ) ?? null
  );
};

/**
 * Requests per conversation: a request at rank 1 starts a conversation.
 * Older entries without a rank are left out.
 */
export const requestsPerConversation = (entries: CoachHistoryEntry[]) => {
  const ranked = [...entries]
    .filter((entry) => entry.turn !== undefined)
    .sort((a, b) => a.sentAt - b.sentAt);
  const sizes: number[] = [];
  for (const entry of ranked) {
    if (entry.turn === 1 || sizes.length === 0) {
      sizes.push(1);
    } else {
      sizes[sizes.length - 1] += 1;
    }
  }
  return sizes.length
    ? Math.round(
        (sizes.reduce((sum, size) => sum + size, 0) / sizes.length) * 10,
      ) / 10
    : null;
};

export interface WeekRecap {
  count: number;
  /** The clearest request of the week. */
  best: CoachHistoryEntry | null;
  /** The habit that grew most compared with the week before. */
  growing: Competency | null;
  /** Habits present in every request of the week, for the first time. */
  allBricks: boolean;
  perConversation: number | null;
  perConversationBefore: number | null;
}

/** This week's requests, the record, what grew, and the round trips. */
export const weekRecap = (
  entries: CoachHistoryEntry[],
  now = Date.now(),
): WeekRecap => {
  const start = startOfWeek(now);
  const thisWeek = entries.filter((entry) => entry.sentAt >= start);
  const before = entries.filter(
    (entry) => entry.sentAt < start && entry.sentAt >= start - WEEK_MS,
  );
  const share = (list: CoachHistoryEntry[], skill: Competency) =>
    list.filter((entry) => (entry.competencies[skill] ?? 0) >= HABIT_GRADE)
      .length / Math.max(list.length, 1);
  const growth = FOCUS_SKILLS.map((skill) => ({
    skill,
    delta: share(thisWeek, skill) - share(before, skill),
  })).sort((a, b) => b.delta - a.delta)[0];
  const best =
    [...thisWeek].sort((a, b) => b.score - a.score || b.sentAt - a.sentAt)[0] ??
    null;
  return {
    count: thisWeek.length,
    best,
    growing:
      before.length > 0 && growth && growth.delta > 0 ? growth.skill : null,
    allBricks:
      best !== null &&
      FOCUS_SKILLS.every(
        (skill) => (best.competencies[skill] ?? 0) >= HABIT_GRADE,
      ),
    perConversation: requestsPerConversation(thisWeek),
    perConversationBefore: requestsPerConversation(before),
  };
};
