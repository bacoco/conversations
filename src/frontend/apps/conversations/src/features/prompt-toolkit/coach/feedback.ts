/**
 * User feedback on the coach (thumbs up/down). Nothing is sent over the
 * network yet: the panel dispatches a DOM event that a deployment can forward
 * to its own endpoint, e.g.
 *
 *   window.addEventListener(COACH_FEEDBACK_EVENT, (event) =>
 *     fetch('/api/…', { method: 'POST', body: JSON.stringify(event.detail) }),
 *   );
 */
export const COACH_FEEDBACK_EVENT = 'prompt-coach-feedback';

export interface CoachFeedback {
  /** What is being rated: the grade and advice, a rewrite, or a session review. */
  target: 'analysis' | 'improvement' | 'session' | 'generation';
  rating: 'positive' | 'negative';
  /** The grade shown when the feedback was given, for context. */
  score?: number;
}

export const sendCoachFeedback = (feedback: CoachFeedback) => {
  window.dispatchEvent(
    new CustomEvent<CoachFeedback>(COACH_FEEDBACK_EVENT, { detail: feedback }),
  );
};
