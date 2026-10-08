import { RewardEvent, useRewardsStore } from './useRewardsStore';

/**
 * Records what the user did, silently: points and badges are kept in the
 * browser but not shown for now (no pop-up).
 */
export const useReward = () => {
  const record = useRewardsStore((state) => state.record);
  return (event: RewardEvent) => {
    record(event);
  };
};
