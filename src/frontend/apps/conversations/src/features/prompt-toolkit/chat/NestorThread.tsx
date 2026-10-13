import { Fragment, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { InChatRounds } from './InChatRounds';
import { MessageView } from './NestorMessages';
import { NESTOR_AVATAR_URL } from './avatar';
import { foldSummary, foldThread } from './fold';
import {
  C,
  Fold,
  FoldChevron,
  Hello,
  NestorBubble,
  ThreadInner,
  ThreadScroll,
} from './ui';
import type { NestorChat } from './useNestorChat';

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

export const NestorThread = ({
  chat,
  pistes,
}: {
  chat: NestorChat;
  pistes: string[];
}) => {
  const { t } = useTranslation();
  const endRef = useRef<HTMLDivElement | null>(null);
  const followRef = useRef(true);
  const parts = useMemo(
    () => foldThread(chat.messages, chat.action),
    [chat.messages, chat.action],
  );
  const last = chat.messages.at(-1);
  // A round kept from earlier ("Refaire avec…") names what is still missing.
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
  useLayoutEffect(() => {
    if (followRef.current) endRef.current?.scrollIntoView?.({ block: 'end' });
  }, [chat.messages.length, chat.busy, pistes.length]);

  return (
    <ThreadScroll data-panel-scroll data-testid="nestor-thread">
      <ThreadInner>
        {/* Nestor's welcome opens the thread, always. */}
        <Hello>
          <img src={NESTOR_AVATAR_URL} alt="" />
        </Hello>
        <NestorBubble>
          <span>
            {t(
              'Hello! Write your request in the Assistant’s field, in the middle, as you would tell a colleague. I suggest starting ideas as you type.',
            )}
          </span>
          <span>
            {t('A question for me? Click “Ask Nestor”, at the bottom right.')}
          </span>
        </NestorBubble>
        {chat.messages.length === 0 && pistes.length === 0 && (
          <InChatRounds
            message={{
              id: 'hello',
              action: 0,
              kind: 'hint',
              hint: 'new-request',
            }}
            missing={[]}
            rounds={[{ id: 'examples', primary: true }]}
            onRound={() => chat.runRound('hello', { id: 'examples' })}
          />
        )}
        {parts.map((part) =>
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
              <MessageView message={part.message} chat={chat} />
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
        {chat.busy && <Typing role="status">{t('Nestor is writing…')}</Typing>}
        {last?.rounds?.length ? (
          <InChatRounds
            message={last}
            missing={missing}
            rounds={last.rounds}
            onRound={(round) => chat.runRound(last.id, round)}
          />
        ) : null}
        <div ref={endRef} />
      </ThreadInner>
    </ThreadScroll>
  );
};
