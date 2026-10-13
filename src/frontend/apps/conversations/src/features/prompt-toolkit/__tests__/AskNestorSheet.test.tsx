import { render, screen } from '@testing-library/react';

import { AskNestorSheet } from '../chat/AskNestorSheet';
import type { NestorChat } from '../chat/useNestorChat';
import type { CaptureError } from '../speech/useSpeechCapture';
import { useMainConversationStore } from '../stores/useMainConversationStore';
import { useProfileStore } from '../stores/useProfileStore';

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const speech = vi.hoisted(() => ({
  error: null as CaptureError,
  status: 'idle',
  seconds: 0,
}));
vi.mock('../speech/useSpeechCapture', () => ({
  useSpeechCapture: () => ({
    status: speech.status,
    error: speech.error,
    seconds: speech.seconds,
    readLevel: () => 0.5,
    liveText: '',
    start: vi.fn(),
    stop: vi.fn(),
    clearError: vi.fn(),
  }),
}));

const chat = () =>
  ({
    sheetOpen: true,
    setSheetOpen: vi.fn(),
    askNestor: vi.fn(),
  }) as unknown as NestorChat;

describe('<AskNestorSheet /> says what one can say', () => {
  beforeEach(() => {
    useProfileStore.setState({ job: null });
    speech.error = null;
    speech.status = 'idle';
    speech.seconds = 0;
    useMainConversationStore.setState({
      latestCompletedAssistantMessageId: null,
      isAssistantResponding: false,
    });
  });

  it('before any answer: examples about the request', () => {
    render(<AskNestorSheet chat={chat()} />);
    expect(screen.getByText('For example, say')).toBeInTheDocument();
    expect(screen.getByText('« Look at what I wrote »')).toBeInTheDocument();
    expect(screen.getByText('« I am done, take stock »')).toBeInTheDocument();
    // Examples to say, not buttons.
    expect(
      screen.queryByRole('button', { name: /Look at what I wrote/ }),
    ).toBeNull();
  });

  it('after an answer: examples about the answer', () => {
    useMainConversationStore.setState({
      latestCompletedAssistantMessageId: 'a1',
    });
    render(<AskNestorSheet chat={chat()} />);
    expect(
      screen.getByText('« Is what it answered reliable? »'),
    ).toBeInTheDocument();
  });

  it('a blocked microphone is explained, and the keyboard opens', () => {
    speech.error = 'microphone';
    render(<AskNestorSheet chat={chat()} />);
    expect(
      screen.getByText(/Your browser blocks the microphone/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('textbox', { name: 'Your question to Nestor' }),
    ).toBeInTheDocument();
  });

  it('while it records, the button pulses, the time and the bars show it', () => {
    speech.status = 'recording';
    speech.seconds = 12;
    render(<AskNestorSheet chat={chat()} />);
    expect(screen.getByText('I am listening…')).toBeInTheDocument();
    expect(screen.getByText('00:12')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Your voice' })).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Stop listening' }),
    ).toHaveAttribute('data-recording', 'true');
  });

  it('with a job, the examples speak of its own tasks', () => {
    useProfileStore.setState({ job: { id: 'rh', label: 'Gestionnaire RH' } });
    render(<AskNestorSheet chat={chat()} />);
    // A task of the job, in the job's own words.
    expect(
      screen.getByText(/Help me to|sur ses congés ou son télétravail/),
    ).toBeInTheDocument();
    expect(
      screen.queryByText('« How do I make a table? »'),
    ).not.toBeInTheDocument();
  });
});
