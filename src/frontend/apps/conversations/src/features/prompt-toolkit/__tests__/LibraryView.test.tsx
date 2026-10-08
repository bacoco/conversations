import { fireEvent, render, screen } from '@testing-library/react';

import { LIBRARY_EN } from '../library/content/en';
import { LIBRARY_FR } from '../library/content/fr';
import { LibraryView, normalize } from '../library/LibraryView';
import { useLibraryStore } from '../library/useLibraryStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

describe('<LibraryView />', () => {
  const setChatInput = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    useLibraryStore.setState({ favorites: [] });
    usePromptToolkitStore.setState({ setChatInput });
  });

  it('has the same prompts in French and in English', () => {
    expect(LIBRARY_EN.prompts.map((p) => p.id)).toEqual(
      LIBRARY_FR.prompts.map((p) => p.id),
    );
    const categories = new Set(LIBRARY_FR.categories.map((c) => c.id));
    expect(LIBRARY_FR.prompts.every((p) => categories.has(p.category))).toBe(
      true,
    );
  });

  it('ignores accents and case when searching', () => {
    expect(normalize('Réunion')).toBe('reunion');
    render(<LibraryView onBack={vi.fn()} />);

    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'MEETING MINUTES' },
    });

    expect(
      screen.getByRole('button', { name: /Meeting minutes/ }),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole('button', { name: /Easy-to-read version/ }),
    ).not.toBeInTheDocument();
  });

  it('hands the chosen prompt to Robin to fill in what is missing', () => {
    render(<LibraryView onBack={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /^Meetings/ }));
    fireEvent.click(screen.getByRole('button', { name: /Meeting minutes/ }));
    fireEvent.click(
      screen.getByRole('button', { name: 'Complete with Robin' }),
    );

    const minutes = LIBRARY_EN.prompts.find((p) => p.id === 'meeting-minutes');
    expect(usePromptToolkitStore.getState().fill).toEqual({
      template: minutes?.prompt,
      title: 'Meeting minutes',
    });
    expect(setChatInput).not.toHaveBeenCalled();
  });

  it('opens a category, and shows the favorites once there are some', () => {
    render(<LibraryView onBack={vi.fn()} />);

    expect(
      screen.queryByRole('button', { name: /My favorites/ }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /^Meetings/ }));
    fireEvent.click(screen.getAllByRole('button', { name: /to favorites/ })[0]);
    expect(useLibraryStore.getState().favorites).toEqual(['meeting-agenda']);

    fireEvent.click(
      screen.getByRole('button', { name: 'Back to the categories' }),
    );
    fireEvent.click(screen.getByRole('button', { name: /My favorites/ }));
    expect(screen.getAllByRole('button', { name: /favorites/ })).toHaveLength(
      1,
    );
  });
});
