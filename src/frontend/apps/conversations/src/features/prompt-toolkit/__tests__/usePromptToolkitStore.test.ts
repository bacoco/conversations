import {
  PANEL_MIN_WIDTH_PX,
  clampPanelWidth,
  usePromptToolkitStore,
} from '../stores/usePromptToolkitStore';

describe('usePromptToolkitStore', () => {
  beforeEach(() => {
    usePromptToolkitStore.setState({
      isOpen: false,
      mode: 'coach',
      chatInput: '',
      setChatInput: null,
    });
  });

  it('toggles the panel', () => {
    const { toggle } = usePromptToolkitStore.getState();

    toggle();
    expect(usePromptToolkitStore.getState().isOpen).toBe(true);
    toggle();
    expect(usePromptToolkitStore.getState().isOpen).toBe(false);
  });

  it('registers the chat input setter and clears it on cleanup', () => {
    const setter = vi.fn();
    const unregister = usePromptToolkitStore
      .getState()
      .registerChatInput(setter);
    usePromptToolkitStore.getState().publishChatInput('draft');

    expect(usePromptToolkitStore.getState().setChatInput).toBe(setter);
    unregister();
    expect(usePromptToolkitStore.getState()).toMatchObject({
      setChatInput: null,
      chatInput: '',
    });
  });

  it('keeps the setter of a newer chat when an older one unmounts', () => {
    const { registerChatInput } = usePromptToolkitStore.getState();
    const unregisterOld = registerChatInput(vi.fn());
    const newer = vi.fn();
    registerChatInput(newer);

    unregisterOld();
    expect(usePromptToolkitStore.getState().setChatInput).toBe(newer);
  });

  it('is on demand by default and remembers the coaching mode', () => {
    expect(usePromptToolkitStore.getInitialState().coachMode).toBe('manual');
    usePromptToolkitStore.getState().setCoachMode('session');
    expect(usePromptToolkitStore.getState().coachMode).toBe('session');
  });

  it('clears the open section without leaving it', () => {
    usePromptToolkitStore.getState().startCoach('manual');
    const before = usePromptToolkitStore.getState().resetCount;

    usePromptToolkitStore.getState().resetSection();
    expect(usePromptToolkitStore.getState()).toMatchObject({
      resetCount: before + 1,
      showHome: false,
      mode: 'coach',
    });
  });

  it('shows Robin again when going back home', () => {
    usePromptToolkitStore.getState().dismissWelcome();
    usePromptToolkitStore.getState().goHome();
    expect(usePromptToolkitStore.getState()).toMatchObject({
      showHome: true,
      hasSeenWelcome: false,
    });
  });

  it('keeps the panel width between the minimum and 60% of the screen', () => {
    expect(clampPanelWidth(100, 1600)).toBe(PANEL_MIN_WIDTH_PX);
    expect(clampPanelWidth(500, 1600)).toBe(500);
    expect(clampPanelWidth(1400, 1600)).toBe(960);
  });
});
