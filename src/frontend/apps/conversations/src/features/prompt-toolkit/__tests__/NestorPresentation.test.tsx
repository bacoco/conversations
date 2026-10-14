import { fireEvent, render, screen } from '@testing-library/react';

import {
  HelpCornerButton,
  PresentationButton,
  helpCornerShown,
} from '../presentation/PresentationButton';
import { useProfileStore } from '../stores/useProfileStore';
import { useTourStore } from '../stores/useTourStore';
import { TourStage } from '../tour/TourStage';

describe('<PresentationButton />: the « ? » starts Nestor’s tour at once', () => {
  beforeEach(() => {
    useProfileStore.setState({ hasSeenPresentation: false });
    useTourStore.getState().stop();
  });

  it('a dot says it is new, until it is used once', () => {
    const { rerender } = render(<PresentationButton />);
    expect(screen.getByText('New: discover Nestor')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Discover Nestor' }));
    rerender(<PresentationButton />);
    expect(screen.queryByText('New: discover Nestor')).toBeNull();
  });

  it('no window in between: the tour starts', () => {
    render(<PresentationButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Discover Nestor' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(useTourStore.getState()).toMatchObject({ active: true, index: 0 });
  });
});

describe('the film, first in the window', () => {
  beforeEach(() => {
    useTourStore.setState({ active: true, index: 0, onFilm: true });
  });
  afterEach(() => useTourStore.getState().stop());

  it('under the site’s path; « Faire la visite guidée » goes on', () => {
    render(<TourStage />);
    const video = screen.getByLabelText('Presentation of Nestor');
    expect(video).toHaveAttribute(
      'src',
      `${import.meta.env.BASE_URL}assets/nestor-presentation-fr.mp4`,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Take the tour' }));
    expect(screen.queryByLabelText('Presentation of Nestor')).toBeNull();
    // From the tour's first words, the film is one click away again.
    fireEvent.click(screen.getByRole('button', { name: /Watch the film/ }));
    expect(screen.getByLabelText('Presentation of Nestor')).toBeInTheDocument();
  });

  it('a film that cannot play: straight to the guided tour, no message', () => {
    render(<TourStage />);
    fireEvent.error(screen.getByLabelText('Presentation of Nestor'));
    expect(useTourStore.getState()).toMatchObject({
      active: true,
      onFilm: false,
    });
    expect(screen.queryByText(/coming soon/)).toBeNull();
  });
});

describe('the round « ? » at the bottom left of the home cards', () => {
  beforeEach(() => {
    useTourStore.getState().stop();
    useProfileStore.setState({ hasSeenPresentation: false });
  });

  it('shown only on the home cards, never in the coach or on the welcome', () => {
    expect(
      helpCornerShown({
        showHome: true,
        welcomeShown: false,
        isNestorChat: false,
      }),
    ).toBe(true);
    expect(
      helpCornerShown({
        showHome: false,
        welcomeShown: false,
        isNestorChat: true,
      }),
    ).toBe(false);
    expect(
      helpCornerShown({
        showHome: true,
        welcomeShown: true,
        isNestorChat: false,
      }),
    ).toBe(false);
  });

  it('opens the film’s window, like the « ? » of the header', () => {
    render(<HelpCornerButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Discover Nestor' }));
    expect(useTourStore.getState()).toMatchObject({
      active: true,
      onFilm: true,
    });
    expect(useProfileStore.getState().hasSeenPresentation).toBe(true);
  });
});
