import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { languageName } from '../coach/language';

import { suggestPistes } from './nestorChatApi';

/** A pause in typing before Nestor proposes: he does not chase each key. */
export const PISTES_DELAY_MS = 900;
/** Below this, there is no request yet to start from. */
export const PISTES_MIN_CHARS = 12;

/**
 * Starting ideas while the user types: their own request made more precise
 * by Nestor, never another task.
 */
export const usePistes = (text: string, enabled: boolean) => {
  const { i18n } = useTranslation();
  const [phrases, setPhrases] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const query = text.trim();

  useEffect(() => {
    setPhrases([]);
    if (!enabled || query.length < PISTES_MIN_CHARS) {
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsSearching(true);
      suggestPistes(query, languageName(i18n.language), controller.signal)
        .then((found) => {
          if (!controller.signal.aborted) setPhrases(found);
        })
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
