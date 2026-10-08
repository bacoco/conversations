/** A ready-to-use prompt library, grouped by kind of work. */

export interface LibraryCategory {
  id: string;
  icon: string;
  title: string;
}

export interface LibraryPrompt {
  id: string;
  /** Id of a `LibraryCategory`. */
  category: string;
  title: string;
  description: string;
  /** The prompt itself; what the user must fill in is between [brackets]. */
  prompt: string;
  /** Words that reveal this need in what the user types. */
  keywords: string[];
}

export interface PromptLibrary {
  categories: LibraryCategory[];
  prompts: LibraryPrompt[];
}
