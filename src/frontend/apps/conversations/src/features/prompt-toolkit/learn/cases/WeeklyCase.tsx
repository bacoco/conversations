import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { Icon } from '@/components';

import { C, Choice, MainButton } from '../../chat/ui';
import { jobById } from '../../jobs/jobs';
import { useProfileStore } from '../../stores/useProfileStore';
import { startTraining } from '../../stores/useTrainerStore';

import { useCasesStore, weeklyCase } from './casesProgress';
import { downloadIcs, weeklySlotIcs } from './ics';

const Card = styled.section`
  display: flex;
  flex-direction: column;
  gap: 8px;
  position: relative;
  padding: 10px 44px 12px 14px;
  border: 1px solid ${C.brandLine};
  border-radius: 14px;
  background: #f7f6ff;
  color: ${C.ink};
  & > span:first-child {
    font-size: 12px;
    font-weight: 700;
    color: ${C.brandInk};
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  & > strong {
    font-size: 16px;
  }
  & > small {
    font-size: 13px;
    color: ${C.muted};
  }
`;

const Close = styled.button`
  position: absolute;
  top: 8px;
  right: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: ${C.muted};
  cursor: pointer;
  &:hover {
    background: #ffffff;
  }
  &:focus-visible {
    outline: 2px solid ${C.brand};
  }
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
`;

/**
 * « Le cas de la semaine », on the home page: one real task of the user's
 * job, chosen in the browser from their level. Nothing is sent.
 */
export const WeeklyCase = () => {
  const { t } = useTranslation();
  const job = jobById(useProfileStore((state) => state.job?.id));
  const done = useCasesStore((state) => state.done);
  const hidden = useCasesStore((state) => state.weeklyHidden);
  const setHidden = useCasesStore((state) => state.setWeeklyHidden);

  if (hidden) {
    return null;
  }
  // Hidden for good; it comes back from Nestor's settings.
  const close = (
    <Close
      type="button"
      aria-label={t('Hide the case of the week')}
      title={t('Hide the case of the week')}
      onClick={() => setHidden(true)}
    >
      <Icon iconName="close" $size="18px" $withThemeInherited />
    </Close>
  );

  if (!job) {
    return (
      <Card aria-label={t('The case of the week')}>
        <span>{t('The case of the week')}</span>
        {close}
        <small>
          {t('Choose your job below: each week, a case of your job.')}
        </small>
      </Card>
    );
  }
  const item = weeklyCase(job.id, done);
  if (!item) {
    return null;
  }
  const bookSlot = () =>
    downloadIcs(
      weeklySlotIcs(new Date(), {
        title: t('Nestor: 20 minutes to make progress'),
        description: t(
          'The case of the week is waiting for you in Nestor’s panel, in the Assistant.',
        ),
      }),
      'nestor-20-minutes.ics',
    );
  return (
    <Card aria-label={t('The case of the week')}>
      <span>{t('The case of the week')}</span>
      {close}
      <strong>{item.title}</strong>
      <small>
        {job.label} ·{' '}
        {t('Level {{level}} · about {{minutes}} min', {
          level: item.level,
          minutes: item.minutes,
        })}
        {done[item.id] ? ` · ${t('to practise again')}` : ''}
      </small>
      <Actions>
        <MainButton type="button" onClick={() => startTraining(item.id)}>
          {t('Start this case')}
        </MainButton>
        <Choice type="button" onClick={bookSlot}>
          {t('Book 20 minutes a week')}
        </Choice>
      </Actions>
    </Card>
  );
};
