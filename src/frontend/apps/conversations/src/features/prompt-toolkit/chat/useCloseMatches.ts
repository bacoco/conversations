import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { detectSensitiveData } from '../coach/sensitiveData';
import { JOB_IDS, casesOf, jobById } from '../jobs/jobs';
import { getPromptLibrary } from '../library/content';
import { useProfileStore } from '../stores/useProfileStore';

import {
  CloseMatchesFound,
  NO_CLOSE_MATCH,
  findCloseMatches,
} from './closeMatches';
import {
  PISTES_DELAY_MS,
  PISTES_MAX_CHARS,
  PISTES_MIN_CHARS,
} from './usePistes';

/**
 * While the user types, at the same pace as Nestor's starting ideas: one
 * practical case of their job and one library model close to their request,
 * if any is really close. `excludeCaseId`: a case already on hold.
 */
export const useCloseMatches = (
  text: string,
  enabled: boolean,
  excludeCaseId?: string | null,
): CloseMatchesFound => {
  // `i18n` may be missing where the app mocks translations.
  const { i18n } = useTranslation();
  const language = i18n?.language ?? 'fr';
  const jobId = jobById(useProfileStore((state) => state.job?.id))?.id;
  const cases = useMemo(
    () =>
      (jobId ? casesOf(jobId) : JOB_IDS.flatMap(casesOf)).filter(
        (item) => item.id !== excludeCaseId,
      ),
    [jobId, excludeCaseId],
  );
  const prompts = useMemo(() => getPromptLibrary(language).prompts, [language]);
  const cacheRef = useRef(new Map<string, CloseMatchesFound>());
  const [found, setFound] = useState<CloseMatchesFound>(NO_CLOSE_MATCH);
  const query = text.trim();

  useEffect(() => {
    setFound(NO_CLOSE_MATCH);
    if (
      !enabled ||
      query.length < PISTES_MIN_CHARS ||
      query.length > PISTES_MAX_CHARS ||
      // Personal data never leaves for a suggestion nobody asked for.
      detectSensitiveData(query).length > 0
    ) {
      return;
    }
    const key = [language, jobId ?? '', excludeCaseId ?? '', query].join('\n');
    const cached = cacheRef.current.get(key);
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      if (cached) {
        setFound(cached);
        return;
      }
      findCloseMatches(query, { cases, prompts, signal: controller.signal })
        .then((matches) => {
          cacheRef.current.set(key, matches);
          if (!controller.signal.aborted) setFound(matches);
        })
        // A suggestion is a bonus: on failure, simply show none.
        .catch(() => undefined);
    }, PISTES_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [enabled, query, language, jobId, excludeCaseId, cases, prompts]);

  return found;
};
