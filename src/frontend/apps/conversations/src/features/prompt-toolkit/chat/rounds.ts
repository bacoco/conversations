import type { Round, RoundId } from './types';

export const ROUNDS_MAX = 3;

/** Rounds still useful until done: kept under each new message. */
export const STICKY_ROUNDS: readonly RoundId[] = [
  'redo-with-missing',
  'resume-questions',
];

/**
 * The rounds under a new message: the still useful ones first (a global
 * action never consumes them), then the new ones, each once, three at most.
 */
export const carryOver = (pending: Round[], next: Round[]): Round[] => {
  const kept = pending.filter((round) => STICKY_ROUNDS.includes(round.id));
  const rounds: Round[] = [];
  for (const round of [...kept, ...next]) {
    const index = rounds.findIndex((item) => item.id === round.id);
    if (index === -1) {
      rounds.push(round);
    } else if (round.primary) {
      rounds[index] = { ...rounds[index], primary: true };
    }
  }
  return rounds.slice(0, ROUNDS_MAX);
};
