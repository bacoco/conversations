import { create } from 'zustand';

import { TOUR_STEPS } from '../tour/tourScript';

import { stopDemo, useDemoStore } from './useDemoStore';
import { useProfileStore } from './useProfileStore';
import { usePromptToolkitStore } from './usePromptToolkitStore';

interface TourState {
  active: boolean;
  index: number;
  /** The window opens on the film, still; the tour comes when asked. */
  onFilm: boolean;
  /** Closed by a click beside: the step to come back to, or null. */
  paused: number | null;
  pause: () => void;
  resume: () => void;
  next: () => void;
  stop: () => void;
  takeTour: () => void;
  showFilm: () => void;
}

/** Kept in memory only: a reload ends the tour. */
export const useTourStore = create<TourState>()((set, get) => ({
  active: false,
  index: 0,
  onFilm: false,
  paused: null,
  // A click beside, by mistake or not: the tour waits to be resumed.
  pause: () => set((state) => ({ active: false, paused: state.index })),
  resume: () =>
    set((state) => ({
      active: true,
      onFilm: false,
      index: state.paused ?? 0,
      paused: null,
    })),
  // The tour starts on the home page's cards, the welcome film put away.
  takeTour: () => {
    usePromptToolkitStore.setState({
      showHome: true,
      showFavorites: false,
      showNestorSettings: false,
      hasSeenWelcome: true,
    });
    set({ onFilm: false, index: 0 });
  },
  showFilm: () => set({ onFilm: true }),
  next: () => {
    const index = get().index + 1;
    if (index >= TOUR_STEPS.length) {
      endTour();
      return;
    }
    set({ index });
  },
  stop: () => set({ active: false, index: 0, onFilm: false, paused: null }),
}));

/**
 * The tour of the panel, Nestor speaking in the middle: it opens on the
 * home page's cards. Once seen, it never starts by itself again.
 */
export const startTour = () => {
  useProfileStore.getState().markTourSeen();
  usePromptToolkitStore.setState({ isOpen: true });
  useTourStore.setState({ active: true, index: 0, onFilm: true });
};

/** The end, or « Passer la visite »: the example leaves the field. */
export const endTour = () => {
  useTourStore.getState().stop();
  if (useDemoStore.getState().active) stopDemo();
};
