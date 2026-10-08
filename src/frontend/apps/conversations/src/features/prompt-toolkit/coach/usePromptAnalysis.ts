import { useCallback, useEffect, useRef, useState } from 'react';

import { PromptAnalysis, analyzePrompt } from './coachApi';

export type AnalysisStatus = 'idle' | 'loading' | 'ready' | 'error';

interface AnalysisState {
  status: AnalysisStatus;
  analysis: PromptAnalysis | null;
  /** The text the current analysis was computed on. */
  analyzedText: string;
  errorStatus?: number;
}

const INITIAL_STATE: AnalysisState = {
  status: 'idle',
  analysis: null,
  analyzedText: '',
};

/**
 * Grade `text` when the user asks (`analyzeNow`). The previous analysis stays
 * visible during a new request so the panel does not flicker.
 */
export const usePromptAnalysis = (text: string, language: string) => {
  const [state, setState] = useState<AnalysisState>(INITIAL_STATE);
  const controllerRef = useRef<AbortController | null>(null);
  const trimmed = text.trim();

  const run = useCallback(
    (prompt: string) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setState((previous) => ({ ...previous, status: 'loading' }));

      analyzePrompt(prompt, language, controller.signal)
        .then((analysis) => {
          setState({ status: 'ready', analysis, analyzedText: prompt });
        })
        .catch((error: unknown) => {
          if (controller.signal.aborted) {
            return;
          }
          setState((previous) => ({
            ...previous,
            status: 'error',
            errorStatus: (error as { status?: number }).status,
          }));
        });
    },
    [language],
  );

  useEffect(() => () => controllerRef.current?.abort(), []);

  const analyzeNow = useCallback(() => {
    if (trimmed) {
      run(trimmed);
    }
  }, [run, trimmed]);

  /** Forget the current analysis. */
  const reset = useCallback(() => {
    controllerRef.current?.abort();
    setState({ status: 'idle', analysis: null, analyzedText: trimmed });
  }, [trimmed]);

  return {
    ...state,
    /** Any text can be analysed, even a single word. */
    isLongEnough: trimmed.length > 0,
    /** The analysis no longer matches what is in the input. */
    isStale: state.analysis !== null && state.analyzedText !== trimmed,
    analyzeNow,
    reset,
  };
};
