import { fireEvent, render, screen } from '@testing-library/react';

import { PanelHome } from '../components/PanelHome';
import { useRecorderStore } from '../speech/useRecorderStore';
import { useNestorChatStore } from '../stores/useNestorChatStore';
import { profileRules, useProfileStore } from '../stores/useProfileStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

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

    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(
      screen.getByRole('button', { name: /Record and transcribe/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /off/i }),
    ).not.toBeInTheDocument();
  });

  it('keeps the field and the beginner mode chosen by the user', () => {
    useProfileStore.setState({ job: null, isBeginner: false });
    render(<PanelHome />);

    // The ten jobs of the ministry, not families of requests.
    fireEvent.change(screen.getByLabelText('My field'), {
      target: { value: 'rh' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'I am a beginner' }));

    const { job, isBeginner } = useProfileStore.getState();
    expect(job).toEqual({ id: 'rh', label: 'Gestionnaire RH' });
    expect(isBeginner).toBe(true);
    expect(profileRules()).toContain('Gestionnaire RH');
    expect(
      screen.getByRole('button', { name: 'I am a beginner' }),
    ).toHaveAttribute('aria-pressed', 'true');
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

  it('opens my favorites from their card', () => {
    render(<PanelHome />);
    fireEvent.click(screen.getByRole('button', { name: /My favorites/ }));
    expect(usePromptToolkitStore.getState()).toMatchObject({
      showHome: false,
      showFavorites: true,
    });
  });

  it('shows a beginner where to start: the coach', () => {
    useNestorChatStore.setState({ chats: {} });
    render(<PanelHome />);
    expect(
      screen.getByRole('button', { name: /Start here.*Coach/ }),
    ).toBeInTheDocument();
  });
});
