import type { CoachNote, NextGroup, SessionReview } from '../coach/coachApi';

/** One piece of information the request lacks, asked as one question. */
export interface MissingItem {
  /** 1 to 3 words, no article: "équipe", "date", "salle". */
  short: string;
  question: string;
  /** Up to 3 likely answers; none when only the user can know. */
  choices: string[];
}

/** What Nestor reads in a request ("Analyser mon texte"). */
export interface RequestCheck {
  /** What the request already gives, 1 to 3 words each. */
  present: string[];
  /** At most QUESTIONS_MAX, the most useful first. */
  missing: MissingItem[];
  /** One or two plain sentences, quoting the user's words. */
  message: string;
}

export const QUESTIONS_MAX = 3;

/** The four buttons of the bar, in their order. */
export const BAR_ACTIONS = ['analyse', 'improve', 'review', 'ask'] as const;
export type BarAction = (typeof BAR_ACTIONS)[number];

/** The rounds of the moment, under Nestor's last message. */
export type RoundId =
  | 'examples'
  | 'complete'
  | 'create-without'
  | 'redo-with-missing'
  | 'shorter'
  | 'other-version'
  | 'undo'
  | 'resume-questions'
  | 'new-request'
  | 'lesson'
  | 'retry';

export interface Round {
  id: RoundId;
  /** The filled round: what Nestor advises first. */
  primary?: boolean;
}

/** What Nestor says when a bar button has nothing to work on. */
export type HintKind = 'write-first' | 'review-after-answer' | 'new-request';

/** How the user said something in the thread. */
export type UserVia = 'choice' | 'voice' | 'keyboard' | 'skip' | 'stop';

interface Base {
  id: string;
  /** The user action this message belongs to: older ones fold. */
  action: number;
  rounds?: Round[];
}

export type NestorMessage = Base &
  (
    | { kind: 'request'; n: number; at: number }
    | { kind: 'pistes'; phrases: string[] }
    | { kind: 'chosen'; text: string; previous: string; undone?: boolean }
    | { kind: 'hint'; hint: HintKind }
    | { kind: 'warning'; text: string }
    | { kind: 'analysis'; draft: string; check: RequestCheck }
    | { kind: 'question'; index: number; items: MissingItem[] }
    | {
        kind: 'user';
        text: string;
        via: UserVia;
        /** The question message this answers, if any. */
        answers?: string;
      }
    | { kind: 'version'; original: string; version: string; missing: string[] }
    | { kind: 'placed'; previous: string; undone?: boolean }
    | { kind: 'advice'; note: CoachNote; missing: string[]; answerId: string }
    | { kind: 'suites'; groups: NextGroup[]; answerId: string }
    | {
        kind: 'review';
        review: SessionReview;
        advised: number;
        applied: number;
        answerId: string;
      }
    | { kind: 'reply'; text: string; prompt?: string }
    | { kind: 'error'; retry: BarAction }
  );

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

/** A message as posted: the store gives its id and action. */
export type NewMessage = DistributiveOmit<NestorMessage, 'id' | 'action'>;

export type QuestionMessage = Extract<NestorMessage, { kind: 'question' }>;
