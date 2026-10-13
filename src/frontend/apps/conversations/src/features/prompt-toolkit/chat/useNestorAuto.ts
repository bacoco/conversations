import { useEffect, useRef } from 'react';

import { useConversationRouteId } from '@/utils';

import { useAfterAnswer } from '../coach/useAfterAnswer';
import { isAutoOn, useCoachPrefsStore } from '../stores/useCoachPrefsStore';
import { useMainConversationStore } from '../stores/useMainConversationStore';
import { NEW_CHAT_KEY, useNestorChatStore } from '../stores/useNestorChatStore';

import type { NestorChat } from './useNestorChat';

/** What Nestor does by himself, each part only when Auto allows it. */
export const useNestorAuto = (chat: NestorChat, language: string) => {
  const conversationId = useConversationRouteId();
  const prefs = useCoachPrefsStore();
  const turns = useMainConversationStore((state) => state.turns);
  const answerId = useMainConversationStore(
    (state) => state.latestCompletedAssistantMessageId,
  );
  const isResponding = useMainConversationStore(
    (state) => state.isAssistantResponding,
  );
  const requestCount = turns.filter((turn) => turn.role === 'user').length;

  // The thread written before the first send follows the conversation that
  // send creates: the page went from "new" to a conversation, and a request
  // is being answered there. An older conversation opened later never takes it.
  const previousIdRef = useRef(conversationId);
  const fromNewRef = useRef(false);
  useEffect(() => {
    if (conversationId !== previousIdRef.current) {
      fromNewRef.current = !previousIdRef.current && !!conversationId;
      previousIdRef.current = conversationId;
    }
    if (
      conversationId &&
      fromNewRef.current &&
      isResponding &&
      requestCount <= 1
    ) {
      fromNewRef.current = false;
      useNestorChatStore.getState().adopt(NEW_CHAT_KEY, conversationId);
    }
  }, [conversationId, isResponding, requestCount]);

  // "Demande n · 10 h 12" each time a request starts its answer.
  const wasRespondingRef = useRef(isResponding);
  useEffect(() => {
    if (isResponding && !wasRespondingRef.current) {
      chat.postRequest(requestCount);
    }
    wasRespondingRef.current = isResponding;
  }, [isResponding, requestCount, chat]);

  // Advice after each answer, once per answer.
  // An answer belongs to a conversation: on the new page, the one still in
  // memory is the previous conversation's, never commented here.
  const hasAnswer = !!conversationId && !!answerId && !isResponding;
  const advisedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!hasAnswer || !answerId || !isAutoOn(prefs, 'autoAdvice')) return;
    const known = chat.messages.some(
      (m) => m.kind === 'advice' && m.answerId === answerId,
    );
    if (known || advisedRef.current === answerId) return;
    advisedRef.current = answerId;
    chat.postAdvice(answerId);
  }, [hasAnswer, answerId, prefs, chat]);

  // Ways to go on, once the next questions are ready.
  const after = useAfterAnswer(
    !!conversationId && isAutoOn(prefs, 'autoSuites'),
    language,
  );
  useEffect(() => {
    if (
      !conversationId ||
      !answerId ||
      after.next.status !== 'ready' ||
      after.next.answerId !== answerId
    )
      return;
    if (chat.busy === 'advice') return; // after the advice, not before
    const known = chat.messages.some(
      (m) => m.kind === 'suites' && m.answerId === answerId,
    );
    if (!known && after.next.groups.length)
      chat.postSuites(answerId, after.next.groups);
  }, [conversationId, answerId, after.next, chat]);
};
