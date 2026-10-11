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
      { intent: 'decline', tone: 'formal' },
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

  it('prepares the prompt of a tool in the chat input', () => {
    render(<ToolsPanel />);
    fireEvent.click(screen.getByRole('button', { name: /^Translate/ }));
    fireEvent.click(screen.getByRole('radio', { name: 'German' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Text to work on' }), {
      target: { value: 'Bonjour à tous' },
    });
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Prepare without sending, to read it first',
      }),
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
  });

  it('shows at once what AI can do, family by family', () => {
    render(<ToolsPanel />);
    expect(
      screen.getByRole('heading', { name: 'What AI can do for you' }),
    ).toBeInTheDocument();
    for (const family of ['Write', 'Summarise', 'Organise']) {
      expect(screen.getByRole('heading', { name: family })).toBeInTheDocument();
    }
    expect(
      within(screen.getByRole('list', { name: 'Write' })).getByRole('button', {
        name: /Reply to an email/,
      }),
    ).toBeInTheDocument();
    // A search remains, for what one does not see.
    expect(screen.getByRole('searchbox')).toBeInTheDocument();
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

  it('puts pinned and recent tools first', () => {
    useToolsUsageStore.setState({
      recent: ['summary'],
      favorites: ['translate'],
    });
    render(<ToolsPanel />);
    const mine = screen.getByRole('list', { name: 'My tools' });
    const names = within(mine)
      .getAllByRole('listitem')
      .map((item) => item.textContent ?? '');
    expect(names[0]).toContain('Translate');
    expect(names[1]).toContain('Summar');
    fireEvent.click(
      within(mine).getByRole('button', {
        name: 'Remove {{title}} from my tools',
      }),
    );
    expect(useToolsUsageStore.getState().favorites).toEqual([]);
  });

  it('remembers the tools opened', () => {
    render(<ToolsPanel />);
    fireEvent.click(screen.getByRole('button', { name: /^Translate/ }));
    expect(useToolsUsageStore.getState().recent).toEqual(['translate']);
  });

  it('asks the Assistant in one click, leaving the message field alone', () => {
    const sendQuestion = vi.fn();
    useMainConversationStore.setState({ sendQuestion });
    render(<ToolsPanel />);
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
