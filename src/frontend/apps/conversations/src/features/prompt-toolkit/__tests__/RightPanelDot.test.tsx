import { render, screen } from '@testing-library/react';

import { RightPanelToggle } from '../components/RightPanelToggle';
import { useMainConversationStore } from '../stores/useMainConversationStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

describe('<RightPanelToggle /> after a request the coach read', () => {
  beforeEach(() => {
    useMainConversationStore.setState({
      latestCompletedAssistantMessageId: 'answer-1',
      isAssistantResponding: false,
    });
  });

  it('shows a gentle sign on the closed panel, never opens it', () => {
    usePromptToolkitStore.setState({
      isOpen: false,
      coachWaitsForAnswer: true,
    });
    render(<RightPanelToggle />);
    expect(
      screen.getByRole('button', {
        name: 'Open the right panel: the coach can help with the answer',
      }),
    ).toBeInTheDocument();
    expect(usePromptToolkitStore.getState().isOpen).toBe(false);
  });

  it('forgets the sign once the panel is open', () => {
    usePromptToolkitStore.setState({ isOpen: true, coachWaitsForAnswer: true });
    render(<RightPanelToggle />);
    expect(usePromptToolkitStore.getState().coachWaitsForAnswer).toBe(false);
  });

  it('says nothing while the answer is still being written', () => {
    useMainConversationStore.setState({ isAssistantResponding: true });
    usePromptToolkitStore.setState({
      isOpen: false,
      coachWaitsForAnswer: true,
    });
    render(<RightPanelToggle />);
    expect(
      screen.getByRole('button', { name: 'Open the right panel' }),
    ).toBeInTheDocument();
  });
});
