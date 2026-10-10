import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import PanelIcon from '@/assets/icons/left-panel-bold.svg?react';
import { Box } from '@/components';
import { useChatPreferencesStore } from '@/features/chat/stores/useChatPreferencesStore';

import { PROMPT_TOOLKIT_ENABLED } from '../coach/coachApi';
import { useMainConversationStore } from '../stores/useMainConversationStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

/** Opens the right panel; mirrors the left panel toggle. */
export const RightPanelToggle = () => {
  const { t } = useTranslation();
  const { isOpen, toggle } = usePromptToolkitStore();
  const coachWaitsForAnswer = usePromptToolkitStore(
    (state) => state.coachWaitsForAnswer,
  );
  const setCoachWaitsForAnswer = usePromptToolkitStore(
    (state) => state.setCoachWaitsForAnswer,
  );
  const hasAnswer = useMainConversationStore(
    (state) =>
      !state.isAssistantResponding &&
      state.latestCompletedAssistantMessageId !== null,
  );
  const { setSourcesPanelOpen } = useChatPreferencesStore();

  // Seen once the panel is open: the dot is for a closed panel only.
  useEffect(() => {
    if (isOpen && coachWaitsForAnswer) {
      setCoachWaitsForAnswer(false);
    }
  }, [isOpen, coachWaitsForAnswer, setCoachWaitsForAnswer]);

  if (!PROMPT_TOOLKIT_ENABLED) {
    return null;
  }
  // The answer to a request the coach read is there, the panel closed.
  const hasNews = !isOpen && coachWaitsForAnswer && hasAnswer;

  return (
    <Box $css="position: relative; display: inline-flex;">
      <Button
        size="small"
        color={isOpen ? 'brand' : 'neutral'}
        variant={isOpen ? 'secondary' : 'tertiary'}
        aria-pressed={isOpen}
        aria-label={
          isOpen
            ? t('Close the right panel')
            : hasNews
              ? t('Open the right panel: the coach can help with the answer')
              : t('Open the right panel')
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
      {hasNews && (
        <Box
          as="span"
          aria-hidden="true"
          $css={css`
            position: absolute;
            top: 2px;
            right: 2px;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            pointer-events: none;
            background: var(
              --c--contextuals--background--semantic--brand--primary
            );
          `}
        />
      )}
    </Box>
  );
};
