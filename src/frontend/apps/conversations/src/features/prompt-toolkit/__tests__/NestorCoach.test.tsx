import { fireEvent, render, screen } from '@testing-library/react';

import { CoachPanel } from '../components/CoachPanel';
import { useMainConversationStore } from '../stores/useMainConversationStore';
import { useNestorChatStore } from '../stores/useNestorChatStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));
vi.mock('@/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils')>()),
  useConversationRouteId: () => 'c1',
}));

describe('the coach is one chat with Nestor', () => {
  beforeAll(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });
  beforeEach(() => {
    useNestorChatStore.setState({ chats: {} });
    usePromptToolkitStore.setState({ chatInput: '', setChatInput: vi.fn() });
    useMainConversationStore.setState({
      turns: [],
      latestCompletedAssistantMessageId: null,
      isAssistantResponding: false,
    });
  });

  it('welcome, the fixed bar, and no mode tabs', () => {
    render(<CoachPanel />);
    expect(
      screen.getByRole('toolbar', { name: 'Nestor’s buttons' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('tab')).toBeNull();
    expect(screen.queryByText('Live')).toBeNull();
  });

  it('"Analyser mon texte" with an empty field answers in the thread', () => {
    render(<CoachPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Analyse my text' }));
    expect(
      screen.getByText(
        'First write your request in the middle, in the Assistant’s field.',
      ),
    ).toBeInTheDocument();
  });

  it('"Demander à Nestor" opens the window over the thread', () => {
    render(<CoachPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Ask Nestor' }));
    expect(
      screen.getByRole('dialog', { name: 'Ask Nestor' }),
    ).toBeInTheDocument();
  });
});
