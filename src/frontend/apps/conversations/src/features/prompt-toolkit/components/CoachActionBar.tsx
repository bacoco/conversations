import { Loader } from '@gouvfr-lasuite/cunningham-react';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import type { CoachMode } from '../stores/usePromptToolkitStore';

export interface CoachAction {
  mode: CoachMode;
  icon: string;
  /** The small word under the icon. */
  label: string;
  /** What a click does, said in full on hover and to screen readers. */
  title: string;
  onClick: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  /** Starts the second group: after the answer. */
  groupStart?: boolean;
  /** Something new is ready there. */
  hasNews?: boolean;
}

const SIZE_PX = 40;

const buttonCss = (isActive: boolean) => css`
  flex: none;
  width: ${SIZE_PX}px;
  height: ${SIZE_PX}px;
  border-radius: 50%;
  border: 2px solid
    ${
      isActive
        ? 'var(--c--contextuals--border--semantic--success--primary, #18753c)'
        : 'var(--c--contextuals--border--surface--primary)'
    };
  cursor: pointer;
  color: ${
    isActive
      ? 'var(--c--contextuals--content--semantic--success--primary, #18753c)'
      : 'var(--c--contextuals--content--semantic--brand--primary)'
  };
  background: ${
    isActive
      ? 'var(--c--contextuals--background--semantic--success--tertiary)'
      : 'var(--c--contextuals--background--surface--primary)'
  };
  &:hover:not(:disabled) {
    filter: brightness(0.96);
  }
  &:disabled {
    cursor: not-allowed;
    color: var(--c--contextuals--content--semantic--disabled--primary);
    background: var(--c--contextuals--background--semantic--disabled--primary);
    border-color: transparent;
  }
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 3px;
  }
`;

/**
 * The coach's four actions, in a bar stuck to the bottom of the panel, level
 * with the message field: always at the same place, each a round icon with a
 * small word under it. The active one is green.
 */
export const CoachActionBar = ({
  actions,
  current,
  label,
}: {
  actions: CoachAction[];
  current: CoachMode;
  label: string;
}) => (
  <Box
    role="toolbar"
    aria-label={label}
    $direction="row"
    $justify="space-around"
    $align="flex-start"
    $css={css`
      position: sticky;
      bottom: 0;
      z-index: 1;
      margin-top: auto;
      /* The bottom padding puts the buttons level with the message field. */
      /* Room on the right for Nestor's round button. */
      padding: 10px 64px 52px 4px;
      border-top: 1px solid var(--c--contextuals--border--surface--primary);
      background: var(--c--contextuals--background--surface--primary);
    `}
  >
    {actions.map((action) => {
      const isActive = action.mode === current;
      return (
        <Box
          key={action.mode}
          $align="center"
          $gap="4px"
          $css={css`
            position: relative;
            flex: 1;
            min-width: 0;
            ${
              action.groupStart &&
              css`
                border-left: 1px solid
                  var(--c--contextuals--border--surface--primary);
              `
            }
          `}
        >
          {action.hasNews && (
            <Box
              aria-hidden="true"
              $css={css`
                position: absolute;
                top: -2px;
                right: calc(50% - 22px);
                width: 10px;
                height: 10px;
                border-radius: 50%;
                background: var(
                  --c--contextuals--background--semantic--success--primary,
                  #18753c
                );
              `}
            />
          )}
          <Box
            as="button"
            type="button"
            aria-label={action.title}
            aria-pressed={isActive}
            title={action.title}
            disabled={action.disabled}
            onClick={action.onClick}
            $align="center"
            $justify="center"
            $css={buttonCss(isActive)}
          >
            {action.isLoading ? (
              <Loader size="small" />
            ) : (
              <Icon iconName={action.icon} $size="22px" $withThemeInherited />
            )}
          </Box>
          <Text
            aria-hidden="true"
            $size="xs"
            $weight={isActive ? '700' : '400'}
            $textAlign="center"
            $variation={action.disabled ? 'secondary' : undefined}
            $css="line-height: 1.2;"
          >
            {action.label}
          </Text>
        </Box>
      );
    })}
  </Box>
);
