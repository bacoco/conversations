import { Loader } from '@gouvfr-lasuite/cunningham-react';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

const SIZE_PX = 44;

/**
 * Round analyse button, in a bar stuck to the bottom of the coach: always at
 * the same place, next to the message field, and never over the content.
 */
export const FloatingAnalyzeButton = ({
  label,
  onClick,
  disabled,
  isLoading,
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  isLoading: boolean;
}) => (
  <Box
    $direction="row"
    $align="center"
    $gap="10px"
    $css={css`
      position: sticky;
      bottom: 0;
      z-index: 1;
      margin-top: auto;
      padding: 12px 16px;
      border-top: 1px solid var(--c--contextuals--border--surface--primary);
      background: var(--c--contextuals--background--surface--primary);
    `}
  >
    <Box
      as="button"
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      $align="center"
      $justify="center"
      $css={css`
        flex: none;
        width: ${SIZE_PX}px;
        height: ${SIZE_PX}px;
        border: none;
        border-radius: 50%;
        cursor: pointer;
        color: var(--c--contextuals--content--semantic--brand--on-brand);
        background: var(--c--contextuals--background--semantic--brand--primary);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        &:hover:not(:disabled) {
          filter: brightness(1.1);
        }
        &:disabled {
          cursor: not-allowed;
          color: var(--c--contextuals--content--semantic--disabled--primary);
          background: var(
            --c--contextuals--background--semantic--disabled--primary
          );
          box-shadow: none;
        }
        &:focus-visible {
          outline: 2px solid
            var(--c--contextuals--border--semantic--brand--primary);
          outline-offset: 3px;
        }
      `}
    >
      {isLoading ? (
        <Loader size="small" />
      ) : (
        <Icon iconName="grading" $size="22px" $withThemeInherited />
      )}
    </Box>
    {/* The label stays visible: no need to hover to know what it does. */}
    <Text
      aria-hidden="true"
      $size="sm"
      $weight="600"
      $variation={disabled ? 'secondary' : undefined}
    >
      {label}
    </Text>
  </Box>
);
