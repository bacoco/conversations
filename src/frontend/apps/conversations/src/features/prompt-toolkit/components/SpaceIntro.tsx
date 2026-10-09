import { css } from 'styled-components';

import { Box, Text } from '@/components';

/**
 * What a space of the panel is for, in user words: Robin's illustration, a
 * title, one sentence and three short pointers to get started.
 */
export const SpaceIntro = ({
  image,
  title,
  text,
  steps,
}: {
  image: string;
  title: string;
  text: string;
  steps: string[];
}) => (
  <Box
    $gap="12px"
    $css={css`
      padding: 14px;
      border-radius: 14px;
      /* Theme colour, so the text stays readable in dark mode. */
      background: var(--c--contextuals--background--semantic--brand--tertiary);
    `}
  >
    <Box $direction="row" $align="center" $gap="14px">
      <img
        src={image}
        alt=""
        width={84}
        height={84}
        style={{
          flex: 'none',
          borderRadius: '50%',
          objectFit: 'cover',
          background: '#ffffff',
        }}
      />
      <Box $gap="4px" $css="min-width: 0;">
        <Text as="h2" $size="md" $weight="700" $margin="0">
          {title}
        </Text>
        <Text $size="sm" $variation="secondary">
          {text}
        </Text>
      </Box>
    </Box>
    <Box
      as="ol"
      $gap="6px"
      $css="margin: 0; padding-left: 20px; font-size: 0.8125rem; line-height: 1.45;"
    >
      {steps.map((step) => (
        <li key={step}>{step}</li>
      ))}
    </Box>
  </Box>
);
