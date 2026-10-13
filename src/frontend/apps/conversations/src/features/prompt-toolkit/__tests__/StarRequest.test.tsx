import { fireEvent, render, screen } from '@testing-library/react';

import { StarRequest } from '../chat/StarRequest';
import { useMyPromptsStore } from '../library/useMyPromptsStore';

const text = 'Rédigez un courriel à un agent sur son compte épargne-temps.';

describe('StarRequest', () => {
  beforeEach(() => useMyPromptsStore.setState({ prompts: [] }));

  it('keeps the request in my favorites, then takes it back', () => {
    render(<StarRequest text={text} />);
    const star = screen.getByRole('button', {
      name: 'Keep in my favorites',
    });
    expect(star).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(star);
    expect(useMyPromptsStore.getState().prompts.map((p) => p.prompt)).toEqual([
      text,
    ]);
    const kept = screen.getByRole('button', {
      name: 'Remove from my favorites',
    });
    expect(kept).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(kept);
    expect(useMyPromptsStore.getState().prompts).toEqual([]);
  });
});
