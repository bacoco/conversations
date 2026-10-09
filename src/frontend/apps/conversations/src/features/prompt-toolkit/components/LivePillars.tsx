import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { PromptPillars, checkPillars } from '../coach/coachApi';

/** A pause this long in typing refreshes the lights. */
export const PILLARS_DELAY_MS = 1500;
const MIN_LENGTH = 15;

/**
 * Four lights, one per rule of the DINUM guide, lit as the draft covers it.
 * A small model reads the draft after a pause in typing: a hint, not a grade.
 */
export const LivePillars = ({ text }: { text: string }) => {
  const { t } = useTranslation();
  const [pillars, setPillars] = useState<PromptPillars | null>(null);
  const draft = text.trim();

  useEffect(() => {
    if (draft.length < MIN_LENGTH) {
      setPillars(null);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      checkPillars(draft, controller.signal)
        .then(setPillars)
        .catch(() => undefined);
    }, PILLARS_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [draft]);

  if (!pillars) {
    return null;
  }
  const lights: { key: keyof PromptPillars; label: string }[] = [
    { key: 'context', label: t('Context') },
    { key: 'document', label: t('Reference document') },
    { key: 'instruction', label: t('Precise instruction') },
    { key: 'format', label: t('Expected format') },
  ];
  return (
    <Box $gap="8px" aria-live="polite">
      <Text $size="xs" $variation="secondary">
        {t('As you write: the 4 rules of a good prompt')}
      </Text>
      <Box
        as="ul"
        $direction="row"
        $gap="6px"
        $css="margin: 0; padding: 0; list-style: none; flex-wrap: wrap;"
      >
        {lights.map(({ key, label }) => {
          const isOn = pillars[key];
          return (
            <Box
              as="li"
              key={key}
              $direction="row"
              $align="center"
              $gap="6px"
              $css={css`
                padding: 4px 10px;
                border-radius: 999px;
                font-size: 0.8125rem;
                font-weight: 600;
                color: ${
                  isOn
                    ? 'var(--c--contextuals--content--semantic--success--primary)'
                    : 'var(--c--contextuals--content--semantic--neutral--secondary)'
                };
                border: 1px solid
                  ${
                    isOn
                      ? 'var(--c--contextuals--border--semantic--success--secondary)'
                      : 'var(--c--contextuals--border--surface--primary)'
                  };
                background: ${
                  isOn
                    ? 'var(--c--contextuals--background--semantic--success--tertiary)'
                    : 'transparent'
                };
              `}
            >
              <Icon
                iconName={isOn ? 'check_circle' : 'radio_button_unchecked'}
                $size="16px"
                $withThemeInherited
              />
              <span>
                {label}
                <span className="sr-only">
                  {' '}
                  {isOn ? t('present') : t('missing')}
                </span>
              </span>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};
