import type { TFunction } from 'i18next';

import type { BadgeId, LevelId } from './useRewardsStore';

export const levelName = (level: LevelId, t: TFunction) =>
  ({
    beginner: t('Beginner'),
    operational: t('Operational'),
    expert: t('Expert'),
  })[level];

/**
 * Each badge: its name, and in one sentence what to do to earn it. The
 * lessons badge says how many lessons the course has.
 */
export const badgeText = (
  badge: BadgeId,
  t: TFunction,
  lessonsTotal = 8,
): { title: string; how: string } =>
  ({
    'first-step': {
      title: t('First step'),
      how: t('Have a request analysed by Nestor.'),
    },
    'first-case': {
      title: t('First practical case'),
      how: t('Finish a practical case of your job.'),
    },
    'great-prompt': {
      title: t('Great prompt'),
      how: t('Get a grade of 80 or more.'),
    },
    rewriter: {
      title: t('Rewriter'),
      how: t('Ask Nestor to improve 3 requests.'),
    },
    librarian: {
      title: t('Librarian'),
      how: t('Complete 5 requests of the library with Nestor.'),
    },
    diligent: {
      title: t('Diligent learner'),
      how: t('Finish the {{count}} lessons of the course.', {
        count: lessonsTotal,
      }),
    },
    'quiz-master': {
      title: t('Quiz master'),
      how: t('Score 80% or more in the full quiz.'),
    },
    reflective: {
      title: t('Reflective'),
      how: t('Ask Nestor for the review of a working session.'),
    },
    challenger: {
      title: t('Challenger'),
      how: t('Succeed in 3 challenges of the course.'),
    },
  })[badge];
