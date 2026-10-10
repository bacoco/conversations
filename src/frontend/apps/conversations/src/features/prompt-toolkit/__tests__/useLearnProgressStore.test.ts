import {
  DAY_MS,
  FULL_QUIZ,
  useLearnProgressStore,
} from '../learn/useLearnProgressStore';

describe('useLearnProgressStore', () => {
  beforeEach(() => useLearnProgressStore.getState().reset());

  it('forgets one lesson without touching the others', () => {
    const store = useLearnProgressStore.getState();
    store.completeLesson('lesson-1');
    store.completeLesson('lesson-2');
    store.recordQuiz('lesson-1', 80);
    store.recordQuiz(FULL_QUIZ, 60);
    store.setSlidePosition('lesson-1', 2);

    useLearnProgressStore.getState().resetLesson('lesson-1');

    const state = useLearnProgressStore.getState();
    expect(state.completedLessons).toEqual(['lesson-2']);
    expect(state.bestQuizScores).toEqual({ [FULL_QUIZ]: 60 });
    expect(state.slidePositions).toEqual({});
  });

  it('resets the full quiz and the cards separately', () => {
    const store = useLearnProgressStore.getState();
    store.recordQuiz(FULL_QUIZ, 60);
    store.recordQuiz('lesson-1', 90);
    store.setCardKnown('card-1', true);

    useLearnProgressStore.getState().resetFullQuiz();
    useLearnProgressStore.getState().resetCards();

    const state = useLearnProgressStore.getState();
    expect(state.bestQuizScores).toEqual({ 'lesson-1': 90 });
    expect(state.knownCards).toEqual([]);
  });

  it('keeps the best quiz score', () => {
    const store = useLearnProgressStore.getState();
    store.recordQuiz('lesson-1', 90);
    store.recordQuiz('lesson-1', 40);
    expect(useLearnProgressStore.getState().bestQuizScores['lesson-1']).toBe(
      90,
    );
  });

  it('records a time of a step once, and forgets it with its lesson', () => {
    const store = useLearnProgressStore.getState();
    store.markStage('lesson-1', 'read');
    store.markStage('lesson-1', 'read');
    store.markStage('lesson-1', 'cards');
    store.setCurrentStep('lesson-1');
    expect(useLearnProgressStore.getState().doneStages).toEqual({
      'lesson-1': ['read', 'cards'],
    });

    useLearnProgressStore.getState().resetCards();
    expect(useLearnProgressStore.getState().doneStages).toEqual({
      'lesson-1': ['read'],
    });

    useLearnProgressStore.getState().resetLesson('lesson-1');
    expect(useLearnProgressStore.getState()).toMatchObject({
      doneStages: {},
      currentStep: null,
    });
  });

  it('brings a card back later and later while it is known', () => {
    const now = 1_000_000;
    const { reviewCard } = useLearnProgressStore.getState();
    reviewCard('card-1', true, now);
    expect(useLearnProgressStore.getState().cardSchedule['card-1']).toEqual({
      box: 1,
      due: now + DAY_MS,
    });
    reviewCard('card-1', true, now);
    expect(useLearnProgressStore.getState().cardSchedule['card-1'].due).toBe(
      now + 3 * DAY_MS,
    );
    // Not known: back to the start, due at once.
    reviewCard('card-1', false, now);
    const state = useLearnProgressStore.getState();
    expect(state.cardSchedule['card-1']).toEqual({ box: 0, due: now });
    expect(state.knownCards).not.toContain('card-1');
  });

  it('never lowers a skill level reached', () => {
    const { raiseSkills } = useLearnProgressStore.getState();
    raiseSkills({ task: 2, format: 1 });
    raiseSkills({ task: 1, format: 3 });
    expect(useLearnProgressStore.getState().skillLevels).toEqual({
      task: 2,
      format: 3,
    });
  });

  it('asks the pace once, whatever the answer', () => {
    useLearnProgressStore.getState().setWeeklyGoal(null);
    const state = useLearnProgressStore.getState();
    expect(state.goalAsked).toBe(true);
    expect(state.weeklyGoal).toBeNull();
  });
});
