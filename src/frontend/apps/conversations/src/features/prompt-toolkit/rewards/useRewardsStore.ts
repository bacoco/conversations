import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** What earns points; each one is counted. */
export type RewardEvent =
  | 'analysis'
  | 'great-prompt'
  | 'improvement'
  | 'fill'
  | 'lesson'
  | 'quiz-passed'
  | 'full-quiz-passed'
  | 'review'
  | 'challenge';

export const POINTS: Record<RewardEvent, number> = {
  analysis: 5,
  'great-prompt': 10,
  improvement: 10,
  fill: 10,
  lesson: 20,
  'quiz-passed': 15,
  'full-quiz-passed': 40,
  review: 15,
  challenge: 20,
};

export type LevelId = 'beginner' | 'operational' | 'expert';

/** Points needed to reach each level. */
export const LEVELS: { id: LevelId; from: number }[] = [
  { id: 'beginner', from: 0 },
  { id: 'operational', from: 100 },
  { id: 'expert', from: 300 },
];

export const levelOf = (points: number) => {
  const index = LEVELS.reduce(
    (found, level, position) => (points >= level.from ? position : found),
    0,
  );
  return { level: LEVELS[index], next: LEVELS[index + 1] ?? null };
};

export type BadgeId =
  | 'first-step'
  | 'great-prompt'
  | 'rewriter'
  | 'librarian'
  | 'diligent'
  | 'quiz-master'
  | 'reflective'
  | 'challenger';

type Counts = Partial<Record<RewardEvent, number>>;

/** Each badge, and when it is earned. */
export const BADGES: {
  id: BadgeId;
  icon: string;
  isEarned: (c: Counts) => boolean;
}[] = [
  { id: 'first-step', icon: 'flag', isEarned: (c) => (c.analysis ?? 0) >= 1 },
  {
    id: 'great-prompt',
    icon: 'star',
    isEarned: (c) => (c['great-prompt'] ?? 0) >= 1,
  },
  {
    id: 'rewriter',
    icon: 'auto_fix_high',
    isEarned: (c) => (c.improvement ?? 0) >= 3,
  },
  { id: 'librarian', icon: 'menu_book', isEarned: (c) => (c.fill ?? 0) >= 5 },
  { id: 'diligent', icon: 'school', isEarned: (c) => (c.lesson ?? 0) >= 7 },
  {
    id: 'quiz-master',
    icon: 'emoji_events',
    isEarned: (c) => (c['full-quiz-passed'] ?? 0) >= 1,
  },
  { id: 'reflective', icon: 'insights', isEarned: (c) => (c.review ?? 0) >= 1 },
  {
    id: 'challenger',
    icon: 'sports_score',
    isEarned: (c) => (c.challenge ?? 0) >= 3,
  },
];

interface RewardsState {
  points: number;
  counts: Counts;
  badges: BadgeId[];
  /** Counts the event, adds its points; returns the badges it unlocked. */
  record: (event: RewardEvent) => BadgeId[];
  reset: () => void;
}

export const useRewardsStore = create<RewardsState>()(
  persist(
    (set, get) => ({
      points: 0,
      counts: {},
      badges: [],
      record: (event) => {
        const state = get();
        const counts = {
          ...state.counts,
          [event]: (state.counts[event] ?? 0) + 1,
        };
        const unlocked = BADGES.filter(
          (badge) => !state.badges.includes(badge.id) && badge.isEarned(counts),
        ).map((badge) => badge.id);
        set({
          counts,
          points: state.points + POINTS[event],
          badges: [...state.badges, ...unlocked],
        });
        return unlocked;
      },
      reset: () => set({ points: 0, counts: {}, badges: [] }),
    }),
    { name: 'prompt-rewards' },
  ),
);
