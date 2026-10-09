import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { answerPrompt } from '../coach/coachApi';

import { CoachStatus } from './CoachStatus';

const answerCss = (isImproved: boolean) => css`
  padding: 10px 12px;
  border-radius: 8px;
  border: 1px solid
    ${
      isImproved
        ? 'var(--c--contextuals--border--semantic--success--secondary)'
        : 'var(--c--contextuals--border--surface--primary)'
    };
  background: var(--c--contextuals--background--surface--primary);
`;

/**
 * Sends the original and the improved prompt to the assistant, and shows
 * both answers: the best way to see why a better prompt matters.
 */
export const ImpactView = ({
  original,
  improved,
  labels,
}: {
  original: string;
  improved: string;
  /** Wording for another context, such as the before / after exercise. */
  labels?: { button: string; before: string; after: string };
}) => {
  const { t } = useTranslation();
  const [answers, setAnswers] = useState<[string, string] | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const controllerRef = useRef<AbortController | null>(null);

  // A new suggestion makes the previous comparison obsolete.
  useEffect(() => {
    controllerRef.current?.abort();
    setAnswers(null);
    setStatus('idle');
  }, [original, improved]);
  useEffect(() => () => controllerRef.current?.abort(), []);

  const compare = async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus('loading');
    try {
      const both = await Promise.all([
        answerPrompt(original, controller.signal),
        answerPrompt(improved, controller.signal),
      ]);
      setAnswers(both);
      setStatus('idle');
    } catch {
      if (!controller.signal.aborted) {
        setStatus('error');
      }
    }
  };

  if (!answers) {
    return (
      <Box $gap="8px">
        {status === 'loading' && (
          <CoachStatus
            isLoading
            loadingLabel={t('The assistant answers both prompts…')}
          />
        )}
        {status === 'error' && (
          <Text $size="sm" role="alert">
            {t('The comparison failed. Please retry.')}
          </Text>
        )}
        <Button
          size="small"
          color="neutral"
          variant="secondary"
          disabled={status === 'loading'}
          onClick={() => void compare()}
          icon={<Icon iconName="compare_arrows" $size="16px" />}
        >
          {labels?.button ?? t('See the impact on the answer')}
        </Button>
      </Box>
    );
  }

  const columns = [
    {
      title: labels?.before ?? t('With your prompt'),
      text: answers[0],
      isImproved: false,
    },
    {
      title: labels?.after ?? t('With the suggested version'),
      text: answers[1],
      isImproved: true,
    },
  ];

  return (
    <Box $gap="8px" aria-live="polite">
      <Text as="h4" $size="sm" $weight="700" $margin="0">
        {t('Impact on the answer')}
      </Text>
      {columns.map((column) => (
        <Box key={column.title} $gap="6px" $css={answerCss(column.isImproved)}>
          <Box $direction="row" $align="center" $gap="6px">
            <Icon
              iconName={column.isImproved ? 'auto_awesome' : 'chat'}
              $size="16px"
              $theme={column.isImproved ? 'success' : 'neutral'}
            />
            <Text $size="xs" $weight="700">
              {column.title}
            </Text>
          </Box>
          <Box
            $css={css`
              display: block;
              max-height: 240px;
              overflow-y: auto;
              font-size: 0.8125rem;
              line-height: 1.5;
              & p,
              & ul,
              & ol {
                margin: 0 0 6px;
              }
              & ul,
              & ol {
                padding-left: 18px;
              }
              & h1,
              & h2,
              & h3,
              & h4 {
                margin: 8px 0 4px;
                font-size: 0.875rem;
              }
            `}
          >
            {/* The answers are Markdown, like in the chat. */}
            <Markdown remarkPlugins={[remarkGfm]}>{column.text}</Markdown>
          </Box>
        </Box>
      ))}
      <Text $size="xs" $variation="secondary">
        {t('Answers shortened for the comparison.')}
      </Text>
    </Box>
  );
};
