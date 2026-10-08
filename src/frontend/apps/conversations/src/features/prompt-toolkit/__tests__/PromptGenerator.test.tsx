import { fireEvent, render, screen } from '@testing-library/react';

import { parseGeneratedPrompts } from '../coach/coachApi';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';
import { PromptGenerator } from '../tools/PromptGenerator';

const mockShowToast = vi.fn();
vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

describe('parseGeneratedPrompts', () => {
  it('keeps at most three prompts with text', () => {
    expect(
      parseGeneratedPrompts({
        prompts: [
          { title: 'A', prompt: 'one', why: 'w' },
          { title: 'B', prompt: '  ' },
          { prompt: 'two' },
          { prompt: 'three' },
          { prompt: 'four' },
        ],
      }),
    ).toEqual([
      { title: 'A', prompt: 'one', why: 'w' },
      { title: '', prompt: 'two', why: '' },
      { title: '', prompt: 'three', why: '' },
    ]);
  });
});

describe('<PromptGenerator />', () => {
  const setChatInput = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    usePromptToolkitStore.setState({ setChatInput });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('turns a need into prompts the user can use', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  prompts: [
                    {
                      title: 'Note à l’équipe',
                      prompt: 'Rédige une note à mon équipe sur [sujet].',
                      why: 'Pour une diffusion rapide.',
                    },
                  ],
                }),
              },
            },
          ],
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    render(<PromptGenerator onBack={vi.fn()} />);

    const button = screen.getByRole('button', { name: /Suggest prompts/ });
    expect(button).toBeDisabled();
    fireEvent.change(screen.getByRole('textbox', { name: 'Your need' }), {
      target: { value: 'Expliquer les règles de télétravail' },
    });
    fireEvent.click(screen.getByRole('radio', { name: /Short/ }));
    fireEvent.click(screen.getByRole('button', { name: /Suggest prompts/ }));

    expect(await screen.findByText('Note à l’équipe')).toBeInTheDocument();
    const body = String(
      (fetchMock.mock.calls[0] as [string, RequestInit])[1].body,
    );
    expect(body).toContain('Expliquer les règles de télétravail');
    expect(body).toContain('two short');

    // Something is left to fill in: Robin asks for it first.
    fireEvent.click(screen.getByRole('button', { name: /^Use$/ }));
    expect(setChatInput).not.toHaveBeenCalled();
    expect(usePromptToolkitStore.getState().fill?.template).toBe(
      'Rédige une note à mon équipe sur [sujet].',
    );
  });

  it('merges several prompts into one', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  prompt: '1. Résume. 2. Traduis.',
                  changes: ['Deux résumés fusionnés'],
                  conflicts: ['« 5 points » ou « court » : 5 points gardés'],
                }),
              },
            },
          ],
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    render(<PromptGenerator onBack={vi.fn()} />);

    fireEvent.click(screen.getByRole('radio', { name: /Merge prompts/ }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Your prompts' }), {
      target: { value: 'Résume.\n\nTraduis.' },
    });
    fireEvent.click(screen.getByRole('button', { name: /Merge into one/ }));

    expect(
      await screen.findByText('1. Résume. 2. Traduis.'),
    ).toBeInTheDocument();
    expect(
      String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body),
    ).toContain('<prompt n=\\"2\\">');
    expect(
      String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body),
    ).toContain('mistral-medium');
  });
});
