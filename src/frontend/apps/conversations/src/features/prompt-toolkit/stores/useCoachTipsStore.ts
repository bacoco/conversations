import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** How many times each "To remember" tip of the coach was shown. */
interface CoachTipsState {
  shown: Record<string, number>;
  markShown: (key: string) => void;
}

export const useCoachTipsStore = create<CoachTipsState>()(
  persist(
    (set) => ({
      shown: {},
      markShown: (key) =>
        set((state) => ({
          shown: { ...state.shown, [key]: (state.shown[key] ?? 0) + 1 },
        })),
    }),
    { name: 'nestor-coach-tips' },
  ),
);
