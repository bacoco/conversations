/**
 * Minutes, decisions, summary or translation written right in the panel,
 * through the same Albert relay as the coach.
 */

import {
  COACH_COMPLETIONS_URL,
  CoachError,
  FILL_MODEL,
} from '../coach/coachApi';

/** A meeting of an hour gives long minutes: leave room, but not forever. */
const MAX_TOKENS = 3000;
const TIMEOUT_MS = 120000;

export const generateFromText = async (
  prompt: string,
  signal?: AbortSignal,
): Promise<string> => {
  const timeout = AbortSignal.timeout(TIMEOUT_MS);
  const response = await fetch(COACH_COMPLETIONS_URL, {
    method: 'POST',
    credentials: 'include',
    signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: FILL_MODEL,
      temperature: 0.2,
      max_tokens: MAX_TOKENS,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!response.ok) {
    throw new CoachError('Generation failed', response.status);
  }
  const data = (await response.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  return (data.choices?.[0]?.message?.content ?? '').trim();
};
