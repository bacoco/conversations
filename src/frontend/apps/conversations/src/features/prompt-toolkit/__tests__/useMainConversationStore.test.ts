import { useMainConversationStore } from '../stores/useMainConversationStore';

describe('main conversation bridge', () => {
  beforeEach(() => {
    useMainConversationStore.setState({
      turns: [],
      latestCompletedAssistantMessageId: null,
      isAssistantResponding: false,
      sendQuestion: null,
    });
  });

  it('publishes a completed main-chat answer for right-panel modules', () => {
    useMainConversationStore.getState().publish({
      turns: [
        { role: 'user', text: 'Prépare une note.' },
        { role: 'assistant', text: 'Voici une trame.' },
      ],
      latestCompletedAssistantMessageId: 'assistant-42',
      isAssistantResponding: false,
    });

    expect(useMainConversationStore.getState()).toMatchObject({
      latestCompletedAssistantMessageId: 'assistant-42',
      isAssistantResponding: false,
      turns: [
        { role: 'user', text: 'Prépare une note.' },
        { role: 'assistant', text: 'Voici une trame.' },
      ],
    });
  });

  it('calls the registered main-chat sender when a suggested question is chosen', () => {
    const sender = vi.fn();
    const unregister = useMainConversationStore
      .getState()
      .registerQuestionSender(sender);

    useMainConversationStore.getState().sendQuestion?.('Peux-tu préciser ?');
    expect(sender).toHaveBeenCalledWith('Peux-tu préciser ?');

    unregister();
    expect(useMainConversationStore.getState().sendQuestion).toBeNull();
  });
});
