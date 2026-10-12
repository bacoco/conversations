import {
  coachRules,
  isAutoOn,
  useCoachPrefsStore,
} from '../stores/useCoachPrefsStore';

describe('useCoachPrefsStore — Auto', () => {
  beforeEach(() => useCoachPrefsStore.getState().reset());

  it('is on by default, except the analysis at a pause', () => {
    const state = useCoachPrefsStore.getState();
    expect(state.auto).toBe(true);
    expect(isAutoOn(state, 'autoPistes')).toBe(true);
    expect(isAutoOn(state, 'autoAnalyse')).toBe(false);
  });

  it('switched off, nothing runs by itself; on again, as it was left', () => {
    useCoachPrefsStore.getState().setAutoPart('autoAdvice', false);
    useCoachPrefsStore.getState().setAuto(false);
    expect(isAutoOn(useCoachPrefsStore.getState(), 'autoPistes')).toBe(false);
    useCoachPrefsStore.getState().setAuto(true);
    expect(isAutoOn(useCoachPrefsStore.getState(), 'autoPistes')).toBe(true);
    expect(isAutoOn(useCoachPrefsStore.getState(), 'autoAdvice')).toBe(false);
  });

  it('the usual readers only pick examples: never a fact of the request', () => {
    useCoachPrefsStore.getState().setUsualAudience('colleagues');
    const rules = coachRules();
    expect(rules).toContain('only to pick examples');
    expect(rules).not.toContain('assume this one');
  });
});
