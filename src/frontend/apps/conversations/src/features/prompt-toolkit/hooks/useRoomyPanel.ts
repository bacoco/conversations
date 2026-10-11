import { useEffect } from 'react';

import { useResponsiveStore } from '@/stores';

import {
  RightPanelMode,
  usePromptToolkitStore,
} from '../stores/usePromptToolkitStore';

/**
 * Whether a space of the panel is the one on screen: the spaces stay
 * mounted when hidden, so what they do to the panel must check this.
 */
export const useIsSpaceShown = (mode: RightPanelMode) =>
  usePromptToolkitStore(
    (state) =>
      state.isOpen &&
      state.mode === mode &&
      !state.showHome &&
      state.hasSeenWelcome &&
      !state.fill,
  );

/**
 * An activity that needs room (a step of the course, the answer workshop)
 * widens the panel while it is open, and gives the width back after, unless
 * the user widened it already.
 */
export const useRoomyPanel = (isActive = true) => {
  const { isDesktop } = useResponsiveStore();
  useEffect(() => {
    if (!isActive || !isDesktop) {
      return;
    }
    const wasExpanded = usePromptToolkitStore.getState().isExpanded;
    if (!wasExpanded) {
      usePromptToolkitStore.setState({ isExpanded: true });
    }
    return () => {
      if (!wasExpanded) {
        usePromptToolkitStore.setState({ isExpanded: false });
      }
    };
  }, [isActive, isDesktop]);
};
