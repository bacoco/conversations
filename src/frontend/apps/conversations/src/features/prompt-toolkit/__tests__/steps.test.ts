import { getChallenges } from '../learn/challenges';
import { COURSE_FR } from '../learn/content/fr';
import {
  CHECKPOINTS,
  ProgressSnapshot,
  buildSteps,
  cardsToReview,
  checkpointQuestions,
  computeSkillLevels,
  dueCheckpoint,
  isStageDone,
  isStepDone,
  nextStage,
  nextStep,
} from '../learn/steps';

const empty: ProgressSnapshot = {
  completedLessons: [],
  bestQuizScores: {},
  knownCards: [],
  completedChallenges: [],
  doneStages: {},
  currentStep: null,
};

describe('the course path', () => {
  const steps = buildSteps(COURSE_FR, getChallenges('fr'), true);

  it('keeps every lesson, card, question and challenge', () => {
    expect(steps).toHaveLength(COURSE_FR.lessons.length);
    expect(steps.flatMap((s) => s.cards)).toHaveLength(
      COURSE_FR.flashcards.length,
    );
    expect(steps.flatMap((s) => s.quiz)).toHaveLength(COURSE_FR.quiz.length);
    expect(
      steps.flatMap((s) => (s.challenge ? [s.challenge.id] : [])).sort(),
    ).toEqual(
      getChallenges('fr')
        .map((c) => c.id)
        .sort(),
    );
  });

  it('practises with the coach where a step has no challenge', () => {
    expect(steps[0].practiseWithCoach).toBe(true);
    expect(steps[0].stages).toEqual(['read', 'cards', 'quiz', 'practice']);
    // Steps without cards skip "remember".
    const withoutCards = buildSteps(
      {
        ...COURSE_FR,
        flashcards: COURSE_FR.flashcards.filter(
          (card) => card.lessonId !== 'lesson-6',
        ),
      },
      getChallenges('fr'),
      true,
    );
    expect(withoutCards[5].stages).toEqual(['read', 'quiz', 'practice']);
  });

  it('has no practice without the coach', () => {
    const offline = buildSteps(COURSE_FR, getChallenges('fr'), false);
    expect(offline[1].challenge).toBeUndefined();
    expect(offline[1].stages).toEqual(['read', 'cards', 'quiz']);
  });

  it('counts a time done from the progress already kept', () => {
    const step = steps[1];
    const progress: ProgressSnapshot = {
      ...empty,
      completedLessons: [step.lesson.id],
      bestQuizScores: { [step.lesson.id]: 60 },
      knownCards: step.cards.map((c) => c.id),
      completedChallenges: [step.challenge!.id],
    };
    expect(isStepDone(step, progress)).toBe(true);
    expect(isStageDone(step, 'quiz', empty)).toBe(false);
    expect(
      isStageDone(step, 'quiz', {
        ...empty,
        doneStages: { [step.lesson.id]: ['quiz'] },
      }),
    ).toBe(true);
  });

  it('goes on with the step being done, else the first one left', () => {
    expect(nextStep(steps, empty)?.number).toBe(1);
    expect(nextStep(steps, { ...empty, currentStep: 'lesson-3' })?.number).toBe(
      3,
    );
    expect(
      nextStage(steps[2], { ...empty, completedLessons: ['lesson-3'] }),
    ).toBe('cards');
  });

  it('reviews the cards of the steps read and not known yet', () => {
    const first = steps[0];
    const progress = {
      ...empty,
      completedLessons: [first.lesson.id],
      knownCards: [first.cards[0].id],
    };
    expect(cardsToReview(steps, progress)).toEqual(first.cards.slice(1));
  });

  it('brings a card back when its time has come', () => {
    const lesson1 = steps[0];
    const [first, second] = lesson1.cards;
    const now = 10_000;
    const progress: ProgressSnapshot = {
      ...empty,
      completedLessons: ['lesson-1'],
      knownCards: [first.id, second.id],
      cardSchedule: {
        [first.id]: { box: 1, due: now - 1 },
        [second.id]: { box: 2, due: now + 1 },
      },
    };
    const due = cardsToReview(steps, progress, now).map((card) => card.id);
    expect(due).toContain(first.id);
    expect(due).not.toContain(second.id);
  });

  it('offers a checkpoint once its steps are done, and only once', () => {
    const done = Object.fromEntries(
      steps.slice(0, 3).map((step) => [step.lesson.id, step.stages]),
    );
    const progress: ProgressSnapshot = { ...empty, doneStages: done };
    expect(dueCheckpoint(steps, progress)?.id).toBe('checkpoint-1');
    expect(
      dueCheckpoint(steps, { ...progress, checkpointsDone: ['checkpoint-1'] }),
    ).toBeNull();
    expect(checkpointQuestions(steps, CHECKPOINTS[0]).length).toBeGreaterThan(
      2,
    );
  });

  it('says a skill is mastered only when most recent requests show it', () => {
    const entry = (task: number) => ({
      excerpt: '…',
      score: 50,
      sentAt: 1,
      competencies: {
        task,
        context: 0,
        audience: 0,
        format: 0,
        constraints: 0,
        sources: 0,
        examples: 0,
        verification: 0,
      },
    });
    const twice = computeSkillLevels(steps, empty, [entry(80), entry(80)]);
    expect(twice.task).toBe(1);
    const often = computeSkillLevels(steps, empty, [
      entry(80),
      entry(80),
      entry(30),
      entry(90),
    ]);
    expect(often.task).toBe(3);
    expect(often.verification).toBe(0);
  });
});
