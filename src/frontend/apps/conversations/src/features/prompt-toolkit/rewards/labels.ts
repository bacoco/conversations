import type { TFunction } from 'i18next';

import type { BadgeId, LevelId } from './useRewardsStore';

export const levelName = (level: LevelId, t: TFunction) =>
  ({
    beginner: t('Beginner'),
    operational: t('Operational'),
    expert: t('Expert'),
  })[level];

export const badgeText = (badge: BadgeId, t: TFunction) =>
  ({
    'first-step': {
      title: t('First step'),
      how: t('Have a prompt analysed by the coach.'),
    },
    'great-prompt': {
      title: t('Great prompt'),
      how: t('Get a grade of 80 or more.'),
    },
    rewriter: {
      title: t('Rewriter'),
      how: t('Use 3 prompts improved by the coach.'),
    },
    librarian: {
      title: t('Librarian'),
      how: t('Complete 5 prompts with Nestor.'),
    },
    diligent: {
      title: t('Diligent learner'),
      how: t('Finish the 7 lessons of the course.'),
    },
    'quiz-master': {
      title: t('Quiz master'),
      how: t('Score 80% or more in the full quiz.'),
    },
    reflective: {
      title: t('Reflective'),
      how: t('Review a whole working session.'),
    },
    challenger: {
      title: t('Challenger'),
      how: t('Succeed in 3 challenges of the course.'),
    },
  })[badge];
