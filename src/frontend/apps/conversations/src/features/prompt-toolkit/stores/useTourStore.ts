import { create } from 'zustand';

import { TOUR_STEPS } from '../tour/tourScript';

import { stopDemo, useDemoStore } from './useDemoStore';
import { useProfileStore } from './useProfileStore';
import { usePromptToolkitStore } from './usePromptToolkitStore';

interface TourState {
  active: boolean;
  index: number;
  next: () => void;
  stop: () => void;
}

/** Kept in memory only: a reload ends the tour. */
export const useTourStore = create<TourState>()((set, get) => ({
  active: false,
  index: 0,
  next: () => {
    const index = get().index + 1;
    if (index >= TOUR_STEPS.length) {
      endTour();
      return;
    }
    set({ index });
  },
  stop: () => set({ active: false, index: 0 }),
}));

/**
 * The tour of the panel, Nestor speaking in the middle: it opens on the
 * home page's cards. Once seen, it never starts by itself again.
 */
export const startTour = () => {
  useProfileStore.getState().markTourSeen();
  usePromptToolkitStore.setState({
    isOpen: true,
    showHome: true,
    showFavorites: false,
    showNestorSettings: false,
    hasSeenWelcome: true,
  });
  useTourStore.setState({ active: true, index: 0 });
};

/** The end, or « Passer la visite »: the example leaves the field. */
export const endTour = () => {
  useTourStore.getState().stop();
  if (useDemoStore.getState().active) stopDemo();
};
