import { fireEvent, render, screen } from '@testing-library/react';

import { AnswerHelpBanner } from '../components/AnswerHelpBanner';
import { useMainConversationStore } from '../stores/useMainConversationStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

describe('<AnswerHelpBanner />', () => {
  beforeEach(() => {
    useMainConversationStore.setState({
      latestCompletedAssistantMessageId: 'answer-1',
      isAssistantResponding: false,
    });
    usePromptToolkitStore.setState({
      offerAnswerHelp: true,
      mode: 'tools',
      showHome: false,
    });
  });

  it('points to the coach once the answer is there', () => {
    render(<AnswerHelpBanner isCoachShown={false} />);
    fireEvent.click(screen.getByRole('button', { name: 'See' }));
    expect(usePromptToolkitStore.getState().mode).toBe('coach');
    expect(usePromptToolkitStore.getState().offerAnswerHelp).toBe(false);
  });

  it('says nothing while the answer is written, or in the coach', () => {
    useMainConversationStore.setState({ isAssistantResponding: true });
    const { container, rerender } = render(
      <AnswerHelpBanner isCoachShown={false} />,
    );
    expect(container).toBeEmptyDOMElement();
    useMainConversationStore.setState({ isAssistantResponding: false });
    rerender(<AnswerHelpBanner isCoachShown />);
    expect(container).toBeEmptyDOMElement();
  });

  it('goes on with the answer when a tool of the panel asked', () => {
    usePromptToolkitStore.setState({
      followAnswer: true,
      finishNextAnswer: false,
    });
    render(<AnswerHelpBanner isCoachShown={false} />);
    const state = usePromptToolkitStore.getState();
    expect(state.mode).toBe('coach');
    expect(state.finishNextAnswer).toBe(true);
    expect(state.followAnswer).toBe(false);
  });
});
