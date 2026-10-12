/**
 * The words of a public servant, whatever the model wrote: in French,
 * « demande » for prompt and « courriel » for mail. Articles follow the
 * noun; adjectives are left as they are.
 */
const FRENCH: [RegExp, string][] = [
  [/\bce prompt\b/gi, 'cette demande'],
  [/\ble prompt\b/gi, 'la demande'],
  [/\bun prompt\b/gi, 'une demande'],
  [/\bdu prompt\b/gi, 'de la demande'],
  [/\bprompts\b/gi, 'demandes'],
  [/\bprompt\b/gi, 'demande'],
  [/\be-?mails\b/gi, 'courriels'],
  [/\be-?mail\b/gi, 'courriel'],
  [/\bmails\b/gi, 'courriels'],
  [/\bmail\b/gi, 'courriel'],
];

export const plainWords = (text: string, language: string | undefined) =>
  (language ?? '').startsWith('fr')
    ? FRENCH.reduce(
        (result, [pattern, replacement]) =>
          result.replace(pattern, replacement),
        text,
      )
    : text;
