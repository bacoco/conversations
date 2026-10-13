import type { NestorMessage } from './types';

/** Who wrote a request sent to the Assistant. */
export type Author = 'user' | 'nestor' | 'both';

const plain = (text: string) =>
  text.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();

/**
 * Nestor's text as he gave it, Nestor's text the user added to, or the
 * user's own words. `nestorTexts`: what Nestor put in the field (examples,
 * ideas, versions). A comparison of whole texts, never of words.
 */
export const authorOf = (sent: string, nestorTexts: string[]): Author => {
  const text = plain(sent);
  const given = nestorTexts.map(plain).filter(Boolean);
  if (given.some((item) => item === text)) {
    return 'nestor';
  }
  if (given.some((item) => text.includes(item))) {
    return 'both';
  }
  return 'user';
};

/**
 * Every text Nestor offered in the thread, to send as it is: ideas, ways to
 * go on, versions, starters, the advice's next request.
 */
export const nestorWrote = (messages: NestorMessage[]): string[] =>
  messages.flatMap((message) => {
    switch (message.kind) {
      case 'chosen':
        return [message.text];
      case 'version':
        return [message.version];
      case 'versions':
        return message.items.map((item) => item.text);
      case 'starter':
        return [message.request];
      case 'pistes':
        return message.phrases;
      case 'suites':
        return message.groups.flatMap((group) => group.questions);
      case 'advice':
        return message.note.prompt ? [message.note.prompt] : [];
      default:
        return [];
    }
  });
