import { fireEvent, render, screen } from '@testing-library/react';

import { LibraryView } from '../library/LibraryView';
import { SavePromptButton } from '../library/SavePromptButton';
import { titleFrom, useMyPromptsStore } from '../library/useMyPromptsStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

describe('My prompts', () => {
  const setChatInput = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    useMyPromptsStore.setState({ prompts: [] });
    usePromptToolkitStore.setState({ setChatInput, fill: null });
  });

  it('saves a prompt once, with a title from its first words', () => {
    render(<SavePromptButton prompt="Summarise the report in 5 points." />);
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    expect(useMyPromptsStore.getState().prompts).toMatchObject([
      { title: 'Summarise the report in 5 points.' },
    ]);
    expect(screen.getByRole('button', { name: 'Saved' })).toBeDisabled();
    expect(
      useMyPromptsStore.getState().save('Summarise the report in 5 points.'),
    ).toBe(false);
    expect(titleFrom('a'.repeat(80))).toHaveLength(60);
  });

  it('lists them in the library, ready to use or delete', () => {
    useMyPromptsStore.getState().save('Write the weekly note for the team.');
    render(<LibraryView onBack={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /My prompts/ }));
    fireEvent.click(
      screen.getByRole('button', { name: /Write the weekly note/ }),
    );
    // Nothing to fill in: it goes straight to the message field.
    fireEvent.click(screen.getByRole('button', { name: 'Use this prompt' }));
    expect(setChatInput).toHaveBeenCalledWith(
      'Write the weekly note for the team.',
    );

    fireEvent.click(screen.getByRole('button', { name: /^Delete/ }));
    expect(useMyPromptsStore.getState().prompts).toEqual([]);
  });
});
