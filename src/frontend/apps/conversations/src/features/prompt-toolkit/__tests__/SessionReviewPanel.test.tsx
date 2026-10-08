import { fireEvent, render, screen } from '@testing-library/react';

import {
  SessionReviewPanel,
  userPrompts,
} from '../components/SessionReviewPanel';

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const mockGetConversation = vi.fn();
vi.mock('@/features/chat/api/useConversation', () => ({
  getConversation: (...args: unknown[]) => mockGetConversation(...args),
}));
let mockRouteId: string | undefined = 'conv-1';
vi.mock('@/utils', () => ({
  useConversationRouteId: () => mockRouteId,
}));

const message = (role: 'user' | 'assistant', text: string) => ({
  id: text,
  role,
  parts: [{ type: 'text', text }],
});

describe('<SessionReviewPanel />', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRouteId = 'conv-1';
  });
  afterEach(() => vi.unstubAllGlobals());

  it('keeps only what the user typed', () => {
    expect(
      userPrompts([
        message('user', 'Résume le rapport'),
        message('assistant', 'Voici le résumé'),
        message('user', '  '),
        message('user', 'Plus court'),
      ] as never),
    ).toEqual(['Résume le rapport', 'Plus court']);
  });

  it('asks to open a conversation on the welcome screen', () => {
    mockRouteId = undefined;
    render(<SessionReviewPanel language="French" />);

    expect(
      screen.getByText('Open a conversation to review it'),
    ).toBeInTheDocument();
  });

  it('reviews the prompts of the conversation', async () => {
    mockGetConversation.mockResolvedValue({
      messages: [
        message('user', 'Résume le rapport'),
        message('assistant', 'Voici'),
        message('user', 'En cinq points pour la direction'),
      ],
    });
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  summary: 'Belle progression.',
                  strengths: ['Vous précisez le format.'],
                  habits: ['Donner le contexte dès le départ.'],
                  tips: ['a', 'b', 'c'],
                  grades: [
                    { n: 1, score: 30, kind: 'summary' },
                    { n: 2, score: 72, kind: 'nonsense' },
                  ],
                }),
              },
            },
          ],
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    render(<SessionReviewPanel language="French" />);
    fireEvent.click(
      screen.getByRole('button', { name: /Review this session/ }),
    );

    expect(await screen.findByText('Belle progression.')).toBeInTheDocument();
    expect(
      screen.getByText('Donner le contexte dès le départ.'),
    ).toBeInTheDocument();
    const body = String(
      (fetchMock.mock.calls[0] as [string, RequestInit])[1].body,
    );
    expect(body).toContain('En cinq points pour la direction');
    expect(body).not.toContain('Voici');

    // The dashboard: average, progress, and the kinds of requests.
    expect(screen.getByText('51/100')).toBeInTheDocument();
    expect(screen.getByText('+42')).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /Grades in order/ }),
    ).toBeInTheDocument();
    expect(screen.getByText(/Other requests/)).toBeInTheDocument();
  });
});
