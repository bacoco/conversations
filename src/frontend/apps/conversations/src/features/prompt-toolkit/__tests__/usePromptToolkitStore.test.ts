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

  it('opens the coach on its analysis, or on the screen asked for', () => {
    usePromptToolkitStore.setState({
      mode: 'learn',
      showHome: true,
      coachMode: 'manual',
    });
    usePromptToolkitStore.getState().startCoach();
    expect(usePromptToolkitStore.getState()).toMatchObject({
      mode: 'coach',
      showHome: false,
      fill: null,
      coachMode: 'manual',
    });
    usePromptToolkitStore.getState().startCoach('instant');
    expect(usePromptToolkitStore.getState().coachMode).toBe('instant');
  });

  it('keeps a known coach screen of a stored panel, else the analysis', () => {
    const { migrate } = usePromptToolkitStore.persist.getOptions();
    expect(
      migrate?.({ coachMode: 'session', mode: 'coach', width: 420 }, 4),
    ).toMatchObject({ mode: 'coach', width: 420, coachMode: 'session' });
    expect(migrate?.({ coachMode: 'live', mode: 'coach' }, 3)).toMatchObject({
      coachMode: 'manual',
    });
  });

  it('shows the conversation first on a phone, even if the panel was open', () => {
    const { merge } = usePromptToolkitStore.persist.getOptions();
    const width = window.innerWidth;
    const current = usePromptToolkitStore.getState();
    try {
      window.innerWidth = 390;
      expect(merge?.({ isOpen: true }, current).isOpen).toBe(false);
      window.innerWidth = 1280;
      expect(merge?.({ isOpen: true }, current).isOpen).toBe(true);
    } finally {
      window.innerWidth = width;
    }
  });

  it('remembers the horizontal position chosen for Nestor', () => {
    expect(usePromptToolkitStore.getInitialState().nestorDockPosition).toBe(
      'right',
    );
    usePromptToolkitStore.getState().setNestorDockPosition('center');
    expect(usePromptToolkitStore.getState().nestorDockPosition).toBe('center');
  });

  it('clears the open section without leaving it', () => {
    usePromptToolkitStore.getState().startCoach();
    const before = usePromptToolkitStore.getState().resetCount;

    usePromptToolkitStore.getState().resetSection();
    expect(usePromptToolkitStore.getState()).toMatchObject({
      resetCount: before + 1,
      showHome: false,
      mode: 'coach',
    });
  });

  it('goes to the welcome when Home is pressed again on the cards', () => {
    usePromptToolkitStore.getState().dismissWelcome();
    usePromptToolkitStore.getState().goWelcome();
    expect(usePromptToolkitStore.getState()).toMatchObject({
      showHome: true,
      hasSeenWelcome: false,
    });
  });

  it('goes back to the cards at home, not to the welcome', () => {
    usePromptToolkitStore.getState().dismissWelcome();
    usePromptToolkitStore.getState().goHome();
    expect(usePromptToolkitStore.getState()).toMatchObject({
      showHome: true,
      hasSeenWelcome: true,
    });
  });

  it('keeps the panel width between the minimum and 60% of the screen', () => {
    expect(clampPanelWidth(100, 1600)).toBe(PANEL_MIN_WIDTH_PX);
    expect(clampPanelWidth(500, 1600)).toBe(500);
    expect(clampPanelWidth(1400, 1600)).toBe(960);
  });
});
