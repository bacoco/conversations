import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Text } from '@/components';

import type { Competency } from '../coach/coachApi';
import { NESTOR_AVATAR_URL } from '../components/PanelHome';

import type { Stage } from './steps';
import { DAY_MS, SkillLevel } from './useLearnProgressStore';

export const ILLUSTRATION_BACKGROUND = '#f7f8fd';

/** Nestor's word, with his face. */
export const FoxSays = ({ children }: { children: ReactNode }) => (
  <Box $direction="row" $align="flex-end" $gap="8px">
    <img
      src={NESTOR_AVATAR_URL}
      alt=""
      width={28}
      height={28}
      style={{ flex: 'none', borderRadius: '50%' }}
    />
    <Box
      $css={css`
        padding: 10px 12px;
        border-radius: 12px 12px 12px 4px;
        font-size: 0.875rem;
        line-height: 1.5;
        background: var(--c--contextuals--background--surface--tertiary);
      `}
    >
      {children}
    </Box>
  </Box>
);

export const useStageLabels = (): Record<Stage, string> => {
  const { t } = useTranslation();
  return {
    read: t('Read'),
    cards: t('Remember'),
    quiz: t('Check'),
    practice: t('Practise'),
  };
};

/** Each competency as a habit, in plain words. */
export const useSkillLabels = (): Record<Competency, string> => {
  const { t } = useTranslation();
  return {
    task: t('Say what you want'),
    context: t('Give the context'),
    audience: t('Say who it is for'),
    format: t('Say the expected form'),
    constraints: t('Set the limits'),
    sources: t('Give the reference text'),
    examples: t('Show an example'),
    verification: t('Ask for things to be checked'),
  };
};

export const useLevelLabels = (): Record<SkillLevel, string> => {
  const { t } = useTranslation();
  return {
    0: t('To discover'),
    1: t('Discovered'),
    2: t('Acquired'),
    3: t('Mastered'),
  };
};

export const levelPillCss = (level: SkillLevel) => css`
  flex: none;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  color: ${
    level === 3
      ? 'var(--c--contextuals--content--semantic--success--primary)'
      : level === 2
        ? 'var(--c--contextuals--content--semantic--brand--primary)'
        : 'var(--c--contextuals--content--semantic--neutral--secondary)'
  };
  background: ${
    level === 3
      ? 'var(--c--contextuals--background--semantic--success--tertiary)'
      : level === 2
        ? 'var(--c--contextuals--background--semantic--brand--tertiary)'
        : 'var(--c--contextuals--background--surface--secondary)'
  };
`;

/** The start of the week (Monday, 0:00) of a moment, in local time. */
export const weekStart = (time: number) => {
  const date = new Date(time);
  const day = (date.getDay() + 6) % 7;
  date.setHours(0, 0, 0, 0);
  return date.getTime() - day * DAY_MS;
};

/**
 * This week's sessions, and the weeks in a row where the goal was met. The
 * current week does not break the series while it is not over.
 */
export const weekStats = (sessions: number[], goal: number, now: number) => {
  const thisWeek = weekStart(now);
  const countIn = (start: number) =>
    sessions.filter((time) => time >= start && time < start + 7 * DAY_MS)
      .length;
  const doneThisWeek = countIn(thisWeek);
  let streak = doneThisWeek >= goal ? 1 : 0;
  for (let start = thisWeek - 7 * DAY_MS; ; start -= 7 * DAY_MS) {
    if (countIn(start) >= goal) {
      streak += 1;
    } else {
      break;
    }
    if (streak > 520) {
      break;
    }
  }
  return { doneThisWeek, streak };
};

/** A word to celebrate the first sessions, the ones that count most. */
export const useCelebration = () => {
  const { t } = useTranslation();
  return (sessionsDone: number) =>
    sessionsDone === 1
      ? t('Your first session: the hardest part is done.')
      : sessionsDone === 3
        ? t('Third session: it is becoming a habit.')
        : sessionsDone === 10
          ? t('Ten sessions! You are learning for real.')
          : sessionsDone === 25
            ? t('Twenty-five sessions: impressive regularity.')
            : null;
};

/** The section title used across the course screens. */
export const SectionTitle = ({ children }: { children: string }) => (
  <Text as="h3" $size="md" $weight="700" $margin="0">
    {children}
  </Text>
);
