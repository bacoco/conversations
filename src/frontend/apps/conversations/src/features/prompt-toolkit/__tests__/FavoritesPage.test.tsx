import { fireEvent, render, screen } from '@testing-library/react';

import { hasPlaceholders } from '../coach/coachApi';
import { FavoritesPage } from '../favorites/FavoritesPage';
import { LIBRARY_EN } from '../library/content/en';
import { useLibraryStore } from '../library/useLibraryStore';
import { useMyPromptsStore } from '../library/useMyPromptsStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const model = LIBRARY_EN.prompts.find((item) => hasPlaceholders(item.prompt))!;
const own = 'Summarise this note in five lines for my head of office.';

describe('<FavoritesPage />', () => {
  const setChatInput = vi.fn();
  beforeEach(() => {
    useLibraryStore.setState({ favorites: [model.id] });
    useMyPromptsStore.setState({ prompts: [] });
    useMyPromptsStore.getState().save(own);
    usePromptToolkitStore.setState({
      chatInput: '',
      setChatInput,
      fill: null,
      showFavorites: true,
      showHome: false,
    });
    setChatInput.mockClear();
  });

  it('lists my favorites; one click puts a request in the field', () => {
    render(<FavoritesPage />);
    expect(
      screen.getByText('One click puts the request in the Assistant’s field.'),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: /Summarise this note/ }),
    );
    expect(setChatInput).toHaveBeenCalledWith(own);
    expect(usePromptToolkitStore.getState().showFavorites).toBe(true);
  });

  it('a model with blanks opens Nestor to complete it', () => {
    render(<FavoritesPage />);
    fireEvent.click(screen.getByRole('button', { name: model.title }));
    expect(usePromptToolkitStore.getState().fill?.template).toBe(model.prompt);
  });

  it('takes a favorite back', () => {
    render(<FavoritesPage />);
    fireEvent.click(
      // The model comes first, then my own request.
      screen.getAllByRole('button', {
        name: /^Remove ".*" from favorites$/,
      })[0],
    );
    expect(useLibraryStore.getState().favorites).toEqual([]);
    fireEvent.click(
      screen.getAllByRole('button', {
        name: /^Remove ".*" from favorites$/,
      })[0],
    );
    expect(useMyPromptsStore.getState().prompts).toEqual([]);
    expect(
      screen.getByText(
        'Star a request in Nestor: it waits for you here, one click away.',
      ),
    ).toBeInTheDocument();
  });
});
