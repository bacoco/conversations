import { fireEvent, render, screen } from '@testing-library/react';

import { VoiceAnswer } from '../chat/VoiceAnswer';

const capture = vi.hoisted(() => ({
  status: 'idle',
  error: 'microphone',
  liveText: '',
  seconds: 0,
  readLevel: () => 0.5,
  start: vi.fn(() => Promise.resolve()),
  stop: vi.fn(),
}));
vi.mock('../speech/useSpeechCapture', () => ({
  useSpeechCapture: () => capture,
}));

describe('<VoiceAnswer />', () => {
  it('without a microphone, says so and opens the field at once', () => {
    const onSend = vi.fn();
    render(<VoiceAnswer onSend={onSend} onCancel={vi.fn()} />);
    expect(
      screen.getByText(
        'The microphone does not answer. Type your answer instead.',
      ),
    ).toBeInTheDocument();
    // The field is there at once: nothing more to find.
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Tout le service' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send my answer' }));
    expect(onSend).toHaveBeenCalledWith('Tout le service', 'keyboard');
  });

  it('while it records, the time and the bars show it listens', () => {
    capture.status = 'recording';
    capture.error = null;
    capture.seconds = 7;
    render(<VoiceAnswer onSend={vi.fn()} onCancel={vi.fn()} />);
    expect(screen.getByText('I am listening…')).toBeInTheDocument();
    expect(screen.getByText('00:07')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: 'Your voice' })).toBeInTheDocument();
  });
});
