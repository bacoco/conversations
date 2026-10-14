import { CunninghamProvider } from '@gouvfr-lasuite/cunningham-react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import type { TFunction } from 'i18next';

import { useMainConversationStore } from '../stores/useMainConversationStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';
import { ToolsPanel } from '../tools/ToolsPanel';
import { buildToolPrompt, getDailyTools } from '../tools/tools';
import { useToolsUsageStore } from '../tools/useToolsUsageStore';

const mockShowToast = vi.fn();
vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

const t = ((key: string, options?: Record<string, string>) =>
  key.replace(
    /{{(\w+)}}/g,
    (_, name: string) => options?.[name] ?? '',
  )) as TFunction;

describe('daily tools', () => {
  it('build a prompt with the chosen options and the source text', () => {
    const tool = getDailyTools(t).find((item) => item.id === 'email-reply')!;
    const prompt = buildToolPrompt(
      tool,
      { intent: 'decline', tone: 'formal', level: 'complete' },
      'Bonjour, pouvez-vous…',
    );

    expect(prompt).toContain('Goal: decline politely and explain why');
    expect(prompt).toContain('Tone: formal');
    expect(prompt).toContain('Bonjour, pouvez-vous…');
  });

  it('use a placeholder when the source text is empty', () => {
    const tool = getDailyTools(t).find((item) => item.id === 'rewrite')!;
    expect(buildToolPrompt(tool, {}, '  ')).toContain('[paste the text here]');
  });

  it('every tool has unique ids and at least one choice per option', () => {
    const tools = getDailyTools(t);
    expect(new Set(tools.map((tool) => tool.id)).size).toBe(tools.length);
    for (const tool of tools) {
      for (const group of tool.options) {
        expect(group.choices.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('<ToolsPanel />', () => {
  const setChatInput = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    usePromptToolkitStore.setState({ setChatInput });
    useToolsUsageStore.setState({ recent: [], favorites: [] });
  });

  // A heavy render: some slack on a loaded machine.
  it(
    'prepares the prompt of a tool in the chat input',
    { timeout: 15_000 },
    () => {
      // The request opens in a window, as in the app.
      render(
        <CunninghamProvider>
          <ToolsPanel />
        </CunninghamProvider>,
      );
      fireEvent.click(screen.getByRole('button', { name: /^Write/ }));
      fireEvent.click(screen.getByRole('button', { name: /^Translate/ }));
      fireEvent.click(screen.getByRole('radio', { name: 'German' }));
      fireEvent.change(
        screen.getByRole('textbox', { name: 'Text to work on' }),
        {
          target: { value: 'Bonjour à tous' },
        },
      );
      // The request, part by part in its colours, before it goes.
      fireEvent.click(screen.getByRole('button', { name: 'See my request' }));
      expect(screen.getByText('Your request, explained')).toBeInTheDocument();
      for (const part of [
        'Context',
        'Precise instruction',
        'Expected format',
        'Reference document',
      ]) {
        expect(screen.getAllByText(part).length).toBeGreaterThan(0);
      }
      fireEvent.click(screen.getByRole('button', { name: 'Help' }));
      expect(
        screen.getByText('A good request always has these four parts'),
      ).toBeInTheDocument();
      fireEvent.click(
        screen.getByRole('button', { name: 'Put it in the message field' }),
      );

      const prompt = setChatInput.mock.calls[0][0] as string;
      expect(prompt).toContain('{{language}}'.replace('{{language}}', ''));
      expect(prompt).toContain('Bonjour à tous');
      expect(mockShowToast).toHaveBeenCalledWith(
        'success',
        expect.any(String),
        undefined,
        4000,
      );
    },
  );

  it('shows what AI can do as four cards; a card opens its tools', () => {
    render(<ToolsPanel />);
    expect(
      screen.getByRole('heading', { name: 'What AI can do for you' }),
    ).toBeInTheDocument();
    const cards = within(
      screen.getByRole('list', { name: 'What AI can do for you' }),
    ).getAllByRole('button');
    expect(cards).toHaveLength(4);
    // Nothing of a family's tools until its card is opened.
    expect(
      screen.queryByRole('button', { name: /^Reply/ }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /^Write/ }));
    expect(screen.getByRole('heading', { name: 'Write' })).toBeInTheDocument();
    // Its tools, as cards too: one verb each.
    for (const name of [/^Reply/, /^Draft/, /^Rework/, /^Translate/]) {
      expect(screen.getByRole('button', { name })).toBeInTheDocument();
    }
    fireEvent.click(
      screen.getByRole('button', { name: 'What AI can do for you' }),
    );
    expect(
      screen.getAllByRole('button', { name: /^Write/ }).length,
    ).toBeGreaterThan(0);
  });

  it('writes the request in four blocks the user can rewrite', () => {
    const sendQuestion = vi.fn();
    useMainConversationStore.setState({ sendQuestion });
    render(<ToolsPanel />);
    fireEvent.click(screen.getByRole('button', { name: /^Write/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Reply/ }));
    for (const block of [
      'Context',
      'Precise instruction',
      'Expected format',
      'Reference document',
    ]) {
      expect(screen.getByRole('group', { name: block })).toBeInTheDocument();
    }
    const context = within(
      screen.getByRole('group', { name: 'Context' }),
    ).getByRole('textbox');
    fireEvent.change(context, {
      target: { value: 'I answer a member of the public, for my office.' },
    });
    // A choice rewrites its own block only: the context typed stays.
    const format = screen.getByRole('group', { name: 'Expected format' });
    fireEvent.change(within(format).getByRole('textbox'), {
      target: { value: 'Ten lines at most.' },
    });
    fireEvent.click(within(format).getByRole('radio', { name: 'Formal' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Email received' }), {
      target: { value: 'Bonjour, où en est mon dossier ?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ask the Assistant' }));

    const prompt = sendQuestion.mock.calls[0][0] as string;
    expect(prompt).toMatch(/^I answer a member of the public, for my office\./);
    expect(prompt).toContain('Tone:');
    expect(prompt).not.toContain('Ten lines at most.');
    expect(prompt).toContain('Bonjour, où en est mon dossier ?');
  });

  it('improves a text with Nestor from "Rework"', () => {
    const startFill = vi.fn();
    usePromptToolkitStore.setState({ startFill });
    render(<ToolsPanel />);
    fireEvent.click(screen.getByRole('button', { name: /^Write/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Rework/ }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Text to work on' }), {
      target: { value: 'La réunion est déplacée.' },
    });
    fireEvent.click(screen.getByRole('radio', { name: 'Improve with Nestor' }));
    fireEvent.click(screen.getByRole('button', { name: 'Start with Nestor' }));

    expect(startFill).toHaveBeenCalledWith(
      expect.stringContaining('La réunion est déplacée.'),
      'Rework a text',
      '',
      'draft',
    );
  });

  it('finds tools from the words of the need, accents aside', () => {
    render(<ToolsPanel />);
    fireEvent.change(screen.getByRole('searchbox'), {
      target: { value: 'traduire en anglais' },
    });
    const found = screen.getByRole('list', { name: 'Tools for your need' });
    expect(
      within(found).getByRole('button', { name: /^Translate/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', {
        name: 'Search the templates for this need',
      }),
    ).toBeInTheDocument();
  });

  it('remembers the tools opened', () => {
    render(<ToolsPanel />);
    fireEvent.click(screen.getByRole('button', { name: /^Write/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Translate/ }));
    expect(useToolsUsageStore.getState().recent).toEqual(['translate']);
  });

  it('asks the Assistant in one click, leaving the message field alone', () => {
    const sendQuestion = vi.fn();
    useMainConversationStore.setState({ sendQuestion });
    render(<ToolsPanel />);
    fireEvent.click(screen.getByRole('button', { name: /^Write/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Translate/ }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Text to work on' }), {
      target: { value: 'Bonjour à tous' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ask the Assistant' }));
    expect(sendQuestion).toHaveBeenCalledWith(
      expect.stringContaining('Bonjour à tous'),
    );
    expect(setChatInput).not.toHaveBeenCalled();
    expect(usePromptToolkitStore.getState().offerAnswerHelp).toBe(true);
  });
});
