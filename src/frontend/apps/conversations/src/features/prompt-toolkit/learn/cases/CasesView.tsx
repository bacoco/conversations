import { Button } from '@gouvfr-lasuite/cunningham-react';
import { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { Icon, Text } from '@/components';

import { C } from '../../chat/ui';
import { JOBS, casesOf, jobById } from '../../jobs/jobs';
import { useProfileStore } from '../../stores/useProfileStore';
import { CourseFrame } from '../CourseFrame';

import { isUnlocked, useCasesStore } from './casesProgress';

/** A page of the practical cases, framed like the course's pages. */
export const CasePage = ({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: ReactNode;
}) => {
  const { t } = useTranslation();
  return (
    <CourseFrame
      top={
        <Text as="h2" $size="lg" $weight="800" $margin="0">
          {title}
        </Text>
      }
      exit={
        <Button
          color="neutral"
          variant="tertiary"
          onClick={onBack}
          icon={<Icon iconName="arrow_back" $size="18px" />}
        >
          {t('Back to the course')}
        </Button>
      }
    >
      <Body>{children}</Body>
    </CourseFrame>
  );
};

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: 14px;
  color: ${C.ink};
`;

const Intro = styled.p`
  margin: 0;
  font-size: 14px;
  line-height: 1.5;
  color: ${C.muted};
`;

const CaseCard = styled.button<{ $done: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
  padding: 12px 14px;
  border: 1px solid ${({ $done }) => ($done ? '#b5dfc4' : C.line)};
  border-radius: 12px;
  background: ${({ $done }) => ($done ? '#f2faf4' : '#ffffff')};
  font: inherit;
  text-align: left;
  cursor: pointer;
  &:disabled {
    cursor: default;
    opacity: 0.55;
  }
  &:focus-visible {
    outline: 2px solid ${C.brand};
    outline-offset: 2px;
  }
  & > span:first-child {
    flex: none;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    font-weight: 800;
    color: ${C.brandInk};
    background: ${C.brandSoft};
  }
  & > span:nth-child(2) {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
`;

const Select = styled.select`
  padding: 8px 10px;
  border: 1px solid ${C.grey};
  border-radius: 8px;
  font: inherit;
  font-size: 14px;
`;

/** The job, chosen here when it is not yet. */
export const JobChoice = () => {
  const { t } = useTranslation();
  const job = useProfileStore((state) => state.job);
  const setJob = useProfileStore((state) => state.setJob);
  return (
    <Select
      aria-label={t('My field')}
      value={job?.id ?? ''}
      onChange={(event) => {
        const chosen = jobById(event.target.value);
        setJob(chosen ? { id: chosen.id, label: chosen.label } : null);
      }}
    >
      <option value="">{t('Choose your job')}</option>
      {JOBS.map((item) => (
        <option key={item.id} value={item.id}>
          {item.label}
        </option>
      ))}
    </Select>
  );
};

/** "Cas de mon métier": the three cases of the job, level 1 to 3. */
export const CasesView = ({
  onBack,
  onOpen,
}: {
  onBack: () => void;
  onOpen: (caseId: string) => void;
}) => {
  const { t } = useTranslation();
  const job = jobById(useProfileStore((state) => state.job?.id));
  const done = useCasesStore((state) => state.done);

  if (!job) {
    return (
      <CasePage title={t('Cases of my job')} onBack={onBack}>
        <Intro>
          {t(
            'Real tasks of your job, to practise writing your requests yourself. Which is your job?',
          )}
        </Intro>
        <JobChoice />
      </CasePage>
    );
  }
  return (
    <CasePage title={t('Cases of my job')} onBack={onBack}>
      <Intro>
        {t(
          '{{job}}: three real tasks, from the simplest. Each case opens the next level.',
          { job: job.label },
        )}
      </Intro>
      {casesOf(job.id).map((item) => {
        const open = isUnlocked(job.id, item.level, done);
        const isDone = !!done[item.id];
        return (
          <CaseCard
            key={item.id}
            type="button"
            $done={isDone}
            disabled={!open}
            onClick={() => onOpen(item.id)}
          >
            <span aria-hidden="true">
              {isDone ? '✓' : open ? item.level : '🔒'}
            </span>
            <span>
              <strong>{item.title}</strong>
              <Text as="span" $size="sm" $variation="secondary">
                {t('Level {{level}} · about {{minutes}} min', {
                  level: item.level,
                  minutes: item.minutes,
                })}
                {' · '}
                {isDone
                  ? t('Done')
                  : open
                    ? item.task
                    : t('Finish a case of level {{level}} to open it', {
                        level: item.level - 1,
                      })}
              </Text>
            </span>
          </CaseCard>
        );
      })}
      <Intro>{t('Change your job at any time in Nestor’s settings.')}</Intro>
    </CasePage>
  );
};
