import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { C, Choice, Lesson, MainButton } from '../../chat/ui';
import { JobId, casesOf, jobById } from '../../jobs/jobs';
import { useProfileStore } from '../../stores/useProfileStore';
import { useLearnProgressStore } from '../useLearnProgressStore';

import { CasePage, JobChoice } from './CasesView';
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
 * A printable certificate, made in the browser and printed or saved as a
 * PDF by the browser itself: it states the journey, it proves nothing.
 */
const printCertificate = (lines: string[], title: string) => {
  const page = window.open('', '_blank', 'width=800,height=900');
  if (!page) {
    return;
  }
  // Built node by node: the texts are set as text, never as markup.
  const { document: sheet } = page;
  sheet.title = title;
  const style = sheet.createElement('style');
  style.textContent =
    'body{font-family:Marianne,Arial,sans-serif;margin:64px;color:#1e1e2e}h1{font-size:26px;margin:0 0 32px}p{font-size:16px;line-height:1.6;margin:0 0 12px}.note{margin-top:40px;font-size:12px;color:#5f5f72}';
  sheet.head.appendChild(style);
  const heading = sheet.createElement('h1');
  heading.textContent = title;
  sheet.body.appendChild(heading);
  lines.forEach((line, index) => {
    const paragraph = sheet.createElement('p');
    paragraph.textContent = line;
    if (index === lines.length - 1) {
      paragraph.className = 'note';
    }
    sheet.body.appendChild(paragraph);
  });
  page.focus();
  page.print();
};

/** « Mon parcours »: where I am, what comes next, my weekly slot. */
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
  const stepsDone = useLearnProgressStore(
    (state) => state.completedLessons.length,
  );

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
  const casesDone = casesOf(job.id).filter((item) => done[item.id]).length;
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
  const certificate = () =>
    printCertificate(
      [
        t('Job: {{job}}', { job: job.label }),
        t('Level reached in the practical cases: {{level}} of 3', { level }),
        t('Practical cases done: {{count}}', { count: casesDone }),
        t('Steps of the course done: {{count}} of 8', { count: stepsDone }),
        t('Date: {{date}}', {
          date: new Intl.DateTimeFormat(i18n.language, {
            dateStyle: 'long',
          }).format(new Date()),
        }),
        t(
          'Statement made by the agent from their journey in Nestor, on their own computer. It is not checked.',
        ),
      ],
      t('Nestor journey — the Assistant'),
    );

  return (
    <CasePage title={t('My journey')} onBack={onBack}>
      <strong>{job.label}</strong>
      <span>{t('Level reached: {{level}} of 3', { level })}</span>
      <Levels aria-label={t('Levels of the practical cases')}>
        {[1, 2, 3].map((value) => (
          <li key={value} data-done={value <= level}>
            {t('Level {{level}}', { level: value })}
          </li>
        ))}
      </Levels>
      <span>
        {t('Steps of the course done: {{count}} of 8', { count: stepsDone })}
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
      <Choice type="button" disabled={level === 0} onClick={certificate}>
        {t('Print my certificate')}
      </Choice>
      <Note>
        {level === 0
          ? t('Finish a first case to print your certificate.')
          : t(
              'Printed or saved as a PDF by your browser. It states your journey; it is not checked.',
            )}
      </Note>
    </CasePage>
  );
};
