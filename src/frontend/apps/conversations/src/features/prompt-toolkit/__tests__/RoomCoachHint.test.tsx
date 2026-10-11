import { act, fireEvent, render, screen } from '@testing-library/react';

import { useAiAvailability } from '../coach/aiAvailability';
import type { PromptAnalysis } from '../coach/coachApi';
import { RoomCoachHint } from '../components/RoomCoachHint';
import { useLearnProgressStore } from '../learn/useLearnProgressStore';
import { useCoachPrefsStore } from '../stores/useCoachPrefsStore';
import { useMainConversationStore } from '../stores/useMainConversationStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

const mockAnalyze = vi.fn();
vi.mock('../coach/coachApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../coach/coachApi')>()),
  analyzePrompt: (...args: unknown[]) =>
    mockAnalyze(...args) as Promise<PromptAnalysis>,
}));

const reading = (
  grades: Partial<PromptAnalysis['competencies']>,
  score = 40,
): PromptAnalysis => ({
  score,
  verdict: '',
  strengths: [],
  suggestions: [],
  kind: 'mail',
  competencies: {
    task: 80,
    context: 80,
    audience: 80,
    format: 80,
    sources: 80,
    constraints: 80,
    examples: 0,
    verification: 0,
    ...grades,
  },
});

const REQUEST = 'Écris un courriel pour annoncer la fermeture du service.';

/** The user types, then pauses long enough for the coach to read. */
const typeAndPause = async (text: string) => {
  act(() => {
    usePromptToolkitStore.setState({ chatInput: text });
  });
  await act(async () => {
    await vi.advanceTimersByTimeAsync(3000);
  });
};

describe('<RoomCoachHint />, the coach in the room', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    mockAnalyze.mockReset();
    useAiAvailability.setState({ status: 'available' });
    useCoachPrefsStore.getState().reset();
    useLearnProgressStore.getState().reset();
    usePromptToolkitStore.setState({
      chatInput: '',
      isOpen: false,
      mode: 'coach',
      showHome: true,
      fill: null,
    });
    useMainConversationStore.setState({
      turns: [],
      latestCompletedAssistantMessageId: null,
      isAssistantResponding: false,
    });
  });
  afterEach(() => vi.useRealTimers());

  it('says nothing while the user types, then one thing at a pause', async () => {
    mockAnalyze.mockResolvedValue(reading({ audience: 10 }));
    render(<RoomCoachHint />);
    act(() => {
      usePromptToolkitStore.setState({ chatInput: REQUEST });
    });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(1000);
    });
    expect(mockAnalyze).not.toHaveBeenCalled();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    await typeAndPause(REQUEST);
    expect(mockAnalyze).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('status')).toHaveTextContent(
      'For an email, say who it is for and the tone: cordial, formal…',
    );
    fireEvent.click(screen.getByRole('button', { name: 'Why?' }));
    expect(
      screen.getByText(/The same content is not written the same way/),
    ).toBeInTheDocument();
  });

  it('stays quiet on a clear request', async () => {
    mockAnalyze.mockResolvedValue(reading({}, 90));
    render(<RoomCoachHint />);
    await typeAndPause(REQUEST);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('warns about personal data, without the model', async () => {
    mockAnalyze.mockResolvedValue(reading({}, 90));
    render(<RoomCoachHint />);
    await typeAndPause(`${REQUEST} Son numéro : 1 85 05 78 006 084 36`);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Your request contains personal data',
    );
  });

  it('opens the coach on the request with "Fix it with me"', async () => {
    mockAnalyze.mockResolvedValue(reading({ audience: 10 }));
    render(<RoomCoachHint />);
    await typeAndPause(REQUEST);
    fireEvent.click(screen.getByRole('button', { name: 'Fix it with me' }));
    const state = usePromptToolkitStore.getState();
    expect(state.isOpen).toBe(true);
    expect(state.mode).toBe('coach');
    expect(state.pendingRead).toBe(true);
  });

  it('keeps quiet once closed, until the request is sent', async () => {
    mockAnalyze.mockResolvedValue(reading({ audience: 10 }));
    render(<RoomCoachHint />);
    await typeAndPause(REQUEST);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await typeAndPause(`${REQUEST} Merci.`);
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('can be turned off in "My coach"', async () => {
    useCoachPrefsStore.getState().setRoomCoach(false);
    mockAnalyze.mockResolvedValue(reading({ audience: 10 }));
    render(<RoomCoachHint />);
    await typeAndPause(REQUEST);
    expect(mockAnalyze).not.toHaveBeenCalled();
  });

  it('says what an answer leaves to complete before it is used', () => {
    useMainConversationStore.setState({
      turns: [
        { role: 'user', text: REQUEST },
        { role: 'assistant', text: 'Bonjour,\n…\n[Votre nom] [Votre service]' },
      ],
      latestCompletedAssistantMessageId: 'answer-1',
    });
    render(<RoomCoachHint />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'This answer is not ready to be sent yet: {{count}} parts to complete.',
    );
  });
});
