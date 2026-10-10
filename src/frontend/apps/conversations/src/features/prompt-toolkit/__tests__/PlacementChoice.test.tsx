import { fireEvent, render, renderHook, screen } from '@testing-library/react';

import { PlacementChoice } from '../components/PlacementChoice';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';
import { usePlacePrompt } from '../tools/usePlacePrompt';

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

describe('a request placed in a message field that holds a text', () => {
  const setChatInput = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    usePromptToolkitStore.setState({
      chatInput: 'Mon brouillon',
      setChatInput,
      pendingPlacement: null,
    });
  });

  it('never overwrites the draft without asking', () => {
    const { result } = renderHook(() => usePlacePrompt());
    result.current('Résume ce texte.');
    expect(setChatInput).not.toHaveBeenCalled();
    expect(usePromptToolkitStore.getState().pendingPlacement).toBe(
      'Résume ce texte.',
    );
  });

  it('replaces the draft with the coach’s own version of it', () => {
    const { result } = renderHook(() => usePlacePrompt());
    result.current('Mon brouillon, amélioré.', { replaceDraft: true });
    expect(setChatInput).toHaveBeenCalledWith('Mon brouillon, amélioré.');
  });

  it('adds after the draft, replaces it, or keeps it', () => {
    usePromptToolkitStore.setState({ pendingPlacement: 'Résume ce texte.' });
    const { rerender } = render(<PlacementChoice />);
    fireEvent.click(screen.getByRole('button', { name: 'Add after it' }));
    expect(setChatInput).toHaveBeenCalledWith(
      'Mon brouillon\n\nRésume ce texte.',
    );
    expect(usePromptToolkitStore.getState().pendingPlacement).toBeNull();

    usePromptToolkitStore.setState({ pendingPlacement: 'Autre chose.' });
    rerender(<PlacementChoice />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(setChatInput).toHaveBeenCalledTimes(1);
    expect(usePromptToolkitStore.getState().pendingPlacement).toBeNull();
  });
});
