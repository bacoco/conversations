import { useCallback, useEffect, useRef, useState } from 'react';

import { useConversationRouteId } from '@/utils';

import { threadOf, useCoachThreadStore } from '../stores/useCoachThreadStore';
import { useMainConversationStore } from '../stores/useMainConversationStore';

import { CoachFollowUp, coachThreadNote, coachThreadReply } from './coachApi';
import { answerGaps } from './useAfterAnswer';

export type ThreadStatus = 'idle' | 'loading' | 'error';

/** From this many requests, the thread ends on the session review. */
export const THREAD_REVIEW_FROM = 2;

/**
 * The coach's thread on the current conversation: one note each time
 * "Advice" is asked, on the exchanges since the previous note, and the
 * questions asked with a button under a note.
 */
export const useCoachThread = (language: string) => {
  const conversationId = useConversationRouteId();
  const entries = useCoachThreadStore((state) =>
    threadOf(state.threads, conversationId),
  );
  const addNote = useCoachThreadStore((state) => state.addNote);
  const addReply = useCoachThreadStore((state) => state.addReply);
  const clearThread = useCoachThreadStore((state) => state.clear);
  const turns = useMainConversationStore((state) => state.turns);
  const answerId = useMainConversationStore(
    (state) => state.latestCompletedAssistantMessageId,
  );
  const isResponding = useMainConversationStore(
    (state) => state.isAssistantResponding,
  );
  const hasAnswer = !!answerId && !isResponding;

  const [status, setStatus] = useState<ThreadStatus>('idle');
  const [asking, setAsking] = useState<{
    entryId: string;
    ask: CoachFollowUp;
    status: ThreadStatus;
  } | null>(null);
  const noteControllerRef = useRef<AbortController | null>(null);
  const replyControllerRef = useRef<AbortController | null>(null);

  // A thread belongs to one conversation.
  useEffect(() => {
    noteControllerRef.current?.abort();
    replyControllerRef.current?.abort();
    setStatus('idle');
    setAsking(null);
  }, [conversationId]);
  useEffect(
    () => () => {
      noteControllerRef.current?.abort();
      replyControllerRef.current?.abort();
    },
    [],
  );

  const coveredUpTo = entries.at(-1)?.upTo ?? 0;
  /** Requests answered since the last note: what a new note reads. */
  const newExchanges = hasAnswer
    ? turns.slice(coveredUpTo).filter((turn) => turn.role === 'user').length
    : 0;
  const requestCount = turns.filter((turn) => turn.role === 'user').length;

  const askNote = useCallback(() => {
    if (!conversationId) {
      return;
    }
    const { turns: current } = useMainConversationStore.getState();
    const thread = threadOf(
      useCoachThreadStore.getState().threads,
      conversationId,
    );
    const previous = thread.at(-1) ?? null;
    noteControllerRef.current?.abort();
    const controller = new AbortController();
    noteControllerRef.current = controller;
    setStatus('loading');
    const answer =
      [...current].reverse().find((turn) => turn.role === 'assistant')?.text ??
      '';
    coachThreadNote(
      current,
      previous,
      language,
      controller.signal,
      answerGaps(answer),
    )
      .then((note) => {
        addNote(conversationId, note);
        setStatus('idle');
      })
      .catch(() => {
        if (!controller.signal.aborted) {
          setStatus('error');
        }
      });
  }, [conversationId, language, addNote]);

  const askMore = useCallback(
    (entryId: string, ask: CoachFollowUp) => {
      if (!conversationId) {
        return;
      }
      const entry = threadOf(
        useCoachThreadStore.getState().threads,
        conversationId,
      ).find((item) => item.id === entryId);
      if (!entry) {
        return;
      }
      replyControllerRef.current?.abort();
      const controller = new AbortController();
      replyControllerRef.current = controller;
      setAsking({ entryId, ask, status: 'loading' });
      coachThreadReply(
        entry,
        ask,
        useMainConversationStore.getState().turns,
        language,
        controller.signal,
      )
        .then((reply) => {
          addReply(conversationId, entryId, { ...reply, ask });
          setAsking(null);
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setAsking({ entryId, ask, status: 'error' });
          }
        });
    },
    [conversationId, language, addReply],
  );

  const clear = useCallback(() => {
    noteControllerRef.current?.abort();
    replyControllerRef.current?.abort();
    setStatus('idle');
    setAsking(null);
    if (conversationId) {
      clearThread(conversationId);
    }
  }, [conversationId, clearThread]);

  return {
    entries,
    status,
    asking,
    hasAnswer,
    /** Requests answered since the last note; 0 when there is nothing new. */
    newExchanges,
    canReview: requestCount >= THREAD_REVIEW_FROM,
    askNote,
    askMore,
    clear,
  };
};
