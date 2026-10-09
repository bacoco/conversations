import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** The user's job, as one of the prompt library's categories. */
export interface Job {
  id: string;
  label: string;
}

interface ProfileState {
  job: Job | null;
  /** Fewer details on screen and simpler words from Robin. */
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
    { name: 'prompt-profile' },
  ),
);

/** What Robin's instructions say about the user, if anything. */
export const profileRules = () => {
  const { job, isBeginner } = useProfileStore.getState();
  return [
    job
      ? `The user works in this field: ${job.label}. When an example or a part to fill in helps, take it from this field; never change the user's subject.`
      : '',
    isBeginner
      ? 'The user is new to AI assistants: use very simple everyday words and short sentences, one idea at a time.'
      : '',
  ]
    .filter(Boolean)
    .join('\n');
};
