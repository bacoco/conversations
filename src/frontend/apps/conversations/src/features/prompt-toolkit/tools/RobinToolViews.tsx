import { Button } from '@gouvfr-lasuite/cunningham-react';
import { ReactNode, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Icon, Text } from '@/components';
import { useConversationRouteId } from '@/utils';

import { FollowUpCard } from '../components/FollowUpCard';
import { PanelTextArea } from '../components/PanelTextArea';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

const ToolHeader = ({
  title,
  description,
  onBack,
}: {
  title: string;
  description: string;
  onBack: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <Box $direction="row" $align="center" $gap="10px">
      <Button
        size="small"
        color="neutral"
        variant="tertiary"
        onClick={onBack}
        aria-label={t('Back to the tools')}
        icon={<Icon iconName="arrow_back" $size="18px" />}
      />
      <Box $css="min-width: 0;">
        <Text as="h2" $size="md" $weight="700" $margin="0">
          {title}
        </Text>
        <Text $size="xs" $variation="secondary">
          {description}
        </Text>
      </Box>
    </Box>
  );
};

const Page = ({ children }: { children: ReactNode }) => (
  <Box $gap="14px" $padding={{ all: 'base' }} $css="min-height: 100%;">
    {children}
  </Box>
);

/** Robin strengthens the user's own text, with two or three questions. */
export const ImproveTextView = ({ onBack }: { onBack: () => void }) => {
  const { t } = useTranslation();
  const chatInput = usePromptToolkitStore((state) => state.chatInput);
  const startFill = usePromptToolkitStore((state) => state.startFill);
  // Starts from what is in the message field, if anything.
  const [text, setText] = useState(chatInput);

  return (
    <Page>
      <ToolHeader
        title={t('Improve my text')}
        description={t(
          'Robin asks you two or three questions, then writes a stronger version.',
        )}
        onBack={onBack}
      />
      <Box $gap="10px" $css="flex: 1;">
        <PanelTextArea
          fill
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
    </Page>
  );
};

/** A better follow-up when the last answer does not suit the user. */
export const FollowUpView = ({ onBack }: { onBack: () => void }) => {
  const { t } = useTranslation();
  const conversationId = useConversationRouteId();

  return (
    <Page>
      <ToolHeader
        title={t('Follow up on an answer')}
        description={t(
          'The answer does not suit you? Robin writes a better follow-up.',
        )}
        onBack={onBack}
      />
      {conversationId ? (
        <FollowUpCard />
      ) : (
        <Text $size="sm" $variation="secondary">
          {t('Open a conversation with an answer to follow up on.')}
        </Text>
      )}
    </Page>
  );
};
