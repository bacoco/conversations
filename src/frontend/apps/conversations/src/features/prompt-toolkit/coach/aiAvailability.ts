import { create } from 'zustand';

import { COACH_COMPLETIONS_URL } from './coachApi';

const COMPLETIONS_PATH = '/v1/chat/completions';

/** Answers 2xx when the Albert relay is configured, 404 otherwise. */
export const AI_STATUS_URL = COACH_COMPLETIONS_URL.endsWith(COMPLETIONS_PATH)
  ? `${COACH_COMPLETIONS_URL.slice(0, -COMPLETIONS_PATH.length)}/status`
  : '';

type AiStatus = 'checking' | 'available' | 'unavailable';

interface AiAvailabilityState {
  status: AiStatus;
  /** Asks the relay once whether the AI features can be offered. */
  check: () => Promise<void>;
}

/**
 * Whether the AI features (coach, Robin, suggestions…) can be offered. The
 * course, the tool forms and the library work without them.
 * Unit tests assume the relay is there.
 */
export const useAiAvailability = create<AiAvailabilityState>()((set, get) => ({
  status: import.meta.env.MODE === 'test' ? 'available' : 'checking',
  check: async () => {
    if (get().status !== 'checking') {
      return;
    }
    if (!AI_STATUS_URL) {
      set({ status: 'unavailable' });
      return;
    }
    try {
      const response = await fetch(AI_STATUS_URL, { credentials: 'include' });
      set({ status: response.ok ? 'available' : 'unavailable' });
    } catch {
      set({ status: 'unavailable' });
    }
  },
}));

export const useAiAvailable = () =>
  useAiAvailability((state) => state.status === 'available');

/**
 * True only once the relay is known to be missing: while checking, screens
 * stay as asked, so nothing flickers or switches under the user.
 */
export const useAiUnavailable = () =>
  useAiAvailability((state) => state.status === 'unavailable');
