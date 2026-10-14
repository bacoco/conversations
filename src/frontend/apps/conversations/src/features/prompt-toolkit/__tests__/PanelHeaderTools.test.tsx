import { fireEvent, render, screen, within } from '@testing-library/react';

import { PanelHeaderTools } from '../components/PanelHeaderTools';

const names = () => {
  const group = within(screen.getByRole('group', { name: 'Panel tools' }));
  // Auto is a switch, always there, before the gear.
  expect(group.getByRole('switch', { name: 'Auto' })).toBeInTheDocument();
  return group
    .getAllByRole('button')
    .map((button) => button.getAttribute('aria-label'));
};

describe('<PanelHeaderTools />: the same tools at the same place on every screen', () => {
  it('Auto, the gear and the size, always in this order', () => {
    const { rerender } = render(
      <PanelHeaderTools isDesktop isExpanded={false} onSettings={vi.fn()} />,
    );
    const onHome = names();
    // The « ? » sits before the gear, on every screen.
    expect(onHome).toEqual([
      'Discover Nestor',
      'Nestor’s settings',
      'Expand the panel',
    ]);
    // A space that can start over: its button comes first, nothing moves.
    rerender(
      <PanelHeaderTools
        isDesktop
        isExpanded={false}
        onSettings={vi.fn()}
        onReset={vi.fn()}
      />,
    );
    expect(names()).toEqual(['Start over', ...onHome]);
  });

  it('the gear opens Nestor’s settings', () => {
    const onSettings = vi.fn();
    render(
      <PanelHeaderTools isDesktop isExpanded={false} onSettings={onSettings} />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Nestor’s settings' }));
    expect(onSettings).toHaveBeenCalled();
  });

  it('on a phone, a close button ends the row', () => {
    render(
      <PanelHeaderTools
        isDesktop={false}
        isExpanded={false}
        onSettings={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(names().at(-1)).toBe('Close the panel');
  });
});
