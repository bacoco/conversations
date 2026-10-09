import { render, screen } from '@testing-library/react';

import { useAiAvailability } from '../coach/aiAvailability';
import { PanelHome } from '../components/PanelHome';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';
import { ToolsPanel } from '../tools/ToolsPanel';

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

describe('without the Albert relay', () => {
  beforeEach(() => {
    useAiAvailability.setState({ status: 'unavailable' });
    usePromptToolkitStore.setState({ hasSeenWelcome: true });
  });
  afterEach(() => {
    useAiAvailability.setState({ status: 'available' });
  });

  it('offers the course and the tools, not the coach', () => {
    render(<PanelHome />);
    expect(screen.queryByText('Prompt coach')).not.toBeInTheDocument();
    expect(screen.getByText('Prompting course')).toBeInTheDocument();
    expect(screen.getByText('Everyday tools')).toBeInTheDocument();
  });

  it('hides the tools that need Robin', () => {
    render(<ToolsPanel />);
    expect(screen.getByText('Reply to an email')).toBeInTheDocument();
    expect(screen.queryByText('Improve my text')).not.toBeInTheDocument();
  });

  it('asks the relay whether the AI features are there', async () => {
    useAiAvailability.setState({ status: 'checking' });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response(null, { status: 404 })),
    );
    await useAiAvailability.getState().check();
    expect(useAiAvailability.getState().status).toBe('unavailable');
    vi.unstubAllGlobals();
  });
});
