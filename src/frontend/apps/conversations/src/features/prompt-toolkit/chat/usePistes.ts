import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { languageName } from '../coach/language';
import { detectSensitiveData } from '../coach/sensitiveData';

import { suggestPistes } from './nestorChatApi';

/** A pause in typing before Nestor proposes: he does not chase each key. */
export const PISTES_DELAY_MS = 900;
/** Below this, there is no request yet to start from. */
export const PISTES_MIN_CHARS = 12;
/**
 * Above this, the request holds a pasted text or is written out: an idea
 * would replace it all. Nestor stays quiet.
 */
export const PISTES_MAX_CHARS = 160;

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
    if (
      !enabled ||
      query.length < PISTES_MIN_CHARS ||
      query.length > PISTES_MAX_CHARS ||
      // Personal data never leaves for an idea nobody asked for.
      detectSensitiveData(query).length > 0
    ) {
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
