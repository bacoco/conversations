import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { useMainConversationStore } from '../stores/useMainConversationStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

import { NESTOR_AVATAR_URL } from './PanelHome';

/**
 * The answer to a request Nestor helped with has arrived while the user
 * is elsewhere in the panel: one line to reach the coach, which helps
 * adjust it. Gone once the coach is opened or the line dismissed.
 */
export const AnswerHelpBanner = ({
  isCoachShown,
}: {
  isCoachShown: boolean;
}) => {
  const { t } = useTranslation();
  const offer = usePromptToolkitStore((state) => state.offerAnswerHelp);
  const setOffer = usePromptToolkitStore((state) => state.setOfferAnswerHelp);
  const startCoach = usePromptToolkitStore((state) => state.startCoach);
  const hasAnswer = useMainConversationStore(
    (state) =>
      !state.isAssistantResponding &&
      state.latestCompletedAssistantMessageId !== null,
  );

  if (!offer || !hasAnswer || isCoachShown) {
    return null;
  }
  return (
    <Box
      role="status"
      $direction="row"
      $align="center"
      $gap="10px"
      $css={css`
        margin: 12px 16px 0;
        padding: 10px 12px;
        border-radius: 12px;
        background: var(
          --c--contextuals--background--semantic--brand--tertiary
        );
      `}
    >
      <img
        src={NESTOR_AVATAR_URL}
        alt=""
        width={32}
        height={32}
        style={{ flex: 'none', borderRadius: '50%' }}
      />
      <Text $size="sm" $css="flex: 1; min-width: 0;">
        {t('The Assistant has answered. I can help you adjust the answer.')}
      </Text>
      <Button
        size="small"
        onClick={() => {
          setOffer(false);
          startCoach();
        }}
      >
        {t('See')}
      </Button>
      <Button
        size="small"
        color="neutral"
        variant="tertiary"
        aria-label={t('Close')}
        onClick={() => setOffer(false)}
        icon={<Icon iconName="close" $size="18px" />}
      />
    </Box>
  );
};
