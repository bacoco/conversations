import { fireEvent, render, screen } from '@testing-library/react';

import { PanelHome } from '../components/PanelHome';
import { useRecorderStore } from '../speech/useRecorderStore';
import { useCoachPrefsStore } from '../stores/useCoachPrefsStore';
import { useNestorChatStore } from '../stores/useNestorChatStore';
import { useProfileStore } from '../stores/useProfileStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';
import { useTourStore } from '../stores/useTourStore';

const VIDEO = 'Presentation of Nestor, your coach for asking AI well';

describe('<PanelHome />', () => {
  beforeEach(() => {
    usePromptToolkitStore.setState({
      showHome: true,
      mode: 'learn',
      hasSeenWelcome: true,
    });
    useRecorderStore.setState({
      text: '',
      updatedAt: 0,
      owner: '',
      isClaimed: false,
    });
  });

  it('opens the coach from its card', () => {
    render(<PanelHome />);

    fireEvent.click(
      screen.getByRole('button', { name: /Improves your requests/ }),
    );

    expect(usePromptToolkitStore.getState()).toMatchObject({
      showHome: false,
      mode: 'coach',
    });
  });

  it('speaks of requests, never of prompts, on first contact', () => {
    render(<PanelHome />);

    expect(
      screen.getByText('Nestor, your coach for asking AI well'),
    ).toBeInTheDocument();
    expect(document.body.textContent).not.toMatch(/prompt/i);
  });

  it('offers to resume a transcription that is waiting', () => {
    useRecorderStore.getState().claim('user-a');
    useRecorderStore
      .getState()
      .setText('Réunion du lundi : horaires élargis le jeudi soir.');
    render(<PanelHome />);

    const resume = screen.getByRole('region', { name: 'Resume' });
    expect(resume).toHaveTextContent('{{count}} words');
    fireEvent.click(screen.getByRole('button', { name: 'Resume' }));
    expect(usePromptToolkitStore.getState()).toMatchObject({
      mode: 'tools',
      toolRequest: 'minutes',
    });
  });

  it('keeps a transcription for the same person after a reload', () => {
    useRecorderStore.setState({
      text: 'Réunion du lundi.',
      updatedAt: Date.now(),
      owner: 'user-a',
    });
    useRecorderStore.getState().claim('user-a');
    render(<PanelHome />);
    expect(screen.getByRole('region', { name: 'Resume' })).toBeInTheDocument();
  });

  it('never shows the transcription kept for someone else', () => {
    // Someone else used this tab before: their text is still stored.
    useRecorderStore.setState({
      text: 'Réunion confidentielle.',
      updatedAt: Date.now(),
      owner: 'user-a',
    });
    render(<PanelHome />);
    expect(
      screen.queryByRole('region', { name: 'Resume' }),
    ).not.toBeInTheDocument();

    useRecorderStore.getState().claim('user-b');
    expect(useRecorderStore.getState().text).toBe('');
  });

  it('says nothing about a transcription when there is none', () => {
    render(<PanelHome />);
    expect(
      screen.queryByRole('region', { name: 'Resume' }),
    ).not.toBeInTheDocument();
  });

  it('offers no card to switch the coach off', () => {
    render(<PanelHome />);

    expect(screen.getAllByRole('listitem')).toHaveLength(4);
    expect(
      screen.getByRole('button', { name: /Record and transcribe/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /off/i }),
    ).not.toBeInTheDocument();
  });

  it('stays short: the job and the beginner mode live in Nestor’s settings', () => {
    useProfileStore.setState({ job: null, isBeginner: false });
    render(<PanelHome />);
    expect(screen.queryByLabelText('My field')).toBeNull();
    expect(
      screen.queryByRole('button', { name: 'I am a beginner' }),
    ).toBeNull();
  });

  it('greets with the presentation video once, then shows the cards', () => {
    usePromptToolkitStore.setState({ hasSeenWelcome: false });
    const { rerender } = render(<PanelHome />);

    expect(screen.getByLabelText(VIDEO)).toHaveAttribute(
      'src',
      '/assets/nestor-intro-en.mp4',
    );
    fireEvent.click(screen.getByRole('button', { name: /Get started/ }));
    expect(usePromptToolkitStore.getState().hasSeenWelcome).toBe(true);

    rerender(<PanelHome />);
    expect(
      screen.getByRole('button', { name: /Improves your requests/ }),
    ).toBeInTheDocument();
  });

  it('after the welcome film, the guided tour starts, the first time only', () => {
    usePromptToolkitStore.setState({ hasSeenWelcome: false });
    useProfileStore.setState({ hasSeenTour: false });
    render(<PanelHome />);
    fireEvent.click(screen.getByRole('button', { name: /Get started/ }));
    expect(useTourStore.getState().active).toBe(true);
    useTourStore.getState().stop();
  });

  it('the tour already seen: the welcome film leads to the cards', () => {
    usePromptToolkitStore.setState({ hasSeenWelcome: false });
    useProfileStore.setState({ hasSeenTour: true });
    render(<PanelHome />);
    fireEvent.click(screen.getByRole('button', { name: /Get started/ }));
    expect(useTourStore.getState().active).toBe(false);
  });

  it('offers to watch again once the video has ended', () => {
    usePromptToolkitStore.setState({ hasSeenWelcome: false });
    render(<PanelHome />);

    expect(
      screen.queryByRole('button', { name: /Watch again/ }),
    ).not.toBeInTheDocument();
    fireEvent.ended(screen.getByLabelText(VIDEO));
    expect(
      screen.getByRole('button', { name: /Watch again/ }),
    ).toBeInTheDocument();
  });

  it('greets without motion when the video cannot play', () => {
    usePromptToolkitStore.setState({ hasSeenWelcome: false });
    render(<PanelHome />);

    fireEvent.error(screen.getByLabelText(VIDEO));

    expect(screen.getByRole('heading', { name: 'Nestor' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Watch the presentation/ }),
    ).not.toBeInTheDocument();
  });

  it('greets without motion when reduced motion is preferred', () => {
    const spy = vi
      .spyOn(window, 'matchMedia')
      .mockImplementation(
        (query: string) =>
          ({ matches: query.includes('reduce') }) as MediaQueryList,
      );
    usePromptToolkitStore.setState({ hasSeenWelcome: false });
    render(<PanelHome />);
    spy.mockRestore();

    expect(screen.queryByLabelText(VIDEO)).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: /Watch the presentation/ }),
    );
    expect(screen.getByLabelText(VIDEO)).toBeInTheDocument();
  });

  it('no favorites card: they are the round star at the bottom right', () => {
    render(<PanelHome />);
    expect(screen.queryByRole('button', { name: /My favorites/ })).toBeNull();
  });

  it('the coach alone on top, the whole width: it is the most important', () => {
    render(<PanelHome />);
    const [first] = screen.getAllByRole('listitem');
    expect(first).toHaveTextContent('Coach');
    expect(first).toHaveStyle({ gridColumn: '1 / -1' });
    // Same size as the cards under it, centred: never stretched.
    expect(
      screen.getByRole('button', { name: /Improves your requests/ }),
    ).toHaveStyle({ width: 'calc(50% - 6px)' });
  });

  it('shows a beginner where to start: the coach', () => {
    useNestorChatStore.setState({ chats: {} });
    render(<PanelHome />);
    expect(
      screen.getByRole('button', { name: /Start here.*Coach/ }),
    ).toBeInTheDocument();
  });

  it('while no job is chosen, the question waits under the cards', () => {
    useProfileStore.setState({ job: null });
    useCoachPrefsStore.setState({ jobLater: false });
    usePromptToolkitStore.setState({ hasSeenWelcome: true });
    render(<PanelHome />);
    expect(
      screen.getByRole('button', { name: /Learning to ask well/ }),
    ).toBeInTheDocument();
    // One line under the cards: a list, never ten buttons.
    fireEvent.change(
      screen.getByRole('combobox', { name: 'What is your job?' }),
      {
        target: { value: 'rh' },
      },
    );
    expect(useProfileStore.getState().job?.id).toBe('rh');
    expect(
      screen.queryByRole('combobox', { name: 'What is your job?' }),
    ).toBeNull();
  });
});
