import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Text } from '@/components';

import type { CoachMode } from '../stores/usePromptToolkitStore';

import {
  NESTOR_ANALYSIS_URL,
  NESTOR_HELP_URL,
  NESTOR_INSTANT_URL,
} from './PanelHome';

const stepBadgeCss = css`
  flex: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  font-size: 0.875rem;
  font-weight: 700;
  color: var(--c--contextuals--content--semantic--brand--on-brand);
  background: var(--c--contextuals--background--semantic--brand--primary);
`;

/** Nestor introduces himself and says what to do, while the coach waits. */
export const CoachIntro = ({ mode = 'manual' }: { mode?: CoachMode }) => {
  const { t } = useTranslation();
  const write = t(
    'Write your request in the message field, at the bottom of the chat.',
  );
  const steps =
    mode === 'assist'
      ? [
          write,
          t('Click the round button that appears.'),
          t(
            'I write several versions and find matching prompts in the library.',
          ),
        ]
      : mode === 'instant'
        ? [
            write,
            t('The closest requests appear here as you type.'),
            t('Click one to put it in the message field.'),
          ]
        : [
            write,
            t('Click the round button that appears: I analyse your prompt.'),
            t('I suggest a better version, ready to send.'),
          ];
  const image =
    mode === 'assist'
      ? NESTOR_HELP_URL
      : mode === 'instant'
        ? NESTOR_INSTANT_URL
        : NESTOR_ANALYSIS_URL;
  const title =
    mode === 'assist'
      ? t('Prompt help')
      : mode === 'instant'
        ? t('As you type')
        : t('Prompt analysis');

  return (
    <Box
      $align="center"
      $gap="20px"
      $css={css`
        flex: 1;
        justify-content: center;
        padding: 32px 24px;
      `}
    >
      <Box
        $css={css`
          width: min(240px, 65%);
          aspect-ratio: 1;
          border-radius: 50%;
          overflow: hidden;
          background: #f7f8fd;
        `}
      >
        <img
          src={image}
          alt=""
          style={{
            display: 'block',
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </Box>
      <Box $align="center" $gap="6px" $css="max-width: 360px;">
        <Text as="h2" $size="lg" $weight="700" $margin="0" $textAlign="center">
          {title}
        </Text>
        <Text $size="sm" $variation="secondary" $textAlign="center">
          {t('A good prompt gets a better answer. Here is how I help you:')}
        </Text>
      </Box>
      <Box
        as="ol"
        $gap="14px"
        $css="margin: 0; padding: 0; list-style: none; max-width: 360px; width: 100%;"
      >
        {steps.map((step, index) => (
          <Box as="li" key={step} $direction="row" $align="center" $gap="12px">
            <Box $align="center" $justify="center" $css={stepBadgeCss}>
              {index + 1}
            </Box>
            <Text $size="sm">{step}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );
};
