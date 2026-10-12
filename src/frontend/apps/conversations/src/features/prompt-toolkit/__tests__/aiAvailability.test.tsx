import { fireEvent, render, screen } from '@testing-library/react';

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
    expect(
      screen.queryByText(
        'Improves your requests, before and after the answer.',
      ),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Course')).toBeInTheDocument();
    expect(screen.getByText('Everyday tools')).toBeInTheDocument();
  });

  it('hides the tools that need Nestor', () => {
    render(<ToolsPanel />);
    fireEvent.click(screen.getByRole('button', { name: /^Write/ }));
    fireEvent.click(screen.getByRole('button', { name: /^Rework/ }));
    expect(screen.getByRole('radio', { name: 'Shorten' })).toBeInTheDocument();
    expect(
      screen.queryByRole('radio', { name: 'Improve with Nestor' }),
    ).not.toBeInTheDocument();
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
