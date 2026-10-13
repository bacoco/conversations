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

/**
 * A practical case done is worth a finished lesson. Cases are kept by their
 * own store (`casesProgress`), so their points are added when the level is
 * computed (`progress.ts`), never recorded twice.
 */
export const CASE_POINTS = 20;

export type LevelId = 'beginner' | 'operational' | 'expert';

/**
 * Points needed to reach each level. Simple thresholds, to be read in one
 * sentence: « Opérationnel » at 100 points (for instance three lessons and
 * two cases), « Expert » at 300 (most of the course, the cases of the job,
 * and the coach used on real requests). A level reached is kept: it never
 * goes down, even if a lesson is reset.
 */
export const LEVELS: { id: LevelId; from: number }[] = [
  { id: 'beginner', from: 0 },
  { id: 'operational', from: 100 },
  { id: 'expert', from: 300 },
];

export const levelIndex = (id: LevelId) =>
  Math.max(
    0,
    LEVELS.findIndex((level) => level.id === id),
  );

export const levelOf = (points: number) => {
  const index = LEVELS.reduce(
    (found, level, position) => (points >= level.from ? position : found),
    0,
  );
  return { level: LEVELS[index], next: LEVELS[index + 1] ?? null };
};

/**
 * Badges shown. « great-prompt » (an old grade the coach no longer gives)
 * stays a known id so that old saved data still reads, but is not shown.
 */
export type BadgeId =
  | 'first-step'
  | 'first-case'
  | 'great-prompt'
  | 'rewriter'
  | 'librarian'
  | 'diligent'
  | 'quiz-master'
  | 'reflective'
  | 'challenger';

export type Counts = Partial<Record<RewardEvent, number>>;

/** What was really done, measured in this browser, to award badges. */
export interface UsageFacts {
  /** Events recorded by the rewards store. */
  counts: Counts;
  rewardPoints: number;
  /** Practical cases done, every job. */
  casesDone: number;
  lessonsDone: number;
  lessonsTotal: number;
  /** Lesson quizzes whose best score is 80% or more. */
  lessonQuizzesPassed: number;
  /** Best score of the full quiz (0-100); null when never taken. */
  fullQuizBest: number | null;
  challengesDone: number;
}

/** The share of right answers a quiz needs to count as passed. */
export const QUIZ_PASS = 80;

/** Each badge shown, and when it is earned: facts, never a guess. */
export const BADGES: {
  id: BadgeId;
  icon: string;
  isEarned: (facts: UsageFacts) => boolean;
}[] = [
  {
    id: 'first-step',
    icon: 'flag',
    isEarned: ({ counts }) => (counts.analysis ?? 0) >= 1,
  },
  {
    id: 'first-case',
    icon: 'work',
    isEarned: ({ casesDone }) => casesDone >= 1,
  },
  {
    id: 'rewriter',
    icon: 'auto_fix_high',
    isEarned: ({ counts }) => (counts.improvement ?? 0) >= 3,
  },
  {
    id: 'librarian',
    icon: 'menu_book',
    isEarned: ({ counts }) => (counts.fill ?? 0) >= 5,
  },
  {
    id: 'diligent',
    icon: 'school',
    isEarned: ({ lessonsDone, lessonsTotal }) =>
      lessonsTotal > 0 && lessonsDone >= lessonsTotal,
  },
  {
    id: 'quiz-master',
    icon: 'emoji_events',
    isEarned: ({ counts, fullQuizBest }) =>
      (fullQuizBest ?? 0) >= QUIZ_PASS ||
      (counts['full-quiz-passed'] ?? 0) >= 1,
  },
  {
    id: 'reflective',
    icon: 'insights',
    isEarned: ({ counts }) => (counts.review ?? 0) >= 1,
  },
  {
    id: 'challenger',
    icon: 'sports_score',
    isEarned: ({ counts, challengesDone }) =>
      Math.max(challengesDone, counts.challenge ?? 0) >= 3,
  },
];

/** Only the counted events: what `record` alone can prove. */
const countsOnly = (counts: Counts): UsageFacts => ({
  counts,
  rewardPoints: 0,
  casesDone: 0,
  lessonsDone: 0,
  lessonsTotal: 0,
  lessonQuizzesPassed: 0,
  fullQuizBest: null,
  challengesDone: 0,
});

/** Session reviews already counted, by message id: enough for months. */
const REVIEWS_KEPT = 100;

interface RewardsState {
  points: number;
  counts: Counts;
  badges: BadgeId[];
  /** The highest level reached: it never goes down. */
  levelReached: LevelId;
  /** Session reviews already counted, so that one counts once. */
  notedReviews: string[];
  /** Counts the event, adds its points; returns the badges it unlocked. */
  record: (event: RewardEvent) => BadgeId[];
  /** A session review shown: counted once per review. */
  noteReview: (reviewId: string) => void;
  /** Keeps a level and badges reached; never lowers what is kept. */
  keep: (level: LevelId, badges: BadgeId[]) => void;
  reset: () => void;
}

export const useRewardsStore = create<RewardsState>()(
  persist(
    (set, get) => ({
      points: 0,
      counts: {},
      badges: [],
      levelReached: 'beginner',
      notedReviews: [],
      record: (event) => {
        const state = get();
        const counts = {
          ...state.counts,
          [event]: (state.counts[event] ?? 0) + 1,
        };
        const unlocked = BADGES.filter(
          (badge) =>
            !state.badges.includes(badge.id) &&
            badge.isEarned(countsOnly(counts)),
        ).map((badge) => badge.id);
        set({
          counts,
          points: state.points + POINTS[event],
          badges: [...state.badges, ...unlocked],
        });
        return unlocked;
      },
      noteReview: (reviewId) => {
        if (!reviewId || get().notedReviews.includes(reviewId)) {
          return;
        }
        set((state) => ({
          notedReviews: [...state.notedReviews, reviewId].slice(-REVIEWS_KEPT),
        }));
        get().record('review');
      },
      keep: (level, badges) =>
        set((state) => {
          const added = badges.filter((id) => !state.badges.includes(id));
          const isHigher = levelIndex(level) > levelIndex(state.levelReached);
          if (!added.length && !isHigher) {
            return state;
          }
          return {
            badges: [...state.badges, ...added],
            levelReached: isHigher ? level : state.levelReached,
          };
        }),
      reset: () =>
        set({
          points: 0,
          counts: {},
          badges: [],
          levelReached: 'beginner',
          notedReviews: [],
        }),
    }),
    { name: 'prompt-rewards' },
  ),
);
