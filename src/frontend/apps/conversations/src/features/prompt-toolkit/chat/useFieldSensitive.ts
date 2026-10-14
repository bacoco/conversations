import { useEffect, useState } from 'react';

import { SensitiveKind, detectSensitiveData } from '../coach/sensitiveData';

/** A pause in typing before Nestor looks: never on each key. */
export const FIELD_CHECK_DELAY_MS = 700;

const NONE: SensitiveKind[] = [];

/**
 * Personal data in the request typed for the Assistant, looked for in the
 * browser only (no AI call), once the user pauses.
 */
export const useFieldSensitive = (text: string) => {
  const [kinds, setKinds] = useState<SensitiveKind[]>(NONE);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      const found = detectSensitiveData(text);
      setKinds((before) =>
        found.join() === before.join() ? before : found.length ? found : NONE,
      );
    }, FIELD_CHECK_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [text]);
  return kinds;
};
