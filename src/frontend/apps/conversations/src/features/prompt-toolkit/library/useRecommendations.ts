import { useEffect, useMemo, useRef, useState } from 'react';

import { CatalogEntry, matchCatalog } from '../coach/coachApi';

import type { PromptLibrary } from './types';

/** Wait for a real pause in typing before asking the model. */
export const RECOMMENDATION_DEBOUNCE_MS = 1500;
/** Shorter drafts do not say enough about the need. */
export const RECOMMENDATION_MIN_LENGTH = 15;

/** Something the panel can suggest: a library prompt, a tool or a lesson. */
export interface Suggestion {
  /**
   * Unique across kinds, and simple enough for the model to copy as is:
   * the prompt id, "tool-<id>", or the lesson id ("lesson-3").
   */
  key: string;
  kind: 'prompt' | 'tool' | 'lesson';
  id: string;
  title: string;
  /** How the model sees it: title, description, keywords. */
  summary: string;
}

export const libraryToSuggestions = (library: PromptLibrary): Suggestion[] =>
  library.prompts.map((prompt) => ({
    key: prompt.id,
    kind: 'prompt',
    id: prompt.id,
    title: prompt.title,
    summary: `${prompt.title} — ${prompt.description} (${prompt.keywords.join(', ')})`,
  }));

export const toCatalog = (suggestions: Suggestion[]): CatalogEntry[] =>
  suggestions.map((suggestion) => ({
    id: suggestion.key,
    summary: `[${suggestion.kind}] ${suggestion.summary}`,
  }));

/**
 * What fits what the user is typing, picked by the model after each pause.
 * Results are cached per text, so going back costs nothing.
 */
export const useRecommendations = (
  text: string,
  suggestions: Suggestion[],
  enabled: boolean,
): Suggestion[] => {
  const catalog = useMemo(() => toCatalog(suggestions), [suggestions]);
  const cacheRef = useRef(new Map<string, string[]>());
  const [keys, setKeys] = useState<string[]>([]);
  const need = text.trim();

  useEffect(() => {
    if (!enabled || need.length < RECOMMENDATION_MIN_LENGTH) {
      setKeys([]);
      return;
    }
    const cached = cacheRef.current.get(need);
    if (cached) {
      setKeys(cached);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      matchCatalog(need, catalog, controller.signal)
        .then((found) => {
          cacheRef.current.set(need, found);
          setKeys(found);
        })
        // A suggestion is a bonus: on failure, simply show none.
        .catch(() => undefined);
    }, RECOMMENDATION_DEBOUNCE_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [need, enabled, catalog]);

  return useMemo(
    () =>
      keys
        .map((key) => suggestions.find((suggestion) => suggestion.key === key))
        .filter((suggestion): suggestion is Suggestion => Boolean(suggestion)),
    [keys, suggestions],
  );
};
