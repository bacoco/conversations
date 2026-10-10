/**
 * Imported audio files: small ones go as they are, long ones are decoded in
 * the browser and cut into light pieces (16 kHz mono WAV), so any length
 * goes through the relay.
 */

/** Files up to this size are sent in one piece. */
export const DIRECT_UPLOAD_BYTES = 20 * 1024 * 1024;
/**
 * Beyond this (about an hour of compressed audio), decoding in the browser
 * would take too much memory: the person is asked to cut the file.
 */
export const MAX_IMPORT_BYTES = 60 * 1024 * 1024;

export class AudioFileTooLargeError extends Error {}

const SAMPLE_RATE = 16000;
const PIECE_SECONDS = 60;

const toWav = (samples: Float32Array) => {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  const write = (offset: number, text: string) =>
    [...text].forEach((char, index) =>
      view.setUint8(offset + index, char.charCodeAt(0)),
    );
  write(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  write(8, 'WAVE');
  write(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  write(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  samples.forEach((sample, index) => {
    const value = Math.max(-1, Math.min(1, sample));
    view.setInt16(
      44 + index * 2,
      value < 0 ? value * 0x8000 : value * 0x7fff,
      true,
    );
  });
  return new Blob([buffer], { type: 'audio/wav' });
};

/**
 * The pieces of audio to transcribe, in order. Each WAV piece is built only
 * when asked for, so a single one is in memory at a time.
 */
export const splitAudioFile = async (
  file: File,
): Promise<{ count: number; piece: (index: number) => Blob }> => {
  if (file.size <= DIRECT_UPLOAD_BYTES) {
    return { count: 1, piece: () => file };
  }
  if (file.size > MAX_IMPORT_BYTES) {
    throw new AudioFileTooLargeError();
  }
  // Decoded straight at 16 kHz: four times less memory than at 48 kHz.
  const context = new AudioContext({ sampleRate: SAMPLE_RATE });
  let decoded: AudioBuffer;
  try {
    decoded = await context.decodeAudioData(await file.arrayBuffer());
  } finally {
    void context.close().catch(() => undefined);
  }
  // Mono at 16 kHz: what Whisper works with, and four times lighter.
  const length = Math.ceil(decoded.duration * SAMPLE_RATE);
  const offline = new OfflineAudioContext(1, length, SAMPLE_RATE);
  const source = offline.createBufferSource();
  source.buffer = decoded;
  source.connect(offline.destination);
  source.start();
  const samples = (await offline.startRendering()).getChannelData(0);
  const step = PIECE_SECONDS * SAMPLE_RATE;
  return {
    count: Math.ceil(samples.length / step),
    piece: (index) => toWav(samples.subarray(index * step, (index + 1) * step)),
  };
};
