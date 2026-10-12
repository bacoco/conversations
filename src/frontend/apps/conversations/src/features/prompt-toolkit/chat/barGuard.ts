import type { BarAction, HintKind } from './types';

export interface BarContext {
  /** The text of the Assistant's field. */
  draft: string;
  /** A finished answer of the Assistant exists. */
  hasAnswer: boolean;
  /** The latest review already covers the latest answer. */
  reviewUpToDate: boolean;
  /** Nestor's questions wait for an answer. */
  questionsOpen: boolean;
}

export type BarDecision =
  | { kind: 'run'; resumeQuestions: boolean }
  | { kind: 'hint'; hint: HintKind; focusField: boolean }
  | { kind: 'reshow-review' };

/**
 * The bar is never greyed: a button with nothing to work on answers in the
 * thread instead of calling the AI.
 */
export const decideBarAction = (
  action: BarAction,
  context: BarContext,
): BarDecision => {
  if (action === 'ask') {
    return { kind: 'run', resumeQuestions: false };
  }
  if (action === 'review') {
    if (!context.hasAnswer) {
      return { kind: 'hint', hint: 'review-after-answer', focusField: false };
    }
    if (context.reviewUpToDate) {
      return { kind: 'reshow-review' };
    }
    return { kind: 'run', resumeQuestions: context.questionsOpen };
  }
  if (!context.draft.trim()) {
    return { kind: 'hint', hint: 'write-first', focusField: true };
  }
  // A new analysis asks its own questions: the old ones are over.
  return {
    kind: 'run',
    resumeQuestions: action === 'improve' && context.questionsOpen,
  };
};
