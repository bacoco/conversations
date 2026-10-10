/** Prompting course content: lessons, quiz and flashcards. */

import type { Competency } from '../coach/coachApi';

// --- Slide types ---

export interface SlideExample {
  bad?: string;
  good?: string;
  note?: string;
}

/** A piece of a request, named after the brick it is (task, context…). */
export interface PromptPart {
  text: string;
  /** The brick this piece is; none for linking words. */
  label?: string;
}

/**
 * How a screen of a lesson works:
 * - text: read (the default);
 * - choose: a problem first, which of two requests gets the better answer,
 *   then the two answers and why;
 * - annotated: a worked example, a request with each brick named;
 * - fill: the same kind of request with one brick hidden, to complete;
 * - bricks: the five bricks of a request, as a picture.
 */
export type SlideKind = 'text' | 'choose' | 'annotated' | 'fill' | 'bricks';

export interface Slide {
  kind?: SlideKind;
  title: string;
  /** The text of the screen; for a problem, the situation. */
  content: string;
  icon: string;
  example?: SlideExample;
  keyTakeaway?: string;
  /** The competency this screen teaches, to come back to it from the coach. */
  skill?: Competency;
  /** choose: two requests for the same need, and what each one gets. */
  choices?: { prompt: string; answer: string }[];
  /** choose: the better request. */
  better?: number;
  /** choose: "what makes it better?", one or more right reasons. */
  reasons?: { label: string; isRight: boolean }[];
  /** annotated, fill: the request cut into its bricks. */
  parts?: PromptPart[];
  /** fill: the hidden part, and the pieces offered to complete it. */
  blank?: number;
  options?: string[];
}

export interface Lesson {
  id: string;
  /** What the learner will be able to do, as a goal. */
  title: string;
  icon: string;
  /** The competencies this lesson teaches. */
  skills?: Competency[];
  slides: Slide[];
}

// --- Quiz types ---

/**
 * - mcq: one answer among a few;
 * - true-false;
 * - best: the better of two requests;
 * - missing: the brick missing from a request;
 * - cloze: the right piece for the gap in a request;
 * - spot: the invented sentence in an answer of the AI;
 * - order: the pieces of a request, to put back in order;
 * - sort: what helps the AI and what does not.
 */
export type QuizType =
  | 'mcq'
  | 'true-false'
  | 'best'
  | 'missing'
  | 'cloze'
  | 'spot'
  | 'order'
  | 'sort';

export interface QuizQuestion {
  id: string;
  lessonId: string;
  type: QuizType;
  question: string;
  /** missing, cloze: the request; spot: what was asked of the AI. */
  prompt?: string;
  /** mcq, best, missing, cloze, spot: the choices */
  options?: string[];
  /** The right choice (0-based) */
  correctIndex?: number;
  /** True/false correct answer */
  correctAnswer?: boolean;
  /** order: the pieces, in the right order (shown shuffled). */
  pieces?: string[];
  /** sort: each item, and whether it helps the AI. */
  items?: { text: string; helps: boolean }[];
  /** A question that puts the learner on the way, never the answer. */
  hint?: string;
  /** Asked in the level test: one per lesson. */
  placement?: boolean;
  explanation: string;
}

export interface Flashcard {
  id: string;
  lessonId: string;
  front: string;
  back: string;
}

export interface CourseContent {
  lessons: Lesson[];
  quiz: QuizQuestion[];
  flashcards: Flashcard[];
}
