import { useEffect } from 'react';

import { useResponsiveStore } from '@/stores';

import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

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
