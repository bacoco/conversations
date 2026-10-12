import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { searchPhrases } from '../library/embeddingSearch';

export const PISTES_DELAY_MS = 400;
export const PISTES_COUNT = 3;

/**
 * Starting ideas close to what is being typed, found by meaning: never the
 * request already in the field.
 */
export const usePistes = (text: string, enabled: boolean) => {
  const { i18n } = useTranslation();
  const [phrases, setPhrases] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const query = text.trim();

  useEffect(() => {
    if (!enabled || !query) {
      setPhrases([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsSearching(true);
      searchPhrases(query, i18n.language, PISTES_COUNT + 1, controller.signal)
        .then((found) =>
          setPhrases(
            found
              .map((phrase) => phrase.text)
              .filter(
                (phrase) => phrase.trim().toLowerCase() !== query.toLowerCase(),
              )
              .slice(0, PISTES_COUNT),
          ),
        )
        .catch(() => undefined)
        .finally(() => {
          if (!controller.signal.aborted) setIsSearching(false);
        });
    }, PISTES_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [enabled, query, i18n.language]);

  return { phrases, isSearching };
};
