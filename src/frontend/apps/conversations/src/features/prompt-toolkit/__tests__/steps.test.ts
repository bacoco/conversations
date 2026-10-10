import { getChallenges } from '../learn/challenges';
import { COURSE_FR } from '../learn/content/fr';
import {
  ProgressSnapshot,
  buildSteps,
  cardsToReview,
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
    expect(steps[5].stages).toEqual(['read', 'quiz', 'practice']);
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
});
