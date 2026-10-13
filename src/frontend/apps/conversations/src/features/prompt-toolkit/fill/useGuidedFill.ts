import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useToast } from '@/components';

import {
  FILL_MODEL,
  FillMode,
  FillStep,
  nextFillStep,
  refinePrompt,
} from '../coach/coachApi';

export interface Exchange {
  question: string;
  answer: string;
  /** The user skipped the question: no answer to carry. */
  skipped?: boolean;
}

export type GuidedFillStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * Nestor's guided questions on a prompt: one question at a time, with ready
 * answers, until a complete prompt with no brackets left. Shared by the
 * "Complete the prompt" page and the coach.
 */
export const useGuidedFill = ({
  template,
  language,
  context = '',
  mode = 'template',
  enabled = true,
  restartKey = 0,
}: {
  template: string;
  language: string;
  /** What the user already wrote, used to ask fewer questions. */
  context?: string;
  mode?: FillMode;
  /** False until there is something to work on: nothing is asked. */
  enabled?: boolean;
  /** Changing it starts over (the panel's trash button). */
  restartKey?: number;
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [step, setStep] = useState<FillStep | null>(null);
  const [status, setStatus] = useState<GuidedFillStatus>(
    enabled ? 'loading' : 'idle',
  );
  /** Changes asked on the final prompt, shown as a conversation. */
  const [adjustments, setAdjustments] = useState<
    { request: string; reply: string }[]
  >([]);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const ask = useCallback(
    (history: Exchange[], finishNow = false) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setStatus('loading');
      nextFillStep(
        template,
        history,
        language,
        controller.signal,
        finishNow,
        context,
        mode,
      )
        .then((next) => {
          setStep(next);
          setStatus('ready');
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setStatus('error');
          }
        });
    },
    [template, language, context, mode],
  );

  // Start, and start over when asked.
  useEffect(() => {
    setExchanges([]);
    setStep(null);
    setAdjustments([]);
    if (!enabled) {
      controllerRef.current?.abort();
      setStatus('idle');
      return;
    }
    ask([]);
    return () => controllerRef.current?.abort();
  }, [ask, restartKey, enabled]);

  const question = step?.kind === 'question' ? step : null;
  const final = step?.kind === 'final' ? step : null;

  const reply = (text: string, skipped = false) => {
    if (!question || status === 'loading') {
      return;
    }
    const history = [
      ...exchanges,
      {
        question: question.question,
        answer: text,
        ...(skipped && { skipped }),
      },
    ];
    setExchanges(history);
    ask(history);
  };

  // "Change the tone", "add a date": Nestor edits the final prompt in place.
  const adjust = async (request: string) => {
    if (!final) {
      return;
    }
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsAdjusting(true);
    try {
      const adjusted = await refinePrompt(
        final.prompt,
        request,
        language,
        controller.signal,
        FILL_MODEL,
      );
      // Keep Nestor's congratulation; only the prompt changes.
      setStep({ ...final, prompt: adjusted.improvedPrompt });
      setAdjustments((list) => [
        ...list,
        {
          request,
          reply: adjusted.changes.length
            ? t('Done: {{changes}}.', {
                changes: adjusted.changes.join(', '),
              })
            : t('Done, the prompt is updated.'),
        },
      ]);
    } catch {
      if (!controller.signal.aborted) {
        showToast(
          'error',
          t('Nestor could not change the prompt. Please retry.'),
        );
      }
    } finally {
      setIsAdjusting(false);
    }
  };

  return {
    exchanges,
    question,
    final,
    status,
    adjustments,
    isAdjusting,
    reply,
    /** Skip the current question. */
    skip: () => reply(t('I do not know, skip this question.'), true),
    /** Stop the questions: the prompt is written with what is known. */
    finish: () => ask(exchanges, true),
    retry: () => ask(exchanges),
    adjust,
  };
};

export type GuidedFill = ReturnType<typeof useGuidedFill>;
