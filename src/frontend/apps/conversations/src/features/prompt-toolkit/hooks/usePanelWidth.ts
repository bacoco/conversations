import { useResponsiveStore } from '@/stores';

import {
  PANEL_MAX_VIEWPORT_RATIO,
  clampPanelWidth,
  usePromptToolkitStore,
} from '../stores/usePromptToolkitStore';

/** Width actually rendered, shared with the layout to resize the chat column. */
export const usePanelWidth = () => {
  const { width, isExpanded } = usePromptToolkitStore();
  const { screenWidth } = useResponsiveStore();
  const viewport = screenWidth || window.innerWidth;
  return isExpanded
    ? clampPanelWidth(viewport * PANEL_MAX_VIEWPORT_RATIO, viewport)
    : clampPanelWidth(width, viewport);
};
