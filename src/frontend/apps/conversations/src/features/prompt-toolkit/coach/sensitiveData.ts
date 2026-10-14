/**
 * Local, instant detection of personal data in a prompt. Nothing leaves the
 * browser: the point is to warn before the prompt is sent to any model.
 */
export type SensitiveKind =
  'email' | 'phone' | 'nir' | 'iban' | 'card' | 'siren';

const PATTERNS: Record<SensitiveKind, RegExp> = {
  email: /[\w.+-]+@[\w-]+\.[\w.-]+/,
  // French phone numbers: 06 12 34 56 78, +33 6 12 34 56 78, 0612345678
  phone: /(?:\+33\s?|0)[1-9](?:[\s.-]?\d{2}){4}\b/,
  // French social security number (NIR): 15 digits starting with 1 or 2
  nir: /\b[12]\s?\d{2}\s?(?:0[1-9]|1[0-2])\s?(?:\d{2}|2[AB])\s?\d{3}\s?\d{3}\s?\d{2}\b/i,
  iban: /\b[A-Z]{2}\d{2}(?:\s?[A-Z0-9]{4}){3,7}(?:\s?[A-Z0-9]{1,3})?\b/,
  card: /\b(?:\d{4}[\s-]?){3}\d{4}\b/,
  // A company number: nine digits, kept only when its check digit is right.
  siren: /\b\d{3}\s?\d{3}\s?\d{3}\b/g,
};

/** The Luhn check digit of a SIREN: nine digits taken at random fail it. */
const luhn = (digits: string) =>
  [...digits].reverse().reduce((sum, char, index) => {
    const value = Number(char) * (index % 2 ? 2 : 1);
    return sum + (value > 9 ? value - 9 : value);
  }, 0) %
    10 ===
  0;

const hasSiren = (text: string) =>
  [...text.matchAll(PATTERNS.siren)].some((match) =>
    luhn(match[0].replace(/\s/g, '')),
  );

export const detectSensitiveData = (text: string): SensitiveKind[] =>
  (Object.keys(PATTERNS) as SensitiveKind[]).filter((kind) =>
    kind === 'siren' ? hasSiren(text) : PATTERNS[kind].test(text),
  );
