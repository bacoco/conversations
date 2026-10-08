export type DiffPart = { kind: 'same' | 'added' | 'removed'; text: string };

/** Above this, the comparison is skipped: it would cost too much. */
const MAX_TOKENS = 1500;

/** Words and the spaces between them, so the text can be rebuilt as is. */
const tokenize = (text: string) => text.match(/\s+|[^\s]+/g) ?? [];

/**
 * Word-level differences between two texts (longest common subsequence).
 * Returns null when the texts are too long to compare.
 */
export const wordDiff = (before: string, after: string): DiffPart[] | null => {
  const a = tokenize(before);
  const b = tokenize(after);
  if (a.length > MAX_TOKENS || b.length > MAX_TOKENS) {
    return null;
  }
  // lengths[i][j]: common length of a[i..] and b[j..].
  const lengths = Array.from({ length: a.length + 1 }, () =>
    new Array<number>(b.length + 1).fill(0),
  );
  for (let i = a.length - 1; i >= 0; i--) {
    for (let j = b.length - 1; j >= 0; j--) {
      lengths[i][j] =
        a[i] === b[j]
          ? lengths[i + 1][j + 1] + 1
          : Math.max(lengths[i + 1][j], lengths[i][j + 1]);
    }
  }

  const parts: DiffPart[] = [];
  const push = (kind: DiffPart['kind'], text: string) => {
    const last = parts[parts.length - 1];
    if (last?.kind === kind) {
      last.text += text;
    } else {
      parts.push({ kind, text });
    }
  };
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      push('same', a[i]);
      i++;
      j++;
    } else if (lengths[i + 1][j] >= lengths[i][j + 1]) {
      push('removed', a[i++]);
    } else {
      push('added', b[j++]);
    }
  }
  while (i < a.length) push('removed', a[i++]);
  while (j < b.length) push('added', b[j++]);
  return parts;
};
