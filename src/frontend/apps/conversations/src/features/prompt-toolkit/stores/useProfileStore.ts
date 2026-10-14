import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import {
  DirectionId,
  InterestId,
  directionById,
  directionRules,
  knownInterests,
} from '../jobs/directions';
import { jobById, jobRules } from '../jobs/jobs';

/** The user's job, one of the ten typical jobs of the ministry. */
export interface Job {
  id: string;
  label: string;
}

interface ProfileState {
  job: Job | null;
  /** Fewer details on screen and simpler words from Nestor. */
  isBeginner: boolean;
  /** Where the user works in the ministry; null: not specified. */
  direction: DirectionId | null;
  /** The work themes the user ticked; empty: not specified. */
  interests: InterestId[];
  /** The « ? » presentation was opened once: its dot goes away. */
  hasSeenPresentation: boolean;
  markPresentationSeen: () => void;
  /** The guided tour was started once: it never starts by itself again. */
  hasSeenTour: boolean;
  markTourSeen: () => void;
  setJob: (job: Job | null) => void;
  setBeginner: (isBeginner: boolean) => void;
  setDirection: (direction: DirectionId | null) => void;
  toggleInterest: (interest: InterestId) => void;
  clearInterests: () => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      job: null,
      isBeginner: false,
      direction: null,
      interests: [],
      hasSeenPresentation: false,
      markPresentationSeen: () => set({ hasSeenPresentation: true }),
      hasSeenTour: false,
      markTourSeen: () => set({ hasSeenTour: true }),
      setJob: (job) => set({ job }),
      setBeginner: (isBeginner) => set({ isBeginner }),
      setDirection: (direction) =>
        set({ direction: directionById(direction)?.id ?? null }),
      toggleInterest: (interest) =>
        set(({ interests }) => ({
          interests: interests.includes(interest)
            ? interests.filter((item) => item !== interest)
            : knownInterests([...interests, interest]),
        })),
      clearInterests: () => set({ interests: [] }),
    }),
    {
      name: 'prompt-profile',
      // v1: the job is one of the ministry's ten jobs; a former choice (a
      // family of the library) is forgotten, the rest is kept.
      // v2: the direction and the work themes, not specified at first; an
      // unknown one is forgotten.
      version: 2,
      migrate: (persisted) => {
        const stored = (persisted ?? {}) as Partial<ProfileState>;
        return {
          ...stored,
          job: jobById(stored.job?.id) ? (stored.job ?? null) : null,
          isBeginner: stored.isBeginner ?? false,
          direction: directionById(stored.direction)?.id ?? null,
          interests: knownInterests(stored.interests),
        } as ProfileState;
      },
    },
  ),
);

/** What Nestor's instructions say about the user, if anything. */
export const profileRules = () => {
  const { job, isBeginner, direction, interests } = useProfileStore.getState();
  const profile = jobById(job?.id);
  return [
    profile ? jobRules(profile) : '',
    directionRules(direction ?? null, interests ?? []),
    isBeginner
      ? 'The user is new to AI assistants: use very simple everyday words and short sentences, one idea at a time.'
      : '',
  ]
    .filter(Boolean)
    .join('\n');
};
