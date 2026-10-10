import { useCallback, useEffect, useRef, useState } from 'react';

import { SpeechLanguage, transcribe } from './transcribe';

export type CaptureStatus =
  'idle' | 'starting' | 'recording' | 'paused' | 'transcribing';

export type CaptureError = 'microphone' | 'transcription' | null;

/** How often the live text is refreshed. */
const LIVE_SECONDS = 3;

const preferredType = () => {
  const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4'];
  return types.find((type) => MediaRecorder.isTypeSupported?.(type)) ?? '';
};

/**
 * Records the microphone in pieces of `chunkSeconds` and transcribes each
 * piece as soon as it is complete, in order: the text arrives while the
 * person is still speaking, and a long recording never makes one huge file.
 */
export const useSpeechCapture = ({
  language,
  chunkSeconds,
  onText,
  live = false,
}: {
  language: SpeechLanguage;
  chunkSeconds: number;
  /** Called with each transcribed piece, in recording order. */
  onText: (text: string) => void;
  /**
   * Also transcribe the piece being recorded every few seconds, so the
   * text shows while the person speaks (`liveText`), until the piece's
   * final text replaces it.
   */
  live?: boolean;
}) => {
  const [status, setStatus] = useState<CaptureStatus>('idle');
  const [error, setError] = useState<CaptureError>(null);
  const [seconds, setSeconds] = useState(0);
  const [pending, setPending] = useState(0);
  const [liveText, setLiveText] = useState('');

  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const chunkElapsedRef = useRef(0);
  const stoppingRef = useRef(false);
  /** Set at once, so a double click never opens two microphones. */
  const busyRef = useRef(false);
  /** Wanted even between two pieces, when no recorder is running. */
  const pausedRef = useRef(false);
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const previousRef = useRef('');
  const onTextRef = useRef(onText);
  onTextRef.current = onText;
  const languageRef = useRef(language);
  languageRef.current = language;
  const mountedRef = useRef(true);
  /** The piece being recorded: its parts so far, for the live text. */
  const pieceRef = useRef<{ id: number; parts: Blob[]; type: string } | null>(
    null,
  );
  const pieceCountRef = useRef(0);
  /** Which piece the live text shows. */
  const livePieceRef = useRef(-1);
  const isLiveBusyRef = useRef(false);

  const release = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void audioContextRef.current?.close().catch(() => undefined);
    audioContextRef.current = null;
    analyserRef.current = null;
    recorderRef.current = null;
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stoppingRef.current = true;
      if (recorderRef.current?.state !== 'inactive') {
        recorderRef.current?.stop();
      }
      release();
    };
  }, [release]);

  /** Transcribes the pieces one after the other, keeping their order. */
  const enqueue = useCallback((blob: Blob, pieceId: number) => {
    const clearLive = () => {
      if (livePieceRef.current === pieceId && mountedRef.current) {
        livePieceRef.current = -1;
        setLiveText('');
      }
    };
    if (blob.size < 1000) {
      clearLive();
      return;
    }
    setPending((count) => count + 1);
    queueRef.current = queueRef.current.then(async () => {
      try {
        const text = await transcribe(blob, languageRef.current, {
          previous: previousRef.current,
        });
        // Delivered even after the screen is left: the caller keeps the
        // text in a store, so the end of a recording is never lost.
        if (text) {
          previousRef.current = `${previousRef.current} ${text}`.slice(-400);
          onTextRef.current(text);
        }
        clearLive();
      } catch {
        clearLive();
        if (mountedRef.current) setError('transcription');
      } finally {
        if (mountedRef.current) setPending((count) => count - 1);
      }
    });
  }, []);

  /** A new recorder for each piece, so every piece is a complete file. */
  const startPiece = useCallback(
    (stream: MediaStream) => {
      const type = preferredType();
      const recorder = new MediaRecorder(
        stream,
        type ? { mimeType: type } : {},
      );
      const parts: Blob[] = [];
      const piece = { id: pieceCountRef.current++, parts, type };
      pieceRef.current = piece;
      recorder.ondataavailable = (event) => {
        if (event.data.size) parts.push(event.data);
      };
      recorder.onstop = () => {
        if (pieceRef.current === piece) pieceRef.current = null;
        enqueue(new Blob(parts, { type: recorder.mimeType || type }), piece.id);
        if (!stoppingRef.current && streamRef.current) {
          startPiece(streamRef.current);
        }
      };
      // Live: the data comes every second, so a piece can be read early.
      recorder.start(live ? 1000 : undefined);
      if (pausedRef.current) recorder.pause();
      recorderRef.current = recorder;
      chunkElapsedRef.current = 0;
    },
    [enqueue, live],
  );

  /** Reads the piece being recorded so far (a webm cut short decodes fine). */
  const transcribeLive = useCallback(() => {
    const piece = pieceRef.current;
    if (!piece || !piece.parts.length || isLiveBusyRef.current) return;
    isLiveBusyRef.current = true;
    const blob = new Blob(piece.parts, {
      type: piece.parts[0].type || piece.type,
    });
    transcribe(blob, languageRef.current, { previous: previousRef.current })
      .then((text) => {
        // Too late if this piece's final text is already there.
        if (pieceRef.current === piece && mountedRef.current && text) {
          livePieceRef.current = piece.id;
          setLiveText(text);
        }
      })
      .catch(() => undefined)
      .finally(() => {
        isLiveBusyRef.current = false;
      });
  }, []);

  const start = useCallback(async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    pausedRef.current = false;
    setError(null);
    setSeconds(0);
    setStatus('starting');
    stoppingRef.current = false;
    previousRef.current = '';
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      busyRef.current = false;
      setError('microphone');
      setStatus('idle');
      return;
    }
    // Stopped while the browser was asking for the microphone.
    if (!mountedRef.current || stoppingRef.current) {
      stream.getTracks().forEach((track) => track.stop());
      busyRef.current = false;
      if (mountedRef.current) setStatus('idle');
      return;
    }
    streamRef.current = stream;
    try {
      const context = new AudioContext();
      const analyser = context.createAnalyser();
      analyser.fftSize = 256;
      context.createMediaStreamSource(stream).connect(analyser);
      audioContextRef.current = context;
      analyserRef.current = analyser;
    } catch {
      // The level meter is a bonus: recording works without it.
    }
    startPiece(stream);
    setStatus('recording');
    timerRef.current = setInterval(() => {
      const recorder = recorderRef.current;
      if (!recorder || recorder.state !== 'recording') return;
      setSeconds((value) => value + 1);
      chunkElapsedRef.current += 1;
      if (chunkElapsedRef.current >= chunkSeconds) {
        recorder.stop();
      } else if (live && chunkElapsedRef.current % LIVE_SECONDS === 0) {
        transcribeLive();
      }
    }, 1000);
  }, [chunkSeconds, live, startPiece, transcribeLive]);

  const pause = useCallback(() => {
    if (!recorderRef.current || stoppingRef.current) return;
    pausedRef.current = true;
    if (recorderRef.current.state === 'recording') {
      recorderRef.current.pause();
    }
    setStatus('paused');
  }, []);

  const resume = useCallback(() => {
    if (!recorderRef.current || stoppingRef.current) return;
    pausedRef.current = false;
    if (recorderRef.current.state === 'paused') {
      recorderRef.current.resume();
    }
    setStatus('recording');
  }, []);

  const stop = useCallback(() => {
    const recorder = recorderRef.current;
    stoppingRef.current = true;
    // Still asking for the microphone: `start` gives it back.
    if (!recorder) return;
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    const previousOnStop = recorder.onstop;
    recorder.onstop = (event) => {
      previousOnStop?.call(recorder, event);
      release();
      setStatus('transcribing');
      void queueRef.current.then(() => {
        busyRef.current = false;
        if (mountedRef.current) setStatus('idle');
      });
    };
    if (recorder.state !== 'inactive') recorder.stop();
  }, [release]);

  /** Microphone level between 0 and 1, for the wave. */
  const readLevel = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return 0;
    const data = new Uint8Array(analyser.fftSize);
    analyser.getByteTimeDomainData(data);
    let peak = 0;
    for (const value of data) peak = Math.max(peak, Math.abs(value - 128));
    return Math.min(1, peak / 64);
  }, []);

  return {
    status,
    error,
    seconds,
    /** Pieces recorded but not transcribed yet. */
    pending,
    /** What is being said, before its final text (live mode). */
    liveText,
    start,
    pause,
    resume,
    stop,
    readLevel,
    clearError: () => setError(null),
  };
};
