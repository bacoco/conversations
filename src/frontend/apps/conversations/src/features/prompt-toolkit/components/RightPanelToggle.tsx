import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useTranslation } from 'react-i18next';

import PanelIcon from '@/assets/icons/left-panel-bold.svg?react';
import { useChatPreferencesStore } from '@/features/chat/stores/useChatPreferencesStore';

import { PROMPT_TOOLKIT_ENABLED } from '../coach/coachApi';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

/** Opens the right panel; mirrors the left panel toggle. */
export const RightPanelToggle = () => {
  const { t } = useTranslation();
  const { isOpen, toggle } = usePromptToolkitStore();
  const { setSourcesPanelOpen } = useChatPreferencesStore();

  if (!PROMPT_TOOLKIT_ENABLED) {
    return null;
  }

  return (
    <Button
      size="small"
      color={isOpen ? 'brand' : 'neutral'}
      variant={isOpen ? 'secondary' : 'tertiary'}
      aria-pressed={isOpen}
      aria-label={
        isOpen ? t('Close the right panel') : t('Open the right panel')
      }
      title={t('Prompt coach and tools')}
      onClick={() => {
        // Both panels share the right side of the screen.
        if (!isOpen) {
          setSourcesPanelOpen(false);
        }
        toggle();
      }}
      icon={<PanelIcon style={{ transform: 'scaleX(-1)' }} />}
    />
  );
};
