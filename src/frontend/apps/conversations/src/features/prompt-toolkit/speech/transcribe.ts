/**
 * Speech to text through the Albert relay (Whisper). The audio only travels
 * to the relay: nothing is kept, only the returned text.
 */

import { COACH_COMPLETIONS_URL } from '../coach/coachApi';

const env = import.meta.env as Record<string, string | undefined>;

/** Same Albert proxy as the coach, transcription route. */
const COMPLETIONS_PATH = 'chat/completions';
export const TRANSCRIPTION_URL = COACH_COMPLETIONS_URL.endsWith(
  COMPLETIONS_PATH,
)
  ? `${COACH_COMPLETIONS_URL.slice(0, -COMPLETIONS_PATH.length)}audio/transcriptions`
  : '';
export const TRANSCRIPTION_MODEL =
  env.VITE_PROMPT_COACH_TRANSCRIPTION_MODEL || 'whisper-large-v3';

/** Whisper gets the spoken language: French or English. */
export type SpeechLanguage = 'fr' | 'en';

export const speechLanguageOf = (uiLanguage?: string): SpeechLanguage =>
  uiLanguage?.toLowerCase().startsWith('en') ? 'en' : 'fr';

/** Recording can work in this browser (microphone and encoder). */
export const canRecord = () =>
  typeof window !== 'undefined' &&
  typeof window.MediaRecorder !== 'undefined' &&
  typeof navigator.mediaDevices?.getUserMedia === 'function';

export class TranscriptionError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
  }
}

const extensionOf = (type: string) => {
  if (type.includes('webm')) return 'webm';
  if (type.includes('ogg')) return 'ogg';
  if (type.includes('mp4') || type.includes('m4a')) return 'm4a';
  if (type.includes('mpeg') || type.includes('mp3')) return 'mp3';
  return 'wav';
};

/**
 * Sends one piece of audio and returns its text. `previous` is the end of
 * the text already transcribed, so a sentence cut between two pieces keeps
 * its spelling.
 */
export const transcribe = async (
  audio: Blob,
  language: SpeechLanguage,
  { previous, signal }: { previous?: string; signal?: AbortSignal } = {},
) => {
  if (!TRANSCRIPTION_URL) {
    throw new TranscriptionError('Transcription is not available.');
  }
  const form = new FormData();
  const name =
    audio instanceof File && audio.name
      ? audio.name
      : `audio.${extensionOf(audio.type)}`;
  form.append('file', audio, name);
  form.append('model', TRANSCRIPTION_MODEL);
  form.append('language', language);
  if (previous) {
    form.append('prompt', previous.slice(-200));
  }
  // A long import can reach the relay's rate limit: wait, then try again.
  let response = await send(form, signal);
  for (let attempt = 1; response.status === 429 && attempt <= 5; attempt++) {
    await wait(attempt * 4000, signal);
    response = await send(form, signal);
  }
  if (!response.ok) {
    throw new TranscriptionError(
      `Transcription failed (${response.status}).`,
      response.status,
    );
  }
  const data = (await response.json()) as { text?: string };
  return (data.text ?? '').trim();
};

const send = (form: FormData, signal?: AbortSignal) =>
  fetch(TRANSCRIPTION_URL, {
    method: 'POST',
    credentials: 'include',
    signal,
    body: form,
  });

const wait = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(new TranscriptionError('Transcription cancelled.'));
    });
  });

/** Adds dictated text after what is already written. */
export const appendText = (current: string, added: string) => {
  if (!added) return current;
  if (!current.trim()) return added;
  return /\s$/.test(current) ? `${current}${added}` : `${current} ${added}`;
};
