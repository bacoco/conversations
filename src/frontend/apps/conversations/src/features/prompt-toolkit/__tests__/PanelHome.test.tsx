import { fireEvent, render, screen } from '@testing-library/react';

import { PanelHome } from '../components/PanelHome';
import { profileRules, useProfileStore } from '../stores/useProfileStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

describe('<PanelHome />', () => {
  beforeEach(() =>
    usePromptToolkitStore.setState({
      showHome: true,
      coachMode: 'session',
      hasSeenWelcome: true,
    }),
  );

  it('opens the coach in the mode of the chosen card', () => {
    render(<PanelHome />);

    fireEvent.click(screen.getByRole('button', { name: /Prompt coach/ }));

    expect(usePromptToolkitStore.getState()).toMatchObject({
      showHome: false,
      coachMode: 'manual',
      mode: 'coach',
    });
  });

  it('offers no card to switch the coach off', () => {
    render(<PanelHome />);

    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(
      screen.queryByRole('button', { name: /off/i }),
    ).not.toBeInTheDocument();
  });

  it('keeps the field and the beginner mode chosen by the user', () => {
    useProfileStore.setState({ job: null, isBeginner: false });
    render(<PanelHome />);

    fireEvent.change(screen.getByLabelText('My field'), {
      target: { value: 'meetings' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'I am a beginner' }));

    const { job, isBeginner } = useProfileStore.getState();
    expect(job?.id).toBe('meetings');
    expect(isBeginner).toBe(true);
    expect(profileRules()).toContain(job?.label);
    expect(
      screen.getByRole('button', { name: 'I am a beginner' }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  it('greets with the presentation video once, then shows the cards', () => {
    usePromptToolkitStore.setState({ hasSeenWelcome: false });
    const { container, rerender } = render(<PanelHome />);

    expect(container.querySelector('video')).toHaveAttribute(
      'src',
      '/assets/robin-intro-en.mp4',
    );
    fireEvent.click(screen.getByRole('button', { name: /Get started/ }));
    expect(usePromptToolkitStore.getState().hasSeenWelcome).toBe(true);

    rerender(<PanelHome />);
    expect(
      screen.getByRole('button', { name: /Prompt coach/ }),
    ).toBeInTheDocument();
  });

  it('offers to watch again once the video has ended', () => {
    usePromptToolkitStore.setState({ hasSeenWelcome: false });
    const { container } = render(<PanelHome />);

    expect(
      screen.queryByRole('button', { name: /Watch again/ }),
    ).not.toBeInTheDocument();
    fireEvent.ended(container.querySelector('video') as HTMLVideoElement);
    expect(
      screen.getByRole('button', { name: /Watch again/ }),
    ).toBeInTheDocument();
  });

  it('greets without motion when the video cannot play', () => {
    usePromptToolkitStore.setState({ hasSeenWelcome: false });
    const { container } = render(<PanelHome />);

    fireEvent.error(container.querySelector('video') as HTMLVideoElement);

    expect(screen.getByRole('heading', { name: 'Nestor' })).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Watch the presentation/ }),
    ).not.toBeInTheDocument();
  });

  it('greets without motion when reduced motion is preferred', () => {
    const matchMedia = window.matchMedia;
    window.matchMedia = ((query: string) => ({
      matches: query.includes('reduce'),
    })) as unknown as typeof window.matchMedia;
    usePromptToolkitStore.setState({ hasSeenWelcome: false });
    const { container } = render(<PanelHome />);
    window.matchMedia = matchMedia;

    expect(container.querySelector('video')).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: /Watch the presentation/ }),
    );
    expect(container.querySelector('video')).toBeInTheDocument();
  });
});
