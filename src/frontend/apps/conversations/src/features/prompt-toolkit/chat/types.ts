import type { CoachNote, NextGroup, SessionReview } from '../coach/coachApi';
import type { SensitiveKind } from '../coach/sensitiveData';

import type { Author } from './author';
import type { ExamplePair } from './examples';
import type { RequestAdvice, VersionChoice } from './nestorChatApi';

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
  | 'retry'
  /** After the advice: one text, two versions, or the user's own fix. */
  | 'give-text'
  | 'two-versions'
  | 'fix-myself'
  /** Say it at the microphone instead of clicking. */
  | 'say'
  /** « Vous parlez de quoi ? »: the request, or the Assistant's answer. */
  | 'clarify-request'
  | 'clarify-answer'
  /** « J'ai corrigé »: Nestor looks at the user's own correction. */
  | 'check-fix'
  /** Personal data found before Nestor sends anything. */
  | 'remove-sensitive'
  | 'send-anyway';

export interface Round {
  id: RoundId;
  /** The filled round: what Nestor advises first. */
  primary?: boolean;
}

/** What Nestor says when a bar button has nothing to work on. */
export type HintKind =
  | 'write-first'
  | 'review-after-answer'
  | 'new-request'
  | 'improve-it'
  | 'fix-myself'
  | 'remove-sensitive'
  | 'kept-text';

/** What a piece of advice became: added, ignored, or already done. */
export type TipState = 'added' | 'ignored' | 'known';

/** A step to do again exactly, after a failure. */
export type RetryStep =
  | BarAction
  | { kind: 'choices'; draft: string; count: 1 | 2; tips: string[] }
  | { kind: 'task'; task: string };

/** What waits for the user's word when personal data was found. */
export type Pending = { bar: BarAction } | { ask: true };

/** A line of the grid, said in how many of the session's requests. */
export interface PartProgress {
  part: GridPart;
  said: number;
  total: number;
}

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
    /** « Améliorer mon texte »: Nestor's advice, before any text. */
    | {
        kind: 'counsel';
        draft: string;
        advice: RequestAdvice;
        tipStates?: Record<number, TipState>;
      }
    /** A task of the job: the start of a request and one reflex. */
    | { kind: 'starter'; task: string; request: string; reflex: string }
    /** « J'ai corrigé »: each piece of advice, applied or not. */
    | { kind: 'fixcheck'; tips: string[]; done: boolean[]; message: string }
    /** Personal data: nothing is sent before the user decides. */
    | { kind: 'sensitive'; kinds: SensitiveKind[]; pending: Pending }
    /** The text at the end of the advice: one, or two to choose from. */
    | { kind: 'versions'; draft: string; items: VersionChoice[] }
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
        /** Figures of the answer found nowhere in what the user gave. */
        unfound?: string[];
        /** Who wrote the request: Nestor's own words are never praised. */
        by?: Author;
        answerId: string;
      }
    | { kind: 'suites'; groups: NextGroup[]; answerId: string }
    | {
        kind: 'review';
        review: SessionReview;
        advised: number;
        applied: number;
        answerId: string;
        /** The lines most often said in the session's requests. */
        progress?: PartProgress[];
        /** The last request sent: one to keep in the favorites. */
        favorite?: string;
        /** A case of the user's job, to practise now. */
        caseId?: string;
      }
    | { kind: 'reply'; text: string; prompt?: string }
    | { kind: 'error'; retry: RetryStep }
  );

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

/** A message as posted: the store gives its id and action. */
export type NewMessage = DistributiveOmit<NestorMessage, 'id' | 'action'>;

export type QuestionMessage = Extract<NestorMessage, { kind: 'question' }>;
