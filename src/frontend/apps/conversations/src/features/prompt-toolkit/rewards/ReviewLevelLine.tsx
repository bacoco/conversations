import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { levelName } from './labels';
import { useProgress } from './useProgress';
import { BADGES, useRewardsStore } from './useRewardsStore';

/**
 * In the session review, one line: the level and the badges. The review
 * itself counts (once, by its id, however often it is shown again).
 */
export const ReviewLevelLine = ({ reviewId }: { reviewId: string }) => {
  const { t } = useTranslation();
  const noteReview = useRewardsStore((state) => state.noteReview);
  const { progress } = useProgress();

  useEffect(() => {
    noteReview(reviewId);
  }, [noteReview, reviewId]);

  return (
    <span>
      {t('Your level: {{level}} · badges: {{earned}} of {{total}}', {
        level: levelName(progress.level.id, t),
        earned: progress.earned.length,
        total: BADGES.length,
      })}
    </span>
  );
};
