export interface PhraseCategory {
  id: string;
  label: string;
}

/**
 * A ready-to-send request: [category id, sentence, id of the full template
 * in the tools library, when there is one].
 */
export type PhraseEntry = [string, string, string?];

export interface PhraseLibrary {
  categories: PhraseCategory[];
  phrases: PhraseEntry[];
}

export interface Phrase {
  id: string;
  category: PhraseCategory;
  text: string;
  /** The library prompt that does the same job in full. */
  templateId?: string;
}
