import { Fragment, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { keyframes } from 'styled-components';

import type { SensitiveKind } from '../coach/sensitiveData';
import { DemoNoteView } from '../demo/DemoNoteView';
import { type DemoNote, useDemoStore } from '../stores/useDemoStore';
import { useTourStore } from '../stores/useTourStore';

import { CloseMatches } from './CloseMatches';
import { InChatRounds } from './InChatRounds';
import { MessageView, SENSITIVE_WORDS } from './NestorMessages';
import { Welcome } from './Welcome';
import { NESTOR_AVATAR_URL } from './avatar';
import type { CloseMatchesFound } from './closeMatches';
import { foldSummary, foldThread } from './fold';
import {
  C,
  Fold,
  FoldChevron,
  Hello,
  NestorBubble,
  ThreadInner,
  ThreadScroll,
  Warn,
} from './ui';
import type { NestorChat } from './useNestorChat';

const NO_NOTES: DemoNote[] = [];

/** Closer than this to the bottom, the reader follows new messages. */
const FOLLOW_PX = 80;

const Typing = styled.div`
  align-self: center;
  font-size: 12px;
  color: ${C.muted};
  background: #ffffff;
  border: 1px dashed ${C.grey};
  border-radius: 999px;
  padding: 6px 12px;
`;

const bounce = keyframes`
  0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
  30% { transform: translateY(-4px); opacity: 1; }
`;

/** Nestor's head and three dots that move, like someone thinking. */
const Thinking = styled.div`
  align-self: flex-start;
  display: flex;
  align-items: center;
  gap: 8px;
  & > img {
    width: 28px;
    height: 28px;
    border-radius: 50%;
  }
  & > span {
    display: inline-flex;
    gap: 4px;
    padding: 10px 14px;
    border-radius: 16px;
    background: ${C.soft};
  }
  & i {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${C.brand};
    animation: ${bounce} 1.2s infinite ease-in-out;
  }
  & i:nth-child(2) {
    animation-delay: 0.15s;
  }
  & i:nth-child(3) {
    animation-delay: 0.3s;
  }
  @media (prefers-reduced-motion: reduce) {
    & i {
      animation: none;
    }
  }
`;

export const NestorThread = ({
  chat,
  pistes,
  close,
  thinking = false,
  fieldSensitive = [],
}: {
  chat: NestorChat;
  pistes: string[];
  /** Nestor reads what is being typed: three dots move. */
  thinking?: boolean;
  /** Personal data in the request typed for the Assistant: a warning. */
  fieldSensitive?: SensitiveKind[];
  /** A case and a model close to what is being typed, under the ideas. */
  close?: CloseMatchesFound;
}) => {
  const { t } = useTranslation();
  const endRef = useRef<HTMLDivElement | null>(null);
  const startRef = useRef<HTMLDivElement | null>(null);
  const followRef = useRef(true);
  const parts = useMemo(
    () => foldThread(chat.messages, chat.action),
    [chat.messages, chat.action],
  );
  const last = chat.messages.at(-1);
  // The demo: Nestor's words about each button, under what they follow.
  // During the guided tour, Nestor speaks in the middle instead.
  const touring = useTourStore((state) => state.active);
  const demoNotes = useDemoStore((state) =>
    state.active && !touring ? state.notes : NO_NOTES,
  );
  const notesAfter = (id: string) =>
    demoNotes
      .filter((note) => note.after === id)
      .map((note) => (
        <DemoNoteView key={`${note.after}-${note.step}`} step={note.step} />
      ));
  const lastId = last?.id ?? '';
  // A round kept from earlier ("Refaire avec…") names what is still missing.
  const closeCount = Number(!!close?.caseMatch) + Number(!!close?.model);
  const missing =
    chat.messages.findLast((message) => message.kind === 'version')?.missing ??
    [];

  // Follow new messages only when the reader is at the bottom.
  useEffect(() => {
    const scroller = endRef.current?.closest('[data-panel-scroll]');
    if (!scroller) return;
    const onScroll = () => {
      followRef.current =
        scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <
        FOLLOW_PX;
    };
    scroller.addEventListener('scroll', onScroll);
    return () => scroller.removeEventListener('scroll', onScroll);
  }, []);
  // What Nestor just said is read from its beginning: when it is taller
  // than the panel, its first line goes to the top, never out of sight.
  useLayoutEffect(() => {
    if (!followRef.current) return;
    const end = endRef.current;
    const start = startRef.current;
    const scroller = end?.closest('[data-panel-scroll]');
    if (
      start &&
      end &&
      scroller &&
      end.offsetTop - start.offsetTop > scroller.clientHeight
    ) {
      start.scrollIntoView?.({ block: 'start' });
      return;
    }
    end?.scrollIntoView?.({ block: 'end' });
  }, [
    chat.messages.length,
    chat.busy,
    pistes.length,
    closeCount,
    thinking,
    demoNotes.length,
    fieldSensitive.length,
  ]);
  // The first message of the latest step.
  const firstOfStep = parts.findIndex(
    (part) => part.kind !== 'fold' && part.message.action === chat.action,
  );

  return (
    <ThreadScroll
      data-panel-scroll
      data-testid="nestor-thread"
      data-tour="thread"
    >
      <ThreadInner>
        {/* Nestor's welcome opens the thread, always. */}
        <Hello>
          <img src={NESTOR_AVATAR_URL} alt="" />
        </Hello>
        <Welcome
          chat={chat}
          open={
            chat.messages.length === 0 && pistes.length === 0 && !closeCount
          }
        />
        {parts.map((part, index) =>
          part.kind === 'fold' ? (
            <Fold key={part.messages[0].id}>
              <summary>
                <FoldChevron />
                <span>{foldSummary(part.messages, t)}</span>
              </summary>
              <div>
                {part.messages.map((message) => (
                  <MessageView key={message.id} message={message} chat={chat} />
                ))}
              </div>
            </Fold>
          ) : (
            <Fragment key={part.message.id}>
              {index === firstOfStep && <div ref={startRef} />}
              <MessageView message={part.message} chat={chat} />
              {part.message.id !== lastId && notesAfter(part.message.id)}
            </Fragment>
          ),
        )}
        {pistes.length > 0 && (
          <MessageView
            message={{
              id: 'live-pistes',
              action: chat.action,
              kind: 'pistes',
              phrases: pistes,
            }}
            chat={chat}
          />
        )}
        {/* A safety warning, the one thing shown without being asked. */}
        {fieldSensitive.length > 0 && (
          <NestorBubble>
            <Warn>
              {t('⚠ Your request for the Assistant holds {{what}}.', {
                what: fieldSensitive
                  .map((kind) => t(SENSITIVE_WORDS[kind]))
                  .join(', '),
              })}
            </Warn>
            <span>
              {t(
                'Nothing has left yet. Remove it before sending, or replace it with a neutral marker (« [numéro] », « Personne A »): the task often works without it.',
              )}
            </span>
          </NestorBubble>
        )}
        {close && <CloseMatches {...close} />}
        {thinking && !chat.busy && (
          <Thinking role="status" aria-label={t('Nestor is thinking…')}>
            <img src={NESTOR_AVATAR_URL} alt="" />
            <span aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
          </Thinking>
        )}
        {chat.busy && <Typing role="status">{t('Nestor is writing…')}</Typing>}
        {last?.rounds?.length ? (
          <InChatRounds
            message={last}
            missing={missing}
            rounds={last.rounds}
            onRound={(round) => chat.runRound(last.id, round)}
          />
        ) : null}
        {/* Under the last answer and its buttons; at the top, the intro. */}
        {notesAfter(lastId)}
        <div ref={endRef} />
      </ThreadInner>
    </ThreadScroll>
  );
};
