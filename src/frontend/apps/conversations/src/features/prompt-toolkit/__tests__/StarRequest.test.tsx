import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { StarRequest } from '../chat/StarRequest';
import { parseRequestName } from '../chat/nestorChatApi';
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

  it('Nestor names it in a few words: the whole request never needs cutting', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  title: 'Courriel sur le compte épargne-temps',
                }),
              },
            },
          ],
        }),
        { status: 200 },
      ),
    );
    render(<StarRequest text={text} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Keep in my favorites' }),
    );
    await waitFor(() =>
      expect(useMyPromptsStore.getState().prompts[0]?.title).toBe(
        'Courriel sur le compte épargne-temps',
      ),
    );
    vi.restoreAllMocks();
  });

  it('a name is short and plain, or none', () => {
    expect(
      parseRequestName({ title: '  « Indicateurs de vulnérabilité » ' }),
    ).toBe('Indicateurs de vulnérabilité');
    expect(parseRequestName({ title: '' })).toBeNull();
    expect(parseRequestName({ title: 'x'.repeat(120) })).toBeNull();
  });
});
