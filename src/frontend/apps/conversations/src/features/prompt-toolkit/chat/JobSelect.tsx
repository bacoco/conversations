import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { JOBS, jobById } from '../jobs/jobs';
import { useCoachPrefsStore } from '../stores/useCoachPrefsStore';
import { useProfileStore } from '../stores/useProfileStore';

import { C, LinkButton } from './ui';

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px 12px;
  & > label {
    font-size: 14px;
    font-weight: 700;
    color: ${C.ink};
  }
  & > select {
    font: inherit;
    font-size: 14px;
    padding: 7px 10px;
    border: 1px solid ${C.brandLine};
    border-radius: 10px;
    background: #ffffff;
    color: ${C.ink};
    max-width: 100%;
  }
`;

/**
 * « Quel est votre métier ? » in one line, under the home's cards, until
 * it is chosen (or « Plus tard »); changed afterwards in Nestor's settings.
 */
export const JobSelect = () => {
  const { t } = useTranslation();
  const setJob = useProfileStore((state) => state.setJob);
  const setJobLater = useCoachPrefsStore((state) => state.setJobLater);
  return (
    <Row>
      <label htmlFor="nestor-home-job">{t('What is your job?')}</label>
      <select
        id="nestor-home-job"
        value=""
        onChange={(event) => {
          const chosen = jobById(event.target.value);
          if (chosen) setJob({ id: chosen.id, label: chosen.label });
        }}
      >
        <option value="" disabled>
          {t('Choose…')}
        </option>
        {JOBS.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
      <LinkButton type="button" onClick={() => setJobLater(true)}>
        {t('Later')}
      </LinkButton>
    </Row>
  );
};
