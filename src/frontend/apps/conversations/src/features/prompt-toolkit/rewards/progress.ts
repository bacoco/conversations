import {
  BADGES,
  BadgeId,
  CASE_POINTS,
  LEVELS,
  LevelId,
  UsageFacts,
  levelIndex,
  levelOf,
} from './useRewardsStore';

export type { UsageFacts };

/** What is already kept: the level and the badges reached before. */
export interface KeptProgress {
  level: LevelId;
  badges: readonly BadgeId[];
}

export interface Progress {
  /** Points recorded, plus the practical cases done. */
  points: number;
  level: (typeof LEVELS)[number];
  /** The next level; null at the highest. */
  next: (typeof LEVELS)[number] | null;
  /** Badges earned, in the order they are shown. */
  earned: BadgeId[];
  /** Badges not earned yet, in the order they are shown. */
  missing: BadgeId[];
}

/**
 * The level and the badges, from what was really done. The level is the
 * one the points reach, or the one already kept if higher: it never goes
 * down. A badge earned once stays.
 */
export const computeProgress = (
  facts: UsageFacts,
  kept: KeptProgress,
): Progress => {
  const points = facts.rewardPoints + CASE_POINTS * facts.casesDone;
  const index = Math.max(
    levelIndex(levelOf(points).level.id),
    levelIndex(kept.level),
  );
  const isEarned = (badge: (typeof BADGES)[number]) =>
    kept.badges.includes(badge.id) || badge.isEarned(facts);
  return {
    points,
    level: LEVELS[index],
    next: LEVELS[index + 1] ?? null,
    earned: BADGES.filter(isEarned).map((badge) => badge.id),
    missing: BADGES.filter((badge) => !isEarned(badge)).map(
      (badge) => badge.id,
    ),
  };
};
