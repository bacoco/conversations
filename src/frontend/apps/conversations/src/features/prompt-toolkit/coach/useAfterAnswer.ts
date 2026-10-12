import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useMainConversationStore } from '../stores/useMainConversationStore';

import { NextGroup, placeholdersOf, suggestNextQuestions } from './coachApi';

/** The parts the latest answer leaves in brackets, each once. */
export const answerGaps = (text: string) => [
  ...new Set(placeholdersOf(text).map((part) => part.trim())),
];

export type AfterStatus = 'idle' | 'loading' | 'ready' | 'error';

/** The shown names of the standard axes, in the order of STANDARD_AXES. */
export const useStandardAxisLabels = () => {
  const { t } = useTranslation();
  return {
    deepen: t('Go deeper'),
    reshape: t('Reshape'),
    step_back: t('Step back'),
  };
};

/**
 * What the coach has for the latest answer of the Assistant: the next
 * questions by axis, prepared by itself as soon as an answer is complete.
 * They belong to one answer: a new answer starts them over. Nestor's view,
 * asked for with "Advice", is the thread of useCoachThread.
 */
export const useAfterAnswer = (enabled: boolean, language: string) => {
  const answerId = useMainConversationStore(
    (state) => state.latestCompletedAssistantMessageId,
  );
  const isResponding = useMainConversationStore(
    (state) => state.isAssistantResponding,
  );
  const axisLabels = useStandardAxisLabels();
  const standardLabels = Object.values(axisLabels).join('\n');
  const [next, setNext] = useState<{
    answerId: string | null;
    status: AfterStatus;
    groups: NextGroup[];
  }>({ answerId: null, status: 'idle', groups: [] });
  const nextControllerRef = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      nextControllerRef.current?.abort();
    },
    [],
  );

  const prepareNext = useCallback(() => {
    const id =
      useMainConversationStore.getState().latestCompletedAssistantMessageId;
    nextControllerRef.current?.abort();
    const controller = new AbortController();
    nextControllerRef.current = controller;
    setNext({ answerId: id, status: 'loading', groups: [] });
    suggestNextQuestions(
      useMainConversationStore.getState().turns,
      language,
      controller.signal,
      standardLabels.split('\n'),
    )
      .then((groups) => setNext({ answerId: id, status: 'ready', groups }))
      .catch(() => {
        if (!controller.signal.aborted) {
          setNext({ answerId: id, status: 'error', groups: [] });
        }
      });
  }, [language, standardLabels]);

  // Each completed answer: the next questions are prepared at once.
  useEffect(() => {
    if (enabled && !isResponding && answerId && next.answerId !== answerId) {
      prepareNext();
    }
  }, [enabled, isResponding, answerId, next.answerId, prepareNext]);

  const isCurrent = (id: string | null) => !!answerId && id === answerId;
  const turns = useMainConversationStore((state) => state.turns);
  const lastAnswer =
    [...turns].reverse().find((turn) => turn.role === 'assistant')?.text ?? '';
  return {
    hasAnswer: !!answerId && !isResponding,
    /** Parts of the latest answer to fill in before using it. */
    gaps: answerId && !isResponding ? answerGaps(lastAnswer) : [],
    next: isCurrent(next.answerId)
      ? next
      : { answerId: null, status: 'idle' as AfterStatus, groups: [] },
    prepareNext,
  };
};
