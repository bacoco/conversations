import {
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
});
