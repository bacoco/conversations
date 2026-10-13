import { act, fireEvent, render, screen } from '@testing-library/react';

import { casesOf } from '../jobs/jobs';
import { WeeklyCase } from '../learn/cases/WeeklyCase';
import { useCasesStore } from '../learn/cases/casesProgress';
import {
  WeekPlan,
  planWeek,
  programmeWeek,
  weekActions,
  weekPlanFor,
} from '../learn/cases/programme';
import { getChallenges } from '../learn/challenges';
import { getCourseContent } from '../learn/content';
import { ProgressSnapshot, buildSteps } from '../learn/steps';
import { useLearnProgressStore } from '../learn/useLearnProgressStore';
import { useProfileStore } from '../stores/useProfileStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';
import { useTrainerStore } from '../stores/useTrainerStore';

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const at = (text: string) => new Date(text).getTime();
// Tuesday 13 October 2026, in the morning.
const TUESDAY = at('2026-10-13T09:00:00');

const steps = buildSteps(getCourseContent(), getChallenges(), true);
const [one, two] = casesOf('rh');
const emptyProgress: ProgressSnapshot = {
  completedLessons: [],
  bestQuizScores: {},
  knownCards: [],
  completedChallenges: [],
  doneStages: {},
  currentStep: null,
  cardSchedule: {},
  questionsToReview: {},
  checkpointsDone: [],
};
/** Every stage of a step done, its cards known: the step is completed. */
const stepDone = (index: number): ProgressSnapshot => ({
  ...emptyProgress,
  knownCards: steps[index].cards.map((card) => card.id),
  doneStages: { [steps[index].lesson.id]: steps[index].stages },
});
/** A card of the first step due again. */
const cardDue = (progress: ProgressSnapshot, due: number) => ({
  ...progress,
  cardSchedule: { [steps[0].cards[0].id]: { box: 1, due } },
});

describe('programmeWeek — one week per calendar week', () => {
  it('is week 1 for the whole calendar week of the start', () => {
    expect(programmeWeek(TUESDAY, TUESDAY)).toBe(1);
    expect(programmeWeek(TUESDAY, at('2026-10-18T23:00:00'))).toBe(1);
  });

  it('goes on each Monday, even across a change of hour', () => {
    expect(programmeWeek(TUESDAY, at('2026-10-19T00:05:00'))).toBe(2);
    // Summer time ends on 25 October 2026.
    expect(programmeWeek(TUESDAY, at('2026-10-26T08:00:00'))).toBe(3);
  });

  it('weeks missed are skipped: the programme resumes at this week', () => {
    expect(programmeWeek(TUESDAY, at('2026-11-12T10:00:00'))).toBe(5);
  });

  it('never goes below week 1, even with a clock set back', () => {
    expect(programmeWeek(TUESDAY, at('2026-09-01T10:00:00'))).toBe(1);
  });
});

describe('planWeek — 1 to 3 actions for the week', () => {
  it('the next case of the job and the next lesson; no review when none is due', () => {
    const plan = planWeek(2, 'rh', {}, steps, emptyProgress, TUESDAY);
    expect(plan).toEqual({
      week: 2,
      jobId: 'rh',
      at: TUESDAY,
      caseId: one.id,
      lessonId: steps[0].lesson.id,
      review: false,
    });
  });

  it('the case rises in level once the one below is done', () => {
    const plan = planWeek(
      3,
      'rh',
      { [one.id]: 1 },
      steps,
      emptyProgress,
      TUESDAY,
    );
    expect(plan.caseId).toBe(two.id);
    expect(two.level).toBeGreaterThanOrEqual(one.level);
  });

  it('the next lesson not completed; a review when cards are due', () => {
    const plan = planWeek(
      1,
      'rh',
      {},
      steps,
      cardDue(stepDone(0), TUESDAY - 1000),
      TUESDAY,
    );
    expect(plan.lessonId).toBe(steps[1].lesson.id);
    expect(plan.review).toBe(true);
  });

  it('no lesson once the whole course is completed', () => {
    const all: ProgressSnapshot = {
      ...emptyProgress,
      doneStages: Object.fromEntries(
        steps.map((step) => [step.lesson.id, step.stages]),
      ),
    };
    expect(planWeek(1, 'rh', {}, steps, all, TUESDAY).lessonId).toBeNull();
  });
});

