import { useEffect, useMemo, useRef, useState } from 'react';

import { CatalogEntry, matchCatalog } from '../coach/coachApi';

import type { LibraryPrompt, PromptLibrary } from './types';

/** Wait for a real pause in typing before asking the model. */
export const RECOMMENDATION_DEBOUNCE_MS = 1500;
/** Shorter drafts do not say enough about the need. */
export const RECOMMENDATION_MIN_LENGTH = 15;

export const toCatalog = (library: PromptLibrary): CatalogEntry[] =>
  library.prompts.map((prompt) => ({
    id: prompt.id,
    summary: `${prompt.title} — ${prompt.description} (${prompt.keywords.join(', ')})`,
  }));

/**
 * Library prompts that fit what the user is typing, picked by the model
 * after each pause. Results are cached per text, so going back costs nothing.
 */
export const useRecommendations = (
  text: string,
  library: PromptLibrary,
  enabled: boolean,
): LibraryPrompt[] => {
  const catalog = useMemo(() => toCatalog(library), [library]);
  const cacheRef = useRef(new Map<string, string[]>());
  const [ids, setIds] = useState<string[]>([]);
  const need = text.trim();

  useEffect(() => {
    if (!enabled || need.length < RECOMMENDATION_MIN_LENGTH) {
      setIds([]);
      return;
    }
    const cached = cacheRef.current.get(need);
    if (cached) {
      setIds(cached);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      matchCatalog(need, catalog, controller.signal)
        .then((found) => {
          cacheRef.current.set(need, found);
          setIds(found);
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
      ids
        .map((id) => library.prompts.find((prompt) => prompt.id === id))
        .filter((prompt): prompt is LibraryPrompt => Boolean(prompt)),
    [ids, library],
  );
};
