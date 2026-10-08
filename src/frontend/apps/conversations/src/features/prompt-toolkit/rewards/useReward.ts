import { useTranslation } from 'react-i18next';

import { useToast } from '@/components';

import { badgeText } from './labels';
import { RewardEvent, useRewardsStore } from './useRewardsStore';

/** Records what the user did, and celebrates the badges it unlocks. */
export const useReward = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const record = useRewardsStore((state) => state.record);

  return (event: RewardEvent) => {
    for (const badge of record(event)) {
      showToast(
        'success',
        t('New badge: {{title}}!', { title: badgeText(badge, t).title }),
        undefined,
        5000,
      );
    }
  };
};
