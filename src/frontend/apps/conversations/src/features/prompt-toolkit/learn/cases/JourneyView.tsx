import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { C, Choice, Lesson, MainButton } from '../../chat/ui';
import { JobId, casesOf, jobById } from '../../jobs/jobs';
import { LevelCard } from '../../rewards/LevelCard';
import { useProgress } from '../../rewards/useProgress';
import { useProfileStore } from '../../stores/useProfileStore';

import { CasePage, JobChoice } from './CasesView';
import { attestationText, hasUse, printAttestation } from './attestation';
import { nextCase, useCasesStore } from './casesProgress';
import { downloadIcs, weeklySlotIcs } from './ics';

const Levels = styled.ol`
  display: flex;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
  & > li {
    flex: 1;
    padding: 10px;
    border-radius: 10px;
    text-align: center;
    font-size: 13px;
    background: ${C.soft};
  }
  & > li[data-done='true'] {
    color: #ffffff;
    background: ${C.brand};
  }
`;

const Note = styled.p`
  margin: 0;
  font-size: 12px;
  color: ${C.muted};
  line-height: 1.45;
`;

/** The highest level with a case done (0 when none). */
const levelReached = (jobId: JobId, done: Record<string, number>) =>
  Math.max(
    0,
    ...casesOf(jobId)
      .filter((item) => done[item.id])
      .map((item) => item.level),
  );

/**
 * « Mon parcours »: my level and badges, where I am in the cases of my
 * job, what comes next, my weekly slot and my certificate of use.
 */
export const JourneyView = ({
  onBack,
  onOpen,
}: {
  onBack: () => void;
  onOpen: (caseId: string) => void;
}) => {
  const { t, i18n } = useTranslation();
  const job = jobById(useProfileStore((state) => state.job?.id));
  const done = useCasesStore((state) => state.done);
  const { facts, progress } = useProgress();

  if (!job) {
    return (
      <CasePage title={t('My journey')} onBack={onBack}>
        <Note>{t('Choose your job: your journey follows it.')}</Note>
        <JobChoice />
      </CasePage>
    );
  }
  const level = levelReached(job.id, done);
  const next = nextCase(job.id, done);
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
  const canCertify = hasUse(facts, progress);
  const certificate = () =>
    printAttestation(
      attestationText({
        t,
        language: i18n.language,
        job: job.label,
        casesLevel: level,
        facts,
        progress,
        date: new Date(),
      }),
    );

  return (
    <CasePage title={t('My journey')} onBack={onBack}>
      <LevelCard progress={progress} lessonsTotal={facts.lessonsTotal} />
      <strong>{t('Practical cases: {{job}}', { job: job.label })}</strong>
      <span>{t('Level reached: {{level}} of 3', { level })}</span>
      <Levels aria-label={t('Levels of the practical cases')}>
        {[1, 2, 3].map((value) => (
          <li key={value} data-done={value <= level}>
            {t('Level {{level}}', { level: value })}
          </li>
        ))}
      </Levels>
      <span>
        {t('Lessons of the course finished: {{done}} of {{total}}', {
          done: facts.lessonsDone,
          total: facts.lessonsTotal,
        })}
      </span>
      {next ? (
        <Lesson>
          <strong>{t('Next:')}</strong>
          <span>{next.title}</span>
          <Choice type="button" onClick={() => onOpen(next.id)}>
            {t('Start this case')}
          </Choice>
        </Lesson>
      ) : (
        <Lesson>
          <strong>{t('All the cases of your job are done.')}</strong>
          <span>{t('The case of the week lets you practise again.')}</span>
        </Lesson>
      )}
      <MainButton type="button" onClick={bookSlot}>
        {t('Book 20 minutes a week')}
      </MainButton>
      <Note>
        {t(
          'A diary file to open in Outlook: every Thursday at 10 a.m., changeable. Nothing is sent.',
        )}
      </Note>
      <Choice type="button" disabled={!canCertify} onClick={certificate}>
        {t('Print my certificate')}
      </Choice>
      <Note>
        {canCertify
          ? t(
              'It states what you did with Nestor, as recorded in this browser: your level, cases, lessons, quizzes and requests. Printed or saved as a PDF by your browser; it is not checked by anyone else.',
            )
          : t('Use Nestor first: your certificate will state what you did.')}
      </Note>
    </CasePage>
  );
};
