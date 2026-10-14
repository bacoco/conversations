import { useEffect } from 'react';

import { useProfileStore } from '../stores/useProfileStore';
import { startTour, useTourStore } from '../stores/useTourStore';

/**
 * The first time the page opens with Nestor's panel open (a first login, a
 * refresh), the window comes on the film; once seen, never by itself again.
 */
export const useFirstTour = (ready: boolean) => {
  const seen = useProfileStore((state) => state.hasSeenTour);
  useEffect(() => {
    if (ready && !seen && !useTourStore.getState().active) startTour();
  }, [ready, seen]);
};
