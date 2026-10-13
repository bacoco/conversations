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
