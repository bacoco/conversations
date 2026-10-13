import { useMemo } from 'react';

import { useProfileStore } from '../stores/useProfileStore';

import { jobById } from './jobs';

/**
 * The everyday tasks of the job chosen in Nestor, ready to read as ideas
 * (« Rédiger une fiche de poste »); none when no job is chosen.
 */
export const useJobTasks = (): string[] => {
  const jobId = useProfileStore((state) => state.job?.id);
  return useMemo(
    () =>
      (jobById(jobId)?.tasks ?? []).map(
        (task) => task.charAt(0).toUpperCase() + task.slice(1),
      ),
    [jobId],
  );
};
