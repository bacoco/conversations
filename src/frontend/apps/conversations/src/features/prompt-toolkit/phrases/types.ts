export interface PhraseCategory {
  id: string;
  label: string;
}

/** A ready-to-send request: [category id, sentence]. */
export type PhraseEntry = [string, string];

export interface PhraseLibrary {
  categories: PhraseCategory[];
  phrases: PhraseEntry[];
}

export interface Phrase {
  id: string;
  category: PhraseCategory;
  text: string;
}
