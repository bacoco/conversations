import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

import { PromptAnalysis, analyzePrompt } from './coachApi';
import { languageName } from './language';

/** The coach waits for a pause in the typing: it never interrupts. */
export const ROOM_PAUSE_MS = 2500;
/** Below this, a request is still being started: nothing to say yet. */
export const ROOM_MIN_CHARS = 25;
/** At most one reading every few seconds, however the user types. */
const ROOM_MIN_GAP_MS = 8000;

/**
 * The coach in the room: it reads the request in the message field at each
 * pause, silently. The reading is given only while it matches the text, so
 * nothing shows while the user is typing.
 */
export const useRoomCoach = (enabled: boolean) => {
  // `i18n` may be missing where the app mocks translations.
  const { i18n } = useTranslation();
  const language = i18n?.language;
  const draft = usePromptToolkitStore((state) => state.chatInput).trim();
  const [reading, setReading] = useState<{
    text: string;
    analysis: PromptAnalysis;
  } | null>(null);
  const lastRunRef = useRef(0);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (!enabled || draft.length < ROOM_MIN_CHARS || reading?.text === draft) {
      return;
    }
    const wait = Math.max(
      ROOM_PAUSE_MS,
      lastRunRef.current + ROOM_MIN_GAP_MS - Date.now(),
    );
    const timer = window.setTimeout(() => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      lastRunRef.current = Date.now();
      analyzePrompt(draft, languageName(language), controller.signal)
        .then((analysis) => setReading({ text: draft, analysis }))
        .catch(() => undefined);
    }, wait);
    return () => window.clearTimeout(timer);
  }, [draft, enabled, language, reading?.text]);

  useEffect(() => () => controllerRef.current?.abort(), []);

  return {
    draft,
    analysis: reading && reading.text === draft ? reading.analysis : null,
  };
};
