import { fireEvent, render, screen, waitFor } from '@testing-library/react';

import { hasPlaceholders } from '../coach/coachApi';
import { LeftFavorites } from '../favorites/LeftFavorites';
import { LIBRARY_EN } from '../library/content/en';
import { useLibraryStore } from '../library/useLibraryStore';
import { useMyPromptsStore } from '../library/useMyPromptsStore';
import { OWNER_KEY } from '../stores/accountScope';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

const user = { id: 'agent-1' };
vi.mock('@/features/auth', () => ({
  useAuthQuery: () => ({ data: user }),
}));
vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const withBlanks = LIBRARY_EN.prompts.find((item) =>
  hasPlaceholders(item.prompt),
)!;
const own = 'Summarise this note in five lines for my head of office.';

/** This browser's data already belongs to the signed-in agent. */
const claimAsAgent = async () => {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`nestor:${user.id}`),
  );
  localStorage.setItem(
    OWNER_KEY,
    Array.from(new Uint8Array(digest), (byte) =>
      byte.toString(16).padStart(2, '0'),
    ).join(''),
  );
};

describe('LeftFavorites', () => {
  beforeEach(async () => {
    localStorage.clear();
    await claimAsAgent();
    useLibraryStore.setState({ favorites: [withBlanks.id] });
    useMyPromptsStore.setState({ prompts: [] });
    useMyPromptsStore.getState().save(own);
    usePromptToolkitStore.setState({
      isOpen: false,
      fill: null,
      chatInput: '',
      setChatInput: vi.fn(),
    });
  });

  it('lists my starred models and my own requests', async () => {
    render(<LeftFavorites />);
    expect(
      await screen.findByRole('button', { name: withBlanks.title }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Summarise this note/ }),
    ).toBeInTheDocument();
  });

  it('a request without blanks goes straight into the Assistant’s field', async () => {
    render(<LeftFavorites />);
    fireEvent.click(
      await screen.findByRole('button', { name: /Summarise this note/ }),
    );
    expect(usePromptToolkitStore.getState().setChatInput).toHaveBeenCalledWith(
      own,
    );
  });

  it('a model with blanks opens Nestor to complete it', async () => {
    render(<LeftFavorites />);
    fireEvent.click(
      await screen.findByRole('button', { name: withBlanks.title }),
    );
    const state = usePromptToolkitStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.fill?.template).toBe(withBlanks.prompt);
  });

  it('shows nothing of a previous account', async () => {
    localStorage.setItem(OWNER_KEY, 'someone-else');
    render(<LeftFavorites />);
    await waitFor(() =>
      expect(useLibraryStore.getState().favorites).toEqual([]),
    );
    expect(
      screen.queryByRole('button', { name: withBlanks.title }),
    ).not.toBeInTheDocument();
    expect(screen.getByText('My favorites')).toBeInTheDocument();
  });

  it('says how to add one when there is none', async () => {
    useLibraryStore.setState({ favorites: [] });
    useMyPromptsStore.setState({ prompts: [] });
    render(<LeftFavorites />);
    expect(
      await screen.findByText(
        'Star a request in Nestor: it waits for you here, one click away.',
      ),
    ).toBeInTheDocument();
  });
});
