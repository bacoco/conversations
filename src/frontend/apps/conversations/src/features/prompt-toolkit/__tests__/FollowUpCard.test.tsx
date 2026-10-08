import { act, fireEvent, render, screen } from '@testing-library/react';

import { FollowUpCard, lastMessageText } from '../components/FollowUpCard';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

const mockGetConversation = vi.fn();
vi.mock('@/features/chat/api/useConversation', () => ({
  getConversation: (...args: unknown[]) => mockGetConversation(...args),
}));
vi.mock('@/utils', () => ({ useConversationRouteId: () => 'conv-1' }));
vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const message = (role: 'user' | 'assistant', text: string) => ({
  role,
  parts: [{ type: 'text', text }],
});

describe('<FollowUpCard />', () => {
  const setChatInput = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    usePromptToolkitStore.setState({ setChatInput, fill: null });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('finds the last message of a role', () => {
    const messages = [
      message('user', 'one'),
      message('assistant', 'answer one'),
      message('user', 'two'),
    ];
    // @ts-expect-error minimal messages for the test
    expect(lastMessageText(messages, 'user')).toBe('two');
    // @ts-expect-error minimal messages for the test
    expect(lastMessageText(messages, 'assistant')).toBe('answer one');
  });

  it('writes a follow-up from the last exchange and the issue', async () => {
    mockGetConversation.mockResolvedValue({
      messages: [
        message('user', 'Summarise the report'),
        message('assistant', 'A very long answer…'),
      ],
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  prompt: 'Your answer is too long: keep 5 bullet points.',
                  why: 'Shorter, as a list.',
                }),
              },
            },
          ],
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<FollowUpCard />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Too long' }));
    });

    expect(
      await screen.findByText('Your answer is too long: keep 5 bullet points.'),
    ).toBeInTheDocument();
    const body = String(
      (fetchMock.mock.calls[0] as [string, RequestInit])[1].body,
    );
    expect(body).toContain('Summarise the report');
    expect(body).toContain('A very long answer');
    expect(body).toContain('Too long');

    fireEvent.click(screen.getByRole('button', { name: 'Use this follow-up' }));
    expect(setChatInput).toHaveBeenCalledWith(
      'Your answer is too long: keep 5 bullet points.',
    );
  });
});