describe('weekPlanFor — the plan stays the same all week', () => {
  const kept: WeekPlan = {
    week: 1,
    jobId: 'rh',
    at: TUESDAY,
    caseId: one.id,
    lessonId: steps[0].lesson.id,
    review: false,
  };
  const input = {
    start: TUESDAY,
    jobId: 'rh' as const,
    done: { [one.id]: TUESDAY + 1000 },
    steps,
    progress: stepDone(0),
  };

  it('keeps the plan of this week, even once its actions are done', () => {
    expect(
      weekPlanFor({ ...input, stored: kept, now: at('2026-10-15T10:00:00') }),
    ).toBe(kept);
  });

  it('a new plan the next week, with what was left', () => {
    const plan = weekPlanFor({
      ...input,
      done: {},
      stored: kept,
      now: at('2026-10-20T10:00:00'),
    });
    expect(plan.week).toBe(2);
    expect(plan.caseId).toBe(one.id);
    expect(plan.lessonId).toBe(steps[1].lesson.id);
  });

  it('never goes back, even with a clock set back', () => {
    const later = { ...kept, week: 4 };
    expect(weekPlanFor({ ...input, stored: later, now: TUESDAY })).toBe(later);
  });

  it('a new plan for a new job, the same week', () => {
    const plan = weekPlanFor({
      ...input,
      jobId: 'comptable',
      stored: kept,
      now: TUESDAY,
    });
    expect(plan.week).toBe(1);
    expect(plan.jobId).toBe('comptable');
    expect(plan.caseId).toBe(casesOf('comptable')[0].id);
  });
});

describe('weekActions — ticked only once really done', () => {
  const plan: WeekPlan = {
    week: 1,
    jobId: 'rh',
    at: TUESDAY,
    caseId: one.id,
    lessonId: steps[0].lesson.id,
    review: true,
  };
  const progress = cardDue(emptyProgress, TUESDAY - 1000);

  it('nothing done yet', () => {
    expect(
      weekActions(plan, {}, steps, progress, TUESDAY).map((action) => [
        action.kind,
        action.isDone,
      ]),
    ).toEqual([
      ['case', false],
      ['lesson', false],
      ['review', false],
    ]);
  });

  it('the case finished, the step completed, nothing left to review', () => {
    const actions = weekActions(
      plan,
      { [one.id]: TUESDAY + 1000 },
      steps,
      cardDue(stepDone(0), TUESDAY + 3 * 24 * 3600 * 1000),
      TUESDAY + 2000,
    );
    expect(actions.every((action) => action.isDone)).toBe(true);
  });

  it('a case done before this week is to practise again', () => {
    const [action] = weekActions(
      plan,
      { [one.id]: TUESDAY - 1000 },
      steps,
      progress,
      TUESDAY,
    );
    expect(action.isDone).toBe(false);
  });

  it('a lesson only read is not completed yet', () => {
    const actions = weekActions(
      plan,
      {},
      steps,
      { ...progress, completedLessons: [steps[0].lesson.id] },
      TUESDAY,
    );
    expect(actions[1].isDone).toBe(false);
  });
});

/** The whole week, unfolded when the card offers it. */
const expandWeek = () => {
  const more = screen.queryByRole('button', { name: /The whole week/ });
  if (more) fireEvent.click(more);
};

