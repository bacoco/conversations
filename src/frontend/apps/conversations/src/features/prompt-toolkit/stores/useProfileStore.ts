import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  setJob: (job: Job | null) => void;
  setBeginner: (isBeginner: boolean) => void;
}

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      job: null,
      isBeginner: false,
      setJob: (job) => set({ job }),
      setBeginner: (isBeginner) => set({ isBeginner }),
    }),
    {
      name: 'prompt-profile',
      // v1: the job is one of the ministry's ten jobs; a former choice (a
      // family of the library) is forgotten, the rest is kept.
      version: 1,
      migrate: (persisted) => {
        const stored = (persisted ?? {}) as Partial<ProfileState>;
        return {
          ...stored,
          job: jobById(stored.job?.id) ? (stored.job ?? null) : null,
          isBeginner: stored.isBeginner ?? false,
        } as ProfileState;
      },
    },
  ),
);

/** What Nestor's instructions say about the user, if anything. */
export const profileRules = () => {
  const { job, isBeginner } = useProfileStore.getState();
  const profile = jobById(job?.id);
  return [
    profile ? jobRules(profile) : '',
    isBeginner
      ? 'The user is new to AI assistants: use very simple everyday words and short sentences, one idea at a time.'
      : '',
  ]
    .filter(Boolean)
    .join('\n');
};
