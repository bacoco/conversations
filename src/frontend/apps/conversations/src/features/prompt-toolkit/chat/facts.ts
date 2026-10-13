/**
 * The figures of a text, checked by the code itself, never by the model:
 * a version must not change them, an answer is compared with them.
 */

/** Figures, an amount written with spaces (« 4 860 ») read as one. */
export const numbersOf = (text: string): string[] =>
  (text.match(/\d+(?:[   ]\d{3})*/g) ?? []).map((figure) =>
    figure.replace(/[   ]/g, ''),
  );

/** A figure of one digit is a form (« 5 lignes »), rarely a fact. */
const isFact = (figure: string) => figure.length > 1;

const unique = (figures: string[]) => [...new Set(figures)];

/**
 * What a version changed in the user's figures: the ones it added (not in
 * the request nor in the advice) and the ones it lost.
 */
export const changedNumbers = (
  draft: string,
  version: string,
  advice: string[],
): { added: string[]; removed: string[] } => {
  const given = new Set([...numbersOf(draft), ...advice.flatMap(numbersOf)]);
  const kept = new Set(numbersOf(version));
  return {
    added: unique(numbersOf(version)).filter(
      (figure) => isFact(figure) && !given.has(figure),
    ),
    removed: unique(numbersOf(draft)).filter(
      (figure) => isFact(figure) && !kept.has(figure),
    ),
  };
};

/** The figures of an answer found nowhere in what the user gave. */
export const unfoundNumbers = (answer: string, sources: string[]): string[] => {
  const given = new Set(sources.flatMap(numbersOf));
  return unique(numbersOf(answer)).filter(
    (figure) => isFact(figure) && !given.has(figure),
  );
};

const plain = (text: string) =>
  text.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();

/**
 * Whether the request itself (above a pasted text) holds the words Nestor
 * advised to add: a note pasted below does not count.
 */
export const requestSays = (field: string, words: string) => {
  const cut = field.indexOf('\n\n');
  const request = cut < 0 ? field : field.slice(0, cut);
  return plain(request).includes(plain(words));
};
