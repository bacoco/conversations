import { Fragment, useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Text } from '@/components';

import { InChatRounds } from './InChatRounds';
import { MessageView, NestorBubble } from './NestorMessages';
import { foldSummary, foldThread } from './fold';
import type { NestorChat } from './useNestorChat';

/** Closer than this to the bottom, the reader follows new messages. */
const FOLLOW_PX = 80;

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
    <Box
      $gap="14px"
      $padding={{ horizontal: 'base', vertical: 'base' }}
      $css="flex: 1; justify-content: flex-end;"
    >
      {chat.messages.length === 0 && (
        <>
          <NestorBubble>
            {t(
              'Hello! Write your request in the Assistant’s field, in the middle, as you would tell a colleague. I suggest starting ideas as you type.',
            )}
          </NestorBubble>
          <InChatRounds
            message={{
              id: 'hello',
              action: 0,
              kind: 'hint',
              hint: 'new-request',
            }}
            rounds={[{ id: 'examples', primary: true }]}
            onRound={() => chat.runRound('hello', { id: 'examples' })}
          />
        </>
      )}
      {parts.map((part) =>
        part.kind === 'fold' ? (
          <Box
            as="details"
            key={part.messages[0].id}
            $css="border-radius: 8px; background: #f6f6f6; padding: 6px 10px;"
          >
            <Box as="summary" $css="cursor: pointer; font-size: 0.8125rem;">
              {foldSummary(part.messages, t)}
            </Box>
            <Box $gap="10px" $css="margin-top: 8px;">
              {part.messages.map((message) => (
                <MessageView key={message.id} message={message} chat={chat} />
              ))}
            </Box>
          </Box>
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
      {chat.busy && (
        <Text $size="sm" $variation="secondary" role="status">
          {t('Nestor is writing…')}
        </Text>
      )}
      {last?.rounds?.length ? (
        <InChatRounds
          message={last}
          rounds={last.rounds}
          onRound={(round) => chat.runRound(last.id, round)}
        />
      ) : null}
      <div ref={endRef} />
    </Box>
  );
};
