import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';
import { startTraining, useTrainerStore } from '../stores/useTrainerStore';

describe('the trainer: one case, one step at a time', () => {
  beforeEach(() => {
    useTrainerStore.getState().stop();
    usePromptToolkitStore.setState({ mode: 'learn', showHome: false });
  });

  it('starts a case at « Lire », in the coach, remembering where from', () => {
    startTraining('rh-1');
    expect(useTrainerStore.getState()).toMatchObject({
      caseId: 'rh-1',
      step: 'read',
      from: 'learn',
      paused: false,
    });
    expect(usePromptToolkitStore.getState()).toMatchObject({
      mode: 'coach',
      showHome: false,
    });
  });

  it('pauses when the coach is used, and resumes where it was', () => {
    startTraining('rh-1');
    useTrainerStore.getState().update({ step: 'advice' });
    useTrainerStore.getState().pause();
    expect(useTrainerStore.getState().paused).toBe(true);
    useTrainerStore.getState().resume();
    expect(useTrainerStore.getState()).toMatchObject({
      step: 'advice',
      paused: false,
    });
  });

  it('stops: nothing left of the case', () => {
    startTraining('rh-1');
    useTrainerStore.getState().stop();
    expect(useTrainerStore.getState().caseId).toBeNull();
  });
});