describe('WeeklyCase — « Votre semaine » on the home page', () => {
  const openLesson = vi.fn();
  const openSection = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(TUESDAY);
    useCasesStore.setState({
      done: {},
      weeklyHidden: false,
      programmeStart: null,
      weekPlan: null,
      // Nestor used on three days already: the week is offered.
      daysUsed: ['2026-10-01', '2026-10-05', '2026-10-08'],
    });
    useLearnProgressStore.getState().reset();
    useProfileStore.setState({ job: { id: 'rh', label: 'Gestionnaire RH' } });
    usePromptToolkitStore.setState({ openLesson, openSection });
    openLesson.mockClear();
    openSection.mockClear();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows only the next action, the whole week one click away', () => {
    render(<WeeklyCase />);
    expect(
      screen.getByRole('button', { name: new RegExp(one.title) }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: new RegExp(steps[0].lesson.title) }),
    ).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /The whole week/ }));
    expect(
      screen.getByRole('button', { name: new RegExp(steps[0].lesson.title) }),
    ).toBeInTheDocument();
  });

  it('shows week 1 with its actions, and remembers when it started', () => {
    render(<WeeklyCase />);
    expandWeek();
    expect(screen.getByText(/^Your week ·/)).toBeInTheDocument();
    expect(screen.getByText(/Week \{\{number\}\}/)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: new RegExp(one.title) }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: new RegExp(steps[0].lesson.title) }),
    ).toBeInTheDocument();
    expect(screen.queryByText('Review in 2 minutes')).not.toBeInTheDocument();
    expect(useCasesStore.getState().programmeStart).toBe(TUESDAY);
    expect(useCasesStore.getState().weekPlan).toMatchObject({
      week: 1,
      caseId: one.id,
    });
  });

  it('the case opens the trainer', () => {
    render(<WeeklyCase />);
    expandWeek();
    fireEvent.click(
      screen.getByRole('button', { name: new RegExp(one.title) }),
    );
    expect(useTrainerStore.getState()).toMatchObject({
      caseId: one.id,
      step: 'read',
    });
    expect(openSection).toHaveBeenCalledWith('coach');
    useTrainerStore.getState().stop();
  });

  it('the lesson opens in the course', () => {
    render(<WeeklyCase />);
    expandWeek();
    fireEvent.click(
      screen.getByRole('button', { name: new RegExp(steps[0].lesson.title) }),
    );
    expect(openLesson).toHaveBeenCalledWith(steps[0].lesson.id);
  });

  it('the review, when cards are due, opens the course', () => {
    useLearnProgressStore.setState({
      cardSchedule: { [steps[0].cards[0].id]: { box: 1, due: TUESDAY - 1 } },
    });
    render(<WeeklyCase />);
    expandWeek();
    fireEvent.click(
      screen.getByRole('button', { name: /Review in 2 minutes/ }),
    );
    expect(openSection).toHaveBeenCalledWith('learn');
  });

  it('an action is ticked once done, not on a click', () => {
    render(<WeeklyCase />);
    expandWeek();
    fireEvent.click(
      screen.getByRole('button', { name: new RegExp(one.title) }),
    );
    useTrainerStore.getState().stop();
    expect(
      screen.getByRole('button', { name: new RegExp(one.title) }),
    ).toBeInTheDocument();
    expect(screen.getByText(/{{done}} of {{total}} done/)).toBeInTheDocument();
    vi.setSystemTime(TUESDAY + 60_000);
    act(() => useCasesStore.getState().markDone(one.id));
    // Done: no button any more, a tick and the word « Done ».
    expect(
      screen.queryByRole('button', { name: new RegExp(one.title) }),
    ).not.toBeInTheDocument();
    expect(screen.getByText(one.title)).toBeInTheDocument();
    expect(screen.getByText('Done')).toBeInTheDocument();
  });

  it('once all is done, says the week is complete', () => {
    render(<WeeklyCase />);
    expandWeek();
    vi.setSystemTime(TUESDAY + 60_000);
    act(() => {
      useCasesStore.getState().markDone(one.id);
      useLearnProgressStore.setState({
        doneStages: { [steps[0].lesson.id]: steps[0].stages },
      });
    });
    expect(
      screen.getByText('All done for this week. New actions next week.'),
    ).toBeInTheDocument();
  });

  it('the next calendar week shows week 2', () => {
    useCasesStore.setState({ programmeStart: at('2026-10-06T10:00:00') });
    render(<WeeklyCase />);
    expandWeek();
    expect(useCasesStore.getState().weekPlan?.week).toBe(2);
  });

  it('asks for the job first', () => {
    useProfileStore.setState({ job: null });
    render(<WeeklyCase />);
    expandWeek();
    expect(
      screen.getByText(
        'Choose your job below: each week, a few actions for your job.',
      ),
    ).toBeInTheDocument();
    expect(useCasesStore.getState().programmeStart).toBeNull();
  });

  it('can be hidden; the setting brings it back', () => {
    const { container } = render(<WeeklyCase />);
    fireEvent.click(screen.getByRole('button', { name: 'Hide your week' }));
    expect(useCasesStore.getState().weeklyHidden).toBe(true);
    expect(container).toBeEmptyDOMElement();
  });

  it('books 20 minutes a week in the diary', () => {
    const createObjectURL = vi.fn(() => 'blob:ics');
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() });
    render(<WeeklyCase />);
    expandWeek();
    fireEvent.click(
      screen.getByRole('button', { name: 'Book 20 minutes a week' }),
    );
    expect(createObjectURL).toHaveBeenCalled();
  });

  it('not offered before three days of use: it would discourage at first', () => {
    useCasesStore.setState({ daysUsed: ['2026-10-12'] });
    render(<WeeklyCase />);
    expect(screen.queryByText(/^Your week ·/)).toBeNull();
  });

  it('counts each day of use once', () => {
    useCasesStore.setState({ daysUsed: [] });
    useCasesStore.getState().noteDay(new Date('2026-10-13T09:00:00'));
    useCasesStore.getState().noteDay(new Date('2026-10-13T17:00:00'));
    useCasesStore.getState().noteDay(new Date('2026-10-14T09:00:00'));
    expect(useCasesStore.getState().daysUsed).toEqual([
      '2026-10-13',
      '2026-10-14',
    ]);
  });
});
