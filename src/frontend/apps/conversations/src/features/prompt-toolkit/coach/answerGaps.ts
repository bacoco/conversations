/**
 * The parts an answer leaves to the user: "[Your name]" and "TO COMPLETE
 * (what to check)". Found and filled without the model, so what the user
 * sends is exactly what they typed.
 */

export interface AnswerGap {
  /** The text in the answer: "[Votre nom]", "À COMPLÉTER (vérifier…)". */
  raw: string;
  /** What to give, in words: "Votre nom", "vérifier l'adresse". */
  label: string;
  /** The sentence it sits in, to recognise it. */
  sentence: string;
  start: number;
  end: number;
}

const GAP =
  /\[([^\]\n]{2,120})\]|(?:À COMPLÉTER|TO COMPLETE)(?:\s*\(([^)\n]{1,160})\)|\s*:\s*([^.\n;]{1,160}))?/g;

/** Where a sentence starts and ends around a position. */
const sentenceAround = (text: string, start: number, end: number) => {
  let from = start;
  while (from > 0 && !/[.!?\n]/.test(text[from - 1])) {
    from -= 1;
  }
  let to = end;
  while (to < text.length && !/[.!?\n]/.test(text[to])) {
    to += 1;
  }
  if (to < text.length && /[.!?]/.test(text[to])) {
    to += 1;
  }
  return { from, to };
};

export const findGaps = (text: string): AnswerGap[] =>
  [...text.matchAll(GAP)].map((match) => {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    const { from, to } = sentenceAround(text, start, end);
    return {
      raw: match[0],
      label: (match[1] ?? match[2] ?? match[3] ?? '').trim(),
      sentence: text.slice(from, to).trim(),
      start,
      end,
    };
  });

const isBracket = (gap: AnswerGap) => gap.raw.startsWith('[');

/** What the user chose for a gap: a value, or "I do not have it". */
export type GapChoice = { value: string } | { drop: true };

/**
 * The answer with each gap filled. A "TO COMPLETE" the user does not have
 * takes its sentence away; a "[name]" they do not have just goes. Gaps not
 * answered yet stay as they are.
 */
export const fillGaps = (
  text: string,
  choices: (GapChoice | undefined)[],
): string => {
  const gaps = findGaps(text);
  // Sentences to drop, by their bounds in the original text.
  const drops = gaps
    .map((gap, index) => ({ gap, choice: choices[index] }))
    .filter(({ gap, choice }) => choice && 'drop' in choice && !isBracket(gap))
    .map(({ gap }) => sentenceAround(text, gap.start, gap.end));
  let result = '';
  let cursor = 0;
  gaps.forEach((gap, index) => {
    const choice = choices[index];
    result += text.slice(cursor, gap.start);
    result +=
      choice && 'value' in choice && choice.value.trim()
        ? choice.value.trim()
        : choice && 'drop' in choice && isBracket(gap)
          ? ''
          : gap.raw;
    cursor = gap.end;
  });
  result += text.slice(cursor);
  if (drops.length === 0) {
    return result.replace(/[ \t]{2,}/g, ' ').replace(/[ \t]+$/gm, '');
  }
  // Drop on the original text, then fill what is left, in one more pass.
  let kept = '';
  let position = 0;
  for (const drop of [...drops].sort((a, b) => a.from - b.from)) {
    if (drop.from < position) {
      continue;
    }
    kept += text.slice(position, drop.from);
    position = drop.to;
  }
  kept += text.slice(position);
  const remaining = gaps
    .map((gap, index) => ({ gap, choice: choices[index] }))
    .filter(
      ({ gap }) =>
        !drops.some((drop) => gap.start >= drop.from && gap.end <= drop.to),
    )
    .map(({ choice }) => choice);
  return fillGaps(
    kept
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
    remaining,
  );
};

/**
 * The answer as text to paste in an email: without the marks of the chat's
 * formatting (bold, titles), its words untouched.
 */
export const plainAnswer = (text: string) =>
  text
    .replace(/\*\*([^*\n]+)\*\*/g, '$1')
    .replace(/__([^_\n]+)__/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/^\s*[-*]\s+/gm, '• ')
    .trim();
