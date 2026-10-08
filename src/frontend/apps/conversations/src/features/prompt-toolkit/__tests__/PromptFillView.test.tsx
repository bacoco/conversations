import { act, fireEvent, render, screen } from '@testing-library/react';

import { hasPlaceholders, parseFillStep } from '../coach/coachApi';
import { PromptFillView } from '../fill/PromptFillView';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const completion = (content: object) =>
  new Response(
    JSON.stringify({
      choices: [{ message: { content: JSON.stringify(content) } }],
    }),
    { status: 200 },
  );

const TEMPLATE = 'Write an email to [recipient] about [topic].';

describe('guided prompt filling', () => {
  const setChatInput = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    usePromptToolkitStore.setState({
      setChatInput,
      fill: { template: TEMPLATE, title: 'Email' },
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('spots what is left to fill in', () => {
    expect(hasPlaceholders(TEMPLATE)).toBe(true);
    expect(hasPlaceholders('Write an email to my team.')).toBe(false);
    expect(parseFillStep({ final_prompt: ' Done. ' })).toEqual({
      kind: 'final',
      prompt: 'Done.',
    });
    expect(() => parseFillStep({})).toThrow();
  });

  it('asks the questions, then puts the complete prompt in the chat', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        completion({ message: 'Who is it for?', suggestions: ['My team'] }),
      )
      .mockResolvedValueOnce(
        completion({
          final_prompt: 'Write an email to my team about the move.',
        }),
      );
    vi.stubGlobal('fetch', fetchMock);

    render(<PromptFillView template={TEMPLATE} title="Email" />);

    expect(await screen.findByText('Who is it for?')).toBeInTheDocument();
    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(String(init.body)).toContain('[recipient]');
    // Robin talks with the stronger chat model.
    expect(String(init.body)).toContain('mistral-medium');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'My team' }));
    });

    expect(
      await screen.findByText('Write an email to my team about the move.'),
    ).toBeInTheDocument();
    const [, second] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(String(second.body)).toContain('My team');

    fireEvent.click(screen.getByRole('button', { name: 'Use this prompt' }));
    expect(setChatInput).toHaveBeenCalledWith(
      'Write an email to my team about the move.',
    );
    expect(usePromptToolkitStore.getState().fill).toBeNull();
  });

  it('strengthens a draft, then changes the final prompt on request', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(completion({ final_prompt: 'Long prompt.' }))
      .mockResolvedValueOnce(
        completion({ improved_prompt: 'Short prompt.', changes: ['Shorter'] }),
      );
    vi.stubGlobal('fetch', fetchMock);

    render(
      <PromptFillView
        template="Summarise the report"
        title="Draft"
        mode="draft"
      />,
    );
    expect(await screen.findByText('Long prompt.')).toBeInTheDocument();
    const [, first] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(String(first.body)).toContain('<draft>');

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Shorter' }));
    });
    expect(await screen.findByText('Short prompt.')).toBeInTheDocument();
    const [, second] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(String(second.body)).toContain('Long prompt.');
    expect(String(second.body)).toContain('mistral-medium');
  });
});
