import { useLearnProgressStore } from '../learn/useLearnProgressStore';
import { useLibraryStore } from '../library/useLibraryStore';
import { useMyPromptsStore } from '../library/useMyPromptsStore';
import { useRewardsStore } from '../rewards/useRewardsStore';
import { useToolsUsageStore } from '../tools/useToolsUsageStore';

import { useCoachHistoryStore } from './useCoachHistoryStore';
import { useCoachPrefsStore } from './useCoachPrefsStore';
import { useCoachTipsStore } from './useCoachTipsStore';
import { useMyStyleStore } from './useMyStyleStore';
import { useNestorChatStore } from './useNestorChatStore';
import { useProfileStore } from './useProfileStore';

/** Whose data this browser holds: a fingerprint, never the account. */
export const OWNER_KEY = 'nestor-owner';

interface Resettable {
  persist: { clearStorage: () => void };
  getInitialState: () => object;
  setState: (state: object, replace: true) => void;
}

/**
 * Everything Nestor keeps in this browser for one person. The recorder
 * has its own claim (`useRecorderStore`); the panel's place on screen is
 * not personal.
 */
const PERSONAL_STORES: Resettable[] = [
  useLearnProgressStore,
  useLibraryStore,
  useMyPromptsStore,
  useRewardsStore,
  useToolsUsageStore,
  useCoachHistoryStore,
  useCoachPrefsStore,
  useCoachTipsStore,
  useMyStyleStore,
  useProfileStore,
  useNestorChatStore,
] as unknown as Resettable[];

const fingerprint = async (account: string) => {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`nestor:${account}`),
  );
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, '0'),
  ).join('');
};

/**
 * On a shared computer, each account sees only its own Nestor: when
 * another account signs in, what was kept for the previous one is erased
 * (progress, favorites, settings, thread) before anything is shown.
 */
export const claimNestorData = async (account: string) => {
  const owner = await fingerprint(account);
  const previous = localStorage.getItem(OWNER_KEY);
  if (previous && previous !== owner) {
    PERSONAL_STORES.forEach((store) => {
      store.persist.clearStorage();
      store.setState(store.getInitialState(), true);
    });
  }
  localStorage.setItem(OWNER_KEY, owner);
};
