import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Text } from '@/components';

import type { Competency } from '../coach/coachApi';
import { Disclosure } from '../components/CoachParts';
import { useCoachHistoryStore } from '../stores/useCoachHistoryStore';

import {
  LESSON_FOR_COMPETENCY,
  LESSON_HINT_THRESHOLD,
} from './lessonForCompetency';
import type { Step } from './steps';

/** The requests looked at: the last ones read by the coach. */
const RECENT_REQUESTS = 5;

type HabitState = 'often' | 'sometimes' | 'try';

const pillCss = (state: HabitState) => css`
  flex: none;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  color: ${
    state === 'often'
      ? 'var(--c--contextuals--content--semantic--success--primary)'
      : state === 'sometimes'
        ? 'var(--c--contextuals--content--semantic--brand--primary)'
        : 'var(--c--contextuals--content--semantic--neutral--secondary)'
  };
  background: ${
    state === 'often'
      ? 'var(--c--contextuals--background--semantic--success--tertiary)'
      : state === 'sometimes'
        ? 'var(--c--contextuals--background--semantic--brand--tertiary)'
        : 'var(--c--contextuals--background--surface--secondary)'
  };
`;

const linkCss = css`
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  font: inherit;
  font-size: 0.8125rem;
  color: var(--c--contextuals--content--semantic--brand--primary);
  text-decoration: underline;
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 2px;
  }
`;

/**
 * What the coach saw in the requests it read, each habit linked to the step
 * of the path that teaches it. Folded: opened only when wanted.
 */
export const CoachHabits = ({
  steps,
  onOpenStep,
}: {
  steps: Step[];
  onOpenStep: (lessonId: string, slide: number) => void;
}) => {
  const { t } = useTranslation();
  const entries = useCoachHistoryStore((state) => state.entries).slice(
    0,
    RECENT_REQUESTS,
  );
  const habits: { key: Competency; label: string }[] = [
    { key: 'task', label: t('Say what you want') },
    { key: 'audience', label: t('Say who it is for') },
    { key: 'format', label: t('Say the expected form') },
    { key: 'sources', label: t('Give the reference text') },
    { key: 'verification', label: t('Ask for things to be checked') },
  ];
  const stateLabels: Record<HabitState, string> = {
    often: t('You often do it'),
    sometimes: t('Sometimes'),
    try: t('To try'),
  };

  // Nothing to show before the coach has read a request.
  if (entries.length === 0) {
    return null;
  }
  return (
    <Disclosure
      label={t('What the coach saw in your requests')}
      icon="insights"
    >
      <Text $size="xs" $variation="secondary">
        {t('In your last {{count}} requests read by the coach.', {
          count: entries.length,
        })}
      </Text>
      <Box as="ul" $css="margin: 0; padding: 0; list-style: none;">
        {habits.map((habit, index) => {
          const count = entries.filter(
            (entry) => entry.competencies[habit.key] >= LESSON_HINT_THRESHOLD,
          ).length;
          const state: HabitState =
            count / entries.length >= 0.6
              ? 'often'
              : count > 0
                ? 'sometimes'
                : 'try';
          const where = LESSON_FOR_COMPETENCY[habit.key];
          const step = steps.find((s) => s.lesson.id === where.lessonId);
          return (
            <Box
              as="li"
              key={habit.key}
              $direction="row"
              $align="center"
              $gap="10px"
              $css={css`
                padding: 9px 0;
                border-bottom: ${
                  index === habits.length - 1
                    ? 'none'
                    : '1px solid var(--c--contextuals--border--surface--primary)'
                };
              `}
            >
              <Box
                $direction="row"
                $align="baseline"
                $gap="8px"
                $css="flex: 1; min-width: 0; flex-wrap: wrap;"
              >
                <Text $size="sm">{habit.label}</Text>
                {state !== 'often' && step && (
                  <Box
                    as="button"
                    type="button"
                    onClick={() => onOpenStep(where.lessonId, where.slide)}
                    $css={linkCss}
                  >
                    {t('Step {{number}}', { number: step.number })}
                  </Box>
                )}
              </Box>
              <Box as="span" $css={pillCss(state)}>
                {stateLabels[state]}
              </Box>
            </Box>
          );
        })}
      </Box>
      <Text $size="xs" $variation="secondary">
        {t('Kept in this browser only.')}
      </Text>
    </Disclosure>
  );
};
