import { fireEvent, render, screen } from '@testing-library/react';

import { PanelHome } from '../components/PanelHome';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

describe('<PanelHome />', () => {
  beforeEach(() =>
    usePromptToolkitStore.setState({
      showHome: true,
      coachMode: 'off',
      hasSeenWelcome: true,
    }),
  );

  it('opens the coach in the mode of the chosen card', () => {
    render(<PanelHome />);

    fireEvent.click(screen.getByRole('button', { name: /On-demand coach/ }));

    expect(usePromptToolkitStore.getState()).toMatchObject({
      showHome: false,
      coachMode: 'manual',
      mode: 'coach',
    });
  });

  it('offers no card to switch the coach off', () => {
    render(<PanelHome />);

    expect(screen.getAllByRole('button')).toHaveLength(4);
    expect(
      screen.queryByRole('button', { name: /off/i }),
    ).not.toBeInTheDocument();
  });

  it('greets with Robin once, then shows the cards', () => {
    usePromptToolkitStore.setState({ hasSeenWelcome: false });
    const { rerender } = render(<PanelHome />);

    expect(screen.getByRole('heading', { name: 'Robin' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Get started/ }));
    expect(usePromptToolkitStore.getState().hasSeenWelcome).toBe(true);

    rerender(<PanelHome />);
    expect(
      screen.getByRole('button', { name: /On-demand coach/ }),
    ).toBeInTheDocument();
  });
});
