import type { TFunction } from 'i18next';

export type ScoreLevel = 'insufficient' | 'progress' | 'good' | 'excellent';

export const scoreLevel = (score: number): ScoreLevel => {
  if (score < 30) return 'insufficient';
  if (score < 60) return 'progress';
  if (score < 80) return 'good';
  return 'excellent';
};

/** Four distinct hues from the Cunningham palette, readable in both themes. */
// No red: a low grade is a starting point, not a failure.
const LEVEL_COLOR: Record<ScoreLevel, string> = {
  insufficient: 'var(--c--globals--colors--warning-500)',
  progress: 'var(--c--globals--colors--brand-550)',
  good: 'var(--c--globals--colors--info-550)',
  excellent: 'var(--c--globals--colors--success-550)',
};

export const levelColor = (score: number) => LEVEL_COLOR[scoreLevel(score)];

export const levelLabel = (score: number, t: TFunction) =>
  ({
    insufficient: t('Good start'),
    progress: t('On the right track'),
    good: t('Very good'),
    excellent: t('Excellent!'),
  })[scoreLevel(score)];
