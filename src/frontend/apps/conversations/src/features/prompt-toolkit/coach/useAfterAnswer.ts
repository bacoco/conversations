import { useCallback, useEffect, useRef, useState } from 'react';

import { useMainConversationStore } from '../stores/useMainConversationStore';

import {
  coachConversationTurn,
  placeholdersOf,
  suggestNextQuestions,
} from './coachApi';

/** The parts the latest answer leaves in brackets, each once. */
export const answerGaps = (text: string) => [
  ...new Set(placeholdersOf(text).map((part) => part.trim())),
];

export type AfterStatus = 'idle' | 'loading' | 'ready' | 'error';

/**
 * What the coach has for the latest answer of the Assistant: the next
 * questions, prepared by itself as soon as an answer is complete, and
 * Nestor's view of the exchange, asked for with "Advice". Both belong to
 * one answer: a new answer starts them over.
 */
export const useAfterAnswer = (enabled: boolean, language: string) => {
  const answerId = useMainConversationStore(
    (state) => state.latestCompletedAssistantMessageId,
  );
  const isResponding = useMainConversationStore(
    (state) => state.isAssistantResponding,
  );
  const [next, setNext] = useState<{
    answerId: string | null;
    status: AfterStatus;
    questions: string[];
  }>({ answerId: null, status: 'idle', questions: [] });
  const [advice, setAdvice] = useState<{
    answerId: string | null;
    status: AfterStatus;
    text: string;
  }>({ answerId: null, status: 'idle', text: '' });
  const nextControllerRef = useRef<AbortController | null>(null);
  const adviceControllerRef = useRef<AbortController | null>(null);
  useEffect(
    () => () => {
      nextControllerRef.current?.abort();
      adviceControllerRef.current?.abort();
    },
    [],
  );

  const prepareNext = useCallback(() => {
    const id =
      useMainConversationStore.getState().latestCompletedAssistantMessageId;
    nextControllerRef.current?.abort();
    const controller = new AbortController();
    nextControllerRef.current = controller;
    setNext({ answerId: id, status: 'loading', questions: [] });
    suggestNextQuestions(
      useMainConversationStore.getState().turns,
      language,
      controller.signal,
      2,
    )
      .then((questions) =>
        setNext({ answerId: id, status: 'ready', questions }),
      )
      .catch(() => {
        if (!controller.signal.aborted) {
          setNext({ answerId: id, status: 'error', questions: [] });
        }
      });
  }, [language]);

  // Each completed answer: the next questions are prepared at once.
  useEffect(() => {
    if (enabled && !isResponding && answerId && next.answerId !== answerId) {
      prepareNext();
    }
  }, [enabled, isResponding, answerId, next.answerId, prepareNext]);

  const askAdvice = useCallback(() => {
    const id =
      useMainConversationStore.getState().latestCompletedAssistantMessageId;
    if (!id) {
      return;
    }
    adviceControllerRef.current?.abort();
    const controller = new AbortController();
    adviceControllerRef.current = controller;
    setAdvice({ answerId: id, status: 'loading', text: '' });
    const { turns } = useMainConversationStore.getState();
    const answer =
      [...turns].reverse().find((turn) => turn.role === 'assistant')?.text ??
      '';
    coachConversationTurn(
      turns,
      language,
      controller.signal,
      answerGaps(answer),
    )
      .then((turn) =>
        setAdvice({ answerId: id, status: 'ready', text: turn.text }),
      )
      .catch(() => {
        if (!controller.signal.aborted) {
          setAdvice({ answerId: id, status: 'error', text: '' });
        }
      });
  }, [language]);

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
      : { answerId: null, status: 'idle' as AfterStatus, questions: [] },
    advice: isCurrent(advice.answerId)
      ? advice
      : { answerId: null, status: 'idle' as AfterStatus, text: '' },
    prepareNext,
    askAdvice,
  };
};
