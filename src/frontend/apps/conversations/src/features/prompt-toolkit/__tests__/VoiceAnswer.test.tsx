import { fireEvent, render, screen } from '@testing-library/react';

import { VoiceAnswer } from '../chat/VoiceAnswer';

const capture = vi.hoisted(() => ({
  status: 'idle',
  error: 'microphone',
  liveText: '',
  start: vi.fn(() => Promise.resolve()),
  stop: vi.fn(),
}));
vi.mock('../speech/useSpeechCapture', () => ({
  useSpeechCapture: () => capture,
}));

describe('<VoiceAnswer />', () => {
  it('without a microphone, says so and lets the answer be typed', () => {
    const onSend = vi.fn();
    render(<VoiceAnswer onSend={onSend} onCancel={vi.fn()} />);
    expect(
      screen.getByText(
        'The microphone does not answer. Type your answer instead.',
      ),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Or type it' }));
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Tout le service' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send my answer' }));
    expect(onSend).toHaveBeenCalledWith('Tout le service', 'keyboard');
  });
});
