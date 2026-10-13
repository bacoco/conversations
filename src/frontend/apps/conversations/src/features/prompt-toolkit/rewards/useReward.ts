import { RewardEvent, useRewardsStore } from './useRewardsStore';

/**
 * Records what the user did, quietly: no pop-up. Points, level and badges
 * are kept in this browser and shown in « Mon parcours » and in the
 * session review (`LevelCard`, `ReviewLevelLine`).
 */
export const useReward = () => {
  const record = useRewardsStore((state) => state.record);
  return (event: RewardEvent) => {
    record(event);
  };
};
