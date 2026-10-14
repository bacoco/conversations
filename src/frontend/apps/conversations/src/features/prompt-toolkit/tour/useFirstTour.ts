import { useEffect, useRef } from 'react';

import { useProfileStore } from '../stores/useProfileStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';
import { startTour, useTourStore } from '../stores/useTourStore';

/**
 * The film's window comes by itself: the first time the page opens with
 * Nestor's panel open, and each time the panel shows Nestor's welcome film.
 * Closed, it stays closed until one of these happens again.
 */
export const useFirstTour = (ready: boolean) => {
  const seen = useProfileStore((state) => state.hasSeenTour);
  const welcome = usePromptToolkitStore((state) => !state.hasSeenWelcome);
  const welcomeBefore = useRef(false);
  useEffect(() => {
    if (!ready) return;
    const welcomeAppeared = welcome && !welcomeBefore.current;
    welcomeBefore.current = welcome;
    if (useTourStore.getState().active) return;
    if (!seen || welcomeAppeared) startTour();
  }, [ready, seen, welcome]);
};
