import { Loader } from '@gouvfr-lasuite/cunningham-react';
import { useTranslation } from 'react-i18next';
import { css, keyframes } from 'styled-components';

import { Box, Text } from '@/components';

const slide = keyframes`
  from { transform: translateX(-100%); }
  to { transform: translateX(250%); }
`;

/** Shown while the coach reads the prompt. Announced politely to screen readers. */
export const CoachStatus = ({
  isLoading,
  loadingLabel,
}: {
  isLoading: boolean;
  loadingLabel?: string;
}) => {
  const { t } = useTranslation();

  if (!isLoading) {
    return null;
  }

  return (
    <Box
      role="status"
      aria-live="polite"
      $gap="6px"
      $css={css`
        position: sticky;
        top: 0;
        z-index: 1;
        padding: 10px 16px;
        border-bottom: 1px solid var(--c--contextuals--border--surface--primary);
        background: var(
          --c--contextuals--background--semantic--brand--tertiary
        );
      `}
    >
      <Box $direction="row" $align="center" $gap="8px">
        <Loader size="small" />
        <Text $size="sm" $weight="600">
          {loadingLabel ?? t('The coach is reading your prompt…')}
        </Text>
      </Box>
      <Box
        aria-hidden="true"
        $css={css`
          position: relative;
          height: 4px;
          border-radius: 2px;
          overflow: hidden;
          background: var(--c--contextuals--border--surface--primary);
        `}
      >
        <Box
          $css={css`
            position: absolute;
            inset: 0;
            width: 40%;
            background: var(
              --c--contextuals--background--semantic--brand--primary
            );
            animation: ${slide} 1.2s ease-in-out infinite;
            @media (prefers-reduced-motion: reduce) {
              animation: none;
            }
          `}
        />
      </Box>
    </Box>
  );
};
