import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { css } from 'styled-components';

import { Icon } from '@/components';

import { C, Choice, LinkButton } from '../../chat/ui';
import { caseById, jobById } from '../../jobs/jobs';
import { useProfileStore } from '../../stores/useProfileStore';
import { usePromptToolkitStore } from '../../stores/usePromptToolkitStore';
import { startTraining } from '../../stores/useTrainerStore';
import { cardsToReview, questionsToReview } from '../steps';
import { useCourseSteps, useLearnProgress } from '../useLearnProgress';

import { WEEK_AFTER_DAYS, useCasesStore } from './casesProgress';
import { downloadIcs, weeklySlotIcs } from './ics';
import { WeekAction, weekActions, weekPlanFor } from './programme';

const Card = styled.section`
  display: flex;
  flex-direction: column;
  gap: 6px;
  position: relative;
  padding: 8px 40px 10px 12px;
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
  & small {
    font-size: 12px;
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
  justify-content: space-between;
`;

const List = styled.ol`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin: 0;
  padding: 0;
  list-style: none;
`;

/** One action of the week: a button while to do, a ticked line once done. */
const Row = styled.button<{ $next?: boolean; $done?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  border: 1px solid ${C.brandLine};
  border-radius: 10px;
  background: #ffffff;
  color: ${C.ink};
  font: inherit;
  text-align: left;
  cursor: pointer;
  ${({ $next }) =>
    $next &&
    css`
      border: 2px solid ${C.brand};
      padding: 5px 7px;
    `}
  ${({ $done }) =>
    $done &&
    css`
      border-color: transparent;
      background: ${C.okBg};
      cursor: default;
    `}
  &:focus-visible {
    outline: 2px solid ${C.brand};
    outline-offset: 2px;
  }
  & > span:last-child {
    display: flex;
    flex-direction: column;
    gap: 1px;
    min-width: 0;
  }
  & small {
    font-size: 11.5px;
    color: ${C.muted};
  }
  & strong {
    font-size: 13px;
    line-height: 1.3;
  }
`;

/** The round mark of an action: empty, or ticked once done. */
const Mark = styled.span<{ $done: boolean }>`
  display: flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 2px solid ${({ $done }) => ($done ? C.okInk : C.brandLine)};
  background: ${({ $done }) => ($done ? C.okInk : '#ffffff')};
  color: #ffffff;
`;

/**
 * « Votre semaine », on the home page: a programme over the weeks, with one
 * to three actions each week for the user's job — a practical case whose
 * level rises, the next step of the course, a review when one is due. Each
 * action is ticked once really done. Everything stays in this browser.
 */
export const WeeklyCase = () => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const job = jobById(useProfileStore((state) => state.job?.id));
  const done = useCasesStore((state) => state.done);
  const hidden = useCasesStore((state) => state.weeklyHidden);
  // Offered after a few days of use only: on the first day it discourages.
  const offered = useCasesStore(
    (state) => state.daysUsed.length >= WEEK_AFTER_DAYS,
  );
  const setHidden = useCasesStore((state) => state.setWeeklyHidden);
  const programmeStart = useCasesStore((state) => state.programmeStart);
  const stored = useCasesStore((state) => state.weekPlan);
  const startProgramme = useCasesStore((state) => state.startProgramme);
  const setWeekPlan = useCasesStore((state) => state.setWeekPlan);
  const openLesson = usePromptToolkitStore((state) => state.openLesson);
  const openSection = usePromptToolkitStore((state) => state.openSection);
  const steps = useCourseSteps();
  const progress = useLearnProgress();

  const now = Date.now();
  const plan =
    !hidden && offered && job
      ? weekPlanFor({
          stored,
          start: programmeStart ?? now,
          jobId: job.id,
          done,
          steps,
          progress,
          now,
        })
      : null;
  // The first time it is shown starts the programme; a week's plan is kept.
  useEffect(() => {
    if (plan) {
      startProgramme(plan.at);
      if (plan !== stored) {
        setWeekPlan(plan);
      }
    }
  }, [plan, stored, startProgramme, setWeekPlan]);

  if (hidden || !offered) {
    return null;
  }
  // Hidden for good; it comes back from Nestor's settings.
  const close = (
    <Close
      type="button"
      aria-label={t('Hide your week')}
      title={t('Hide your week')}
      onClick={() => setHidden(true)}
    >
      <Icon iconName="close" $size="18px" $withThemeInherited />
    </Close>
  );

  if (!job || !plan) {
    return (
      <Card aria-label={t('Your week')}>
        <span>{t('Your week')}</span>
        {close}
        <small>
          {t('Choose your job below: each week, a few actions for your job.')}
        </small>
      </Card>
    );
  }
  const actions = weekActions(plan, done, steps, progress, now);
  if (actions.length === 0) {
    return null;
  }
  const doneCount = actions.filter((action) => action.isDone).length;
  const next = actions.find((action) => !action.isDone);
  const dueCount =
    cardsToReview(steps, progress, now).length +
    questionsToReview(steps, progress).length;

  const describe = (action: WeekAction) => {
    if (action.kind === 'case') {
      const item = caseById(action.id);
      return {
        title: item?.title ?? '',
        detail: [
          t('Practical case · level {{level}} · about {{minutes}} min', {
            level: item?.level,
            minutes: item?.minutes,
          }),
          // Done before this week: to do again, for practice.
          done[action.id] && !action.isDone ? t('to practise again') : '',
        ]
          .filter(Boolean)
          .join(' · '),
        open: () => startTraining(action.id),
      };
    }
    if (action.kind === 'lesson') {
      const step = steps.find((item) => item.lesson.id === action.id);
      return {
        title: step?.lesson.title ?? '',
        detail: t('Course · step {{number}}', { number: step?.number }),
        open: () => openLesson(action.id),
      };
    }
    // The course offers the review first, one click away.
    return {
      title: t('Review in 2 minutes'),
      detail: t('{{count}} items to go over · about 2 min', {
        count: dueCount,
      }),
      open: () => openSection('learn'),
    };
  };

  const bookSlot = () =>
    downloadIcs(
      weeklySlotIcs(new Date(), {
        title: t('Nestor: 20 minutes to make progress'),
        description: t(
          'Your week is waiting for you in Nestor’s panel, in the Assistant.',
        ),
      }),
      'nestor-20-minutes.ics',
    );
  return (
    <Card aria-label={t('Your week')}>
      <span>
        {t('Your week')} · {t('Week {{number}}', { number: plan.week })}
      </span>
      {close}
      <List aria-label={t('The actions of the week')}>
        {/* Folded: the next thing to do only; the whole week on demand. */}
        {(open || !next ? actions : [next]).map((action) => {
          const { title, detail, open } = describe(action);
          const content = (
            <>
              <Mark $done={action.isDone} aria-hidden="true">
                {action.isDone && (
                  <Icon iconName="check" $size="16px" $withThemeInherited />
                )}
              </Mark>
              <span>
                <strong>{title}</strong>
                <small>{action.isDone ? t('Done') : detail}</small>
              </span>
            </>
          );
          return (
            <li key={`${action.kind}:${action.id}`}>
              {action.isDone ? (
                <Row as="div" $done>
                  {content}
                </Row>
              ) : (
                <Row type="button" $next={action === next} onClick={open}>
                  {content}
                </Row>
              )}
            </li>
          );
        })}
      </List>
      {!next && (
        <small>{t('All done for this week. New actions next week.')}</small>
      )}
      {next && !open && actions.length > 1 && (
        <LinkButton
          type="button"
          style={{ alignSelf: 'flex-start' }}
          onClick={() => setOpen(true)}
        >
          {t('The whole week ({{count}})', { count: actions.length })}
        </LinkButton>
      )}
      {(open || !next) && (
        <Actions>
          <small>
            {job.label} ·{' '}
            {t('{{done}} of {{total}} done', {
              done: doneCount,
              total: actions.length,
            })}
          </small>
          <Choice type="button" onClick={bookSlot}>
            {t('Book 20 minutes a week')}
          </Choice>
        </Actions>
      )}
    </Card>
  );
};
