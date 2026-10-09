import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Icon, Text } from '@/components';
import { useConversationRouteId } from '@/utils';

import { DetailPage } from '../components/DetailPage';
import { FollowUpCard } from '../components/FollowUpCard';
import { ROBIN_PROMPTS_URL, ROBIN_WRITE_URL } from '../components/PanelHome';
import { PanelTextArea } from '../components/PanelTextArea';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

/** Robin strengthens the user's own text, with two or three questions. */
export const ImproveTextView = ({ onBack }: { onBack: () => void }) => {
  const { t } = useTranslation();
  const chatInput = usePromptToolkitStore((state) => state.chatInput);
  const startFill = usePromptToolkitStore((state) => state.startFill);
  // Starts from what is in the message field, if anything.
  const [text, setText] = useState(chatInput);

  return (
    <DetailPage
      onBack={onBack}
      backLabel={t('Back to the tools')}
      title={t('Improve my text')}
      subtitle={t(
        'Robin asks you two or three questions, then writes a stronger version.',
      )}
      image={ROBIN_WRITE_URL}
    >
      <Box $gap="12px">
        <PanelTextArea
          minRows={8}
          label={t('Your text')}
          value={text}
          onChange={setText}
          placeholder={t('Paste or write the prompt to improve…')}
        />
        <Button
          fullWidth
          disabled={!text.trim()}
          onClick={() => startFill(text.trim(), t('Your prompt'), '', 'draft')}
          icon={<Icon iconName="edit_note" $size="18px" />}
        >
          {t('Start with Robin')}
        </Button>
      </Box>
    </DetailPage>
  );
};

/** A better follow-up when the last answer does not suit the user. */
export const FollowUpView = ({ onBack }: { onBack: () => void }) => {
  const { t } = useTranslation();
  const conversationId = useConversationRouteId();

  return (
    <DetailPage
      onBack={onBack}
      backLabel={t('Back to the tools')}
      title={t('Follow up on an answer')}
      subtitle={t(
        'The answer does not suit you? Robin writes a better follow-up.',
      )}
      image={ROBIN_PROMPTS_URL}
    >
      {conversationId ? (
        <FollowUpCard />
      ) : (
        <Text $size="sm" $variation="secondary" $textAlign="center">
          {t('Open a conversation with an answer to follow up on.')}
        </Text>
      )}
    </DetailPage>
  );
};
