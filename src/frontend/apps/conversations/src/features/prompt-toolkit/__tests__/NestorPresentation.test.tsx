import { CunninghamProvider } from '@gouvfr-lasuite/cunningham-react';
import {
  render as baseRender,
  fireEvent,
  screen,
} from '@testing-library/react';
import type { ReactElement } from 'react';

import { PresentationButton } from '../presentation/PresentationButton';
import { useProfileStore } from '../stores/useProfileStore';

// The app's provider: the window needs it.
const render = (ui: ReactElement) =>
  baseRender(ui, {
    wrapper: ({ children }) => (
      <CunninghamProvider>{children}</CunninghamProvider>
    ),
  });

describe('<PresentationButton />: the « ? » that presents Nestor', () => {
  beforeEach(() => useProfileStore.setState({ hasSeenPresentation: false }));

  it('a dot says it is new, until it is opened once', () => {
    const { rerender } = render(<PresentationButton />);
    expect(screen.getByText('New: discover Nestor')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Discover Nestor' }));
    expect(useProfileStore.getState().hasSeenPresentation).toBe(true);
    rerender(<PresentationButton />);
    expect(screen.queryByText('New: discover Nestor')).toBeNull();
  });

  it('opens a window with the presentation video, never by itself', () => {
    render(<PresentationButton />);
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Discover Nestor' }));
    const video = screen.getByLabelText('Presentation of Nestor');
    expect(video).toHaveAttribute('src', '/assets/nestor-presentation-fr.mp4');
    expect(video).toHaveAttribute('controls');
  });

  it('a video that cannot play says so, in plain words', () => {
    render(<PresentationButton />);
    fireEvent.click(screen.getByRole('button', { name: 'Discover Nestor' }));
    fireEvent.error(screen.getByLabelText('Presentation of Nestor'));
    expect(
      screen.getByText('The presentation cannot be played here.'),
    ).toBeInTheDocument();
  });
});
