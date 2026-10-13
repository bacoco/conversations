import { useTranslation } from 'react-i18next';

import { JOBS } from '../jobs/jobs';
import { useCoachPrefsStore } from '../stores/useCoachPrefsStore';
import { useProfileStore } from '../stores/useProfileStore';

import { Choice, Choices } from './ui';

/**
 * « Quel est votre métier ? »: the ten jobs, and « Plus tard ». Asked once,
 * at the very start; changed afterwards in Nestor's settings.
 */
export const JobChooser = () => {
  const { t } = useTranslation();
  const setJob = useProfileStore((state) => state.setJob);
  const setJobLater = useCoachPrefsStore((state) => state.setJobLater);
  return (
    <>
      <strong>{t('What is your job?')}</strong>
      <Choices>
        {JOBS.map((item) => (
          <Choice
            key={item.id}
            type="button"
            onClick={() => setJob({ id: item.id, label: item.label })}
          >
            {item.label}
          </Choice>
        ))}
        <Choice type="button" $tone="dunno" onClick={() => setJobLater(true)}>
          {t('Later')}
        </Choice>
      </Choices>
    </>
  );
};
