import { fireEvent, render, screen } from '@testing-library/react';
import type { TFunction } from 'i18next';

import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';
import { ToolsPanel } from '../tools/ToolsPanel';
import { buildToolPrompt, getDailyTools } from '../tools/tools';

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
  });

  it('prepares the prompt of a tool in the chat input', () => {
    render(<ToolsPanel />);

    fireEvent.click(screen.getByRole('button', { name: /Translate/ }));
    fireEvent.click(screen.getByRole('radio', { name: 'German' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Text to work on' }), {
      target: { value: 'Bonjour à tous' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: /Prepare in the message field/ }),
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
});
