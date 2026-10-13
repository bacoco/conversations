import type { CoachNote, NextGroup, SessionReview } from '../coach/coachApi';

import type { Author } from './author';
import type { ExamplePair } from './examples';

/** One piece of information the request lacks, asked as one question. */
export interface MissingItem {
  /** 1 to 3 words, no article: "équipe", "date", "salle". */
  short: string;
  question: string;
  /** Up to 3 likely answers; none when only the user can know. */
  choices: string[];
  /** A fact (a rule, a date, a name…): never a ready answer, only the user's. */
  fact?: boolean;
  /** A yes-or-no on the user's own case: « Oui » / « Non », nothing invented. */
  yesno?: boolean;
  /** The line of the grid this question fills, when it fills one. */
  part?: GridPart;
}

/** The five lines every request is read with: its « grammar ». */
export const GRID_PARTS = [
  'task',
  'reader',
  'material',
  'form',
  'tone',
] as const;
export type GridPart = (typeof GRID_PARTS)[number];

/** One line of the grid: the user's own words for it, or '' (not said). */
export interface GridLine {
  part: GridPart;
  words: string;
}

/** What Nestor reads in a request ("Analyser mon texte"). */
export interface RequestCheck {
  /** What the request already gives, 1 to 3 words each. */
  present: string[];
  /** The five lines, read in the user's own words. */
  grid: GridLine[];
  /** At most QUESTIONS_MAX, the most useful first. */
  missing: MissingItem[];
  /** One or two plain sentences, quoting the user's words. */
  message: string;
}

export const QUESTIONS_MAX = 4;

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
export type HintKind =
  'write-first' | 'review-after-answer' | 'new-request' | 'improve-it';

/** How the user said something in the thread. */
export type UserVia =
  | 'choice'
  | 'voice'
  | 'keyboard'
  | 'skip'
  | 'stop'
  /** A button clicked (bar or round), shown on the user's side. */
  | 'action';

interface Base {
  id: string;
  /** The user action this message belongs to: older ones fold. */
  action: number;
  rounds?: Round[];
}

export type NestorMessage = Base &
  (
    | { kind: 'request'; n: number; at: number; by?: Author }
    | { kind: 'examples'; pairs: ExamplePair[] }
    | {
        kind: 'pistes';
        phrases: string[];
        /** "Voir des exemples": everyday requests, not ideas from the text. */
        examples?: boolean;
      }
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
    | {
        kind: 'version';
        original: string;
        version: string;
        missing: string[];
        /** What the user can write themselves next time. */
        lesson?: string;
        /** The version's words for each line of the grid. */
        parts?: GridLine[];
        /** It applies a rule: to have checked before sending. */
        rule?: boolean;
      }
    | { kind: 'placed'; previous: string; undone?: boolean }
    | {
        kind: 'advice';
        note: CoachNote;
        missing: string[];
        /** Blanks left in the answer: the advice warns first. */
        gaps?: string[];
        answerId: string;
      }
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
