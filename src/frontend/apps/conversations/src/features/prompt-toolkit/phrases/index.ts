import { PHRASES_EN } from './en';
import { PHRASES_FR } from './fr';
import type { Phrase, PhraseLibrary } from './types';

const toPhrases = (library: PhraseLibrary): Phrase[] => {
  const categories = new Map(library.categories.map((c) => [c.id, c]));
  return library.phrases.map(([categoryId, text, templateId], index) => ({
    id: `${categoryId}-${index}`,
    category: categories.get(categoryId) ?? { id: categoryId, label: '' },
    text,
    templateId,
  }));
};

const cache = new Map<string, Phrase[]>();

/** The phrases in the interface language: French, else English. */
export const getPhrases = (language: string): Phrase[] => {
  const key = (language ?? '').startsWith('fr') ? 'fr' : 'en';
  let phrases = cache.get(key);
  if (!phrases) {
    phrases = toPhrases(key === 'fr' ? PHRASES_FR : PHRASES_EN);
    cache.set(key, phrases);
  }
  return phrases;
};
