import { Button, Loader } from '@gouvfr-lasuite/cunningham-react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import type { AfterStatus } from '../coach/useAfterAnswer';
import { NestorBubble, suggestionCss } from '../fill/GuidedThread';
import { usePlacePrompt } from '../tools/usePlacePrompt';

const questionCss = css`
  ${suggestionCss}
  width: 100%;
  border-radius: 10px;
  padding: 10px 12px;
`;

const Waiting = ({ label }: { label: string }) => (
  <Box
    $direction="row"
    $align="center"
    $gap="8px"
    role="status"
    $padding={{ all: 'base' }}
  >
    <Loader size="small" />
    <Text $size="sm">{label}</Text>
  </Box>
);

const NoAnswer = () => {
  const { t } = useTranslation();
  return (
    <Box $padding={{ all: 'lg' }} $align="center">
      <Text $textAlign="center" $size="sm" $variation="secondary">
        {t(
          'Send a request: once the Assistant has answered, I can help with what comes next.',
        )}
      </Text>
    </Box>
  );
};

const Failed = ({ onRetry }: { onRetry: () => void }) => {
  const { t } = useTranslation();
  return (
    <Box
      role="alert"
      $direction="row"
      $align="center"
      $gap="8px"
      $padding={{ all: 'base' }}
    >
      <Text $size="sm">{t('Nestor did not answer. Try again.')}</Text>
      <Button size="small" color="neutral" onClick={onRetry}>
        {t('Retry')}
      </Button>
    </Box>
  );
};

/** "Next": two questions to go on, prepared after each answer. */
export const NextQuestionsView = ({
  hasAnswer,
  status,
  questions,
  onRetry,
}: {
  hasAnswer: boolean;
  status: AfterStatus;
  questions: string[];
  onRetry: () => void;
}) => {
  const { t } = useTranslation();
  const placePrompt = usePlacePrompt();
  if (!hasAnswer) {
    return <NoAnswer />;
  }
  if (status === 'loading' || status === 'idle') {
    return <Waiting label={t('Nestor is preparing next questions…')} />;
  }
  if (status === 'error') {
    return <Failed onRetry={onRetry} />;
  }
  return (
    <Box $gap="12px" $padding={{ all: 'base' }}>
      <Box $gap="2px">
        <Text as="h3" $size="md" $weight="700" $margin="0">
          {t('Next questions')}
        </Text>
        <Text $size="sm" $variation="secondary">
          {t('Click a question to put it in the message field.')}
        </Text>
      </Box>
      <Box as="ul" $gap="8px" $css="margin: 0; padding: 0; list-style: none;">
        {questions.map((question) => (
          <Box as="li" key={question}>
            <Box
              as="button"
              type="button"
              onClick={() => placePrompt(question)}
              $direction="row"
              $align="center"
              $gap="8px"
              $css={questionCss}
            >
              <Icon iconName="north_west" $size="16px" $withThemeInherited />
              <Text as="span" $size="sm" $css="flex: 1; min-width: 0;">
                {question}
              </Text>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

/** "Advice": Nestor's view of the latest answer, in the panel. */
export const AdviceView = ({
  status,
  text,
  gaps,
  hasAnswer,
  onRetry,
}: {
  status: AfterStatus;
  text: string;
  gaps: string[];
  hasAnswer: boolean;
  onRetry: () => void;
}) => {
  const { t } = useTranslation();
  if (!hasAnswer) {
    return <NoAnswer />;
  }
  return (
    <Box $gap="12px" $padding={{ all: 'base' }}>
      <Text as="h3" $size="md" $weight="700" $margin="0">
        {t('Nestor’s view on this exchange')}
      </Text>
      {/* Seen without the model: the answer is not ready as it is. */}
      {gaps.length > 0 && (
        <Box
          role="note"
          $direction="row"
          $gap="8px"
          $css={css`
            padding: 10px 12px;
            border-radius: 10px;
            background: var(
              --c--contextuals--background--semantic--warning--tertiary
            );
          `}
        >
          <Icon iconName="edit_note" $size="20px" $theme="warning" />
          <Box $gap="2px">
            <Text $size="sm" $weight="700">
              {t(
                'This answer is not ready to be sent: {{count}} parts to complete',
                {
                  count: gaps.length,
                },
              )}
            </Text>
            <Text $size="sm">{gaps.join(' · ')}</Text>
          </Box>
        </Box>
      )}
      {status === 'error' ? (
        <Failed onRetry={onRetry} />
      ) : status === 'ready' ? (
        <NestorBubble>{text}</NestorBubble>
      ) : (
        <Waiting label={t('Nestor is reading the exchange…')} />
      )}
    </Box>
  );
};
