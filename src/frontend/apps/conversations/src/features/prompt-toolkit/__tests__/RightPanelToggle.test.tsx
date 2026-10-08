import { render, screen } from '@testing-library/react';

import { RightPanelToggle } from '../components/RightPanelToggle';

vi.mock('../coach/coachApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../coach/coachApi')>()),
  PROMPT_TOOLKIT_ENABLED: false,
}));

describe('<RightPanelToggle /> without a configured model', () => {
  it('stays hidden, so the app is unchanged', () => {
    render(<RightPanelToggle />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
