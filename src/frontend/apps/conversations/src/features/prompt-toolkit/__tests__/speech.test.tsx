import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';

import { RecorderView } from '../speech/RecorderView';
import {
  TRANSCRIPTION_URL,
  appendText,
  speechLanguageOf,
  transcribe,
} from '../speech/transcribe';
import { useRecorderStore } from '../speech/useRecorderStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

const mockShowToast = vi.fn();
vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

describe('transcription helpers', () => {
  it('adds dictated text after what is written, with one space', () => {
    expect(appendText('', 'Bonjour')).toBe('Bonjour');
    expect(appendText('Bonjour', 'à tous')).toBe('Bonjour à tous');
    expect(appendText('Bonjour\n', 'à tous')).toBe('Bonjour\nà tous');
    expect(appendText('Bonjour', '')).toBe('Bonjour');
  });

  it('transcribes in the language of the settings, French by default', () => {
    expect(speechLanguageOf('en-US')).toBe('en');
    expect(speechLanguageOf('fr')).toBe('fr');
    expect(speechLanguageOf('de')).toBe('fr');
    expect(speechLanguageOf(undefined)).toBe('fr');
  });

  it('sends the audio to the relay with Whisper and the language', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ text: ' Bonjour à tous. ' }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const text = await transcribe(
      new Blob(['x'], { type: 'audio/webm' }),
      'fr',
      {
        previous: 'début de la phrase',
      },
    );

    expect(text).toBe('Bonjour à tous.');
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe(TRANSCRIPTION_URL);
    expect(url).toMatch(/\/audio\/transcriptions$/);
    const form = init.body as FormData;
    expect(form.get('model')).toBe('whisper-large-v3');
    expect(form.get('language')).toBe('fr');
    expect(form.get('prompt')).toBe('début de la phrase');
    expect((form.get('file') as File).name).toBe('audio.webm');
    vi.unstubAllGlobals();
  });

  it('waits and tries again when the rate limit is reached', async () => {
    vi.useFakeTimers();
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 429 })
      .mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ text: 'Suite.' }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const result = transcribe(new Blob(['x']), 'fr');
    await vi.advanceTimersByTimeAsync(4000);

    await expect(result).resolves.toBe('Suite.');
    expect(fetchMock).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('fails clearly when the relay refuses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({ ok: false, status: 502 }),
    );
    await expect(transcribe(new Blob(['x']), 'en')).rejects.toThrow('502');
    vi.unstubAllGlobals();
  });
});

describe('<RecorderView />', () => {
  const setChatInput = vi.fn();
  beforeEach(() => {
    vi.clearAllMocks();
    usePromptToolkitStore.setState({ setChatInput });
    useRecorderStore.setState({ text: '' });
  });

  const answer = (content: string) =>
    vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ choices: [{ message: { content } }] }),
    });

  it('writes the minutes of a pasted text right in the panel', async () => {
    const fetchMock = answer('## Compte rendu\n\n- Budget validé');
    vi.stubGlobal('fetch', fetchMock);
    render(<RecorderView onBack={vi.fn()} />);

    expect(
      screen.queryByRole('button', { name: /Decision log/ }),
    ).not.toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: 'Text' }), {
      target: { value: 'Claire valide le budget formation.' },
    });
    fireEvent.click(screen.getByRole('radio', { name: 'Flash' }));
    fireEvent.click(screen.getByRole('button', { name: /Meeting minutes/ }));

    expect(await screen.findByText('Budget validé')).toBeInTheDocument();
    const body = JSON.parse(
      (fetchMock.mock.calls[0] as [string, RequestInit])[1].body as string,
    ) as { messages: { content: string }[] };
    expect(body.messages[0].content).toContain('From the text below, write');
    // Nothing left to fill in by hand in the result.
    expect(body.messages[0].content).toContain('Never write placeholders');
    expect(body.messages[0].content).toContain(
      'Claire valide le budget formation.',
    );
    expect(setChatInput).not.toHaveBeenCalled();

    // The result can still go to the conversation.
    fireEvent.click(
      screen.getByRole('button', { name: /Put in the conversation/ }),
    );
    expect(setChatInput).toHaveBeenCalledWith(
      '## Compte rendu\n\n- Budget validé',
    );
    vi.unstubAllGlobals();
  });

  it('writes a decision log or a translation, sends the raw text to the chat', async () => {
    const fetchMock = answer('Résultat');
    vi.stubGlobal('fetch', fetchMock);
    useRecorderStore.setState({ text: 'Karim rédige le cahier des charges.' });
    render(<RecorderView onBack={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: /Decision log/ }));
    expect(await screen.findByText('Résultat')).toBeInTheDocument();
    expect(String(fetchMock.mock.calls[0][1].body)).toContain('decision log');

    fireEvent.click(screen.getByRole('button', { name: /Translate/ }));
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
    expect(String(fetchMock.mock.calls[1][1].body)).toContain(
      'Translate the text below',
    );

    fireEvent.click(
      screen.getByRole('button', { name: /Send to the assistant/ }),
    );
    expect(setChatInput).toHaveBeenLastCalledWith(
      'Karim rédige le cahier des charges.',
    );
    vi.unstubAllGlobals();
  });

  it('keeps the text when the screen is left and comes back', () => {
    const { unmount } = render(<RecorderView onBack={vi.fn()} />);
    fireEvent.change(screen.getByRole('textbox', { name: 'Text' }), {
      target: { value: 'Notes de la réunion' },
    });
    unmount();

    render(<RecorderView onBack={vi.fn()} />);
    expect(screen.getByRole('textbox', { name: 'Text' })).toHaveValue(
      'Notes de la réunion',
    );
  });

  it('records, then shows the transcribed pieces', async () => {
    const stop = vi.fn();
    class FakeRecorder {
      state = 'inactive';
      mimeType = 'audio/webm';
      ondataavailable: ((event: { data: Blob }) => void) | null = null;
      onstop: ((event: Event) => void) | null = null;
      static isTypeSupported = () => true;
      start() {
        this.state = 'recording';
      }
      stop() {
        stop();
        this.state = 'inactive';
        this.ondataavailable?.({ data: new Blob([new Uint8Array(2000)]) });
        this.onstop?.(new Event('stop'));
      }
      pause() {
        this.state = 'paused';
      }
      resume() {
        this.state = 'recording';
      }
    }
    const track = { stop: vi.fn() };
    vi.stubGlobal('MediaRecorder', FakeRecorder);
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: vi.fn().mockResolvedValue({ getTracks: () => [track] }),
      },
    });
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ text: 'Le budget est validé.' }),
      }),
    );

    render(<RecorderView onBack={vi.fn()} />);
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Start recording' }));
    });
    fireEvent.click(
      await screen.findByRole('button', { name: 'Finish the recording' }),
    );

    await waitFor(() =>
      expect(screen.getByRole('textbox', { name: 'Text' })).toHaveValue(
        'Le budget est validé.',
      ),
    );
    expect(stop).toHaveBeenCalled();
    expect(track.stop).toHaveBeenCalled();
    vi.unstubAllGlobals();
  });
});
