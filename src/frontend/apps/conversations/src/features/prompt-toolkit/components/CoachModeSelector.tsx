import { KeyboardEvent, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon } from '@/components';

import { CoachMode } from '../stores/usePromptToolkitStore';

type Tone = 'error' | 'brand' | 'success' | 'info';

const OPTIONS: { mode: CoachMode; icon: string; tone: Tone }[] = [
  { mode: 'off', icon: 'block', tone: 'error' },
  { mode: 'manual', icon: 'touch_app', tone: 'brand' },
  { mode: 'session', icon: 'insights', tone: 'info' },
];

const optionCss = (tone: Tone, isChecked: boolean) => css`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  height: 28px;
  padding: 0 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font: inherit;
  font-size: 0.8125rem;
  font-weight: ${isChecked ? 600 : 400};
  color: ${
    isChecked
      ? `var(--c--contextuals--content--semantic--${tone}--primary)`
      : 'var(--c--contextuals--content--semantic--neutral--secondary)'
  };
  background: ${
    isChecked
      ? `var(--c--contextuals--background--semantic--${tone}--tertiary)`
      : 'transparent'
  };
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 1px;
  }
`;

/**
 * Off / on demand / live, following the WAI-ARIA radio group pattern: one tab
 * stop, arrow keys move and select.
 */
export const CoachModeSelector = ({
  value,
  onChange,
}: {
  value: CoachMode;
  onChange: (mode: CoachMode) => void;
}) => {
  const { t } = useTranslation();
  const buttonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const labels: Record<CoachMode, string> = {
    off: t('Off'),
    manual: t('On demand'),
    session: t('Session review'),
  };

  const onKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    const step =
      event.key === 'ArrowRight' || event.key === 'ArrowDown'
        ? 1
        : event.key === 'ArrowLeft' || event.key === 'ArrowUp'
          ? -1
          : 0;
    if (!step) {
      return;
    }
    event.preventDefault();
    const next = (index + step + OPTIONS.length) % OPTIONS.length;
    onChange(OPTIONS[next].mode);
    buttonsRef.current[next]?.focus();
  };

  return (
    <Box
      role="radiogroup"
      aria-label={t('Coaching mode')}
      $direction="row"
      $gap="2px"
      $css={css`
        align-self: flex-start;
        flex-wrap: wrap;
        padding: 2px;
        border: 1px solid var(--c--contextuals--border--surface--primary);
        border-radius: 8px;
      `}
    >
      {OPTIONS.map((option, index) => {
        const isChecked = value === option.mode;
        return (
          <Box
            key={option.mode}
            as="button"
            type="button"
            role="radio"
            aria-checked={isChecked}
            tabIndex={isChecked ? 0 : -1}
            ref={(element: HTMLButtonElement | null) => {
              buttonsRef.current[index] = element;
            }}
            onClick={() => onChange(option.mode)}
            onKeyDown={(event: KeyboardEvent<HTMLButtonElement>) =>
              onKeyDown(event, index)
            }
            $direction="row"
            $css={optionCss(option.tone, isChecked)}
          >
            <Icon iconName={option.icon} $size="16px" $withThemeInherited />
            {labels[option.mode]}
          </Box>
        );
      })}
    </Box>
  );
};
