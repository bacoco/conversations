import { useEffect, useRef, useState } from 'react';
import type { TFunction } from 'i18next';
import { useTranslation } from 'react-i18next';
import styled, { css } from 'styled-components';

import { Box, Icon } from '@/components';

import { Listening, RECORD_RED, pulse } from '../speech/RecordingSigns';
import { appendText, speechLanguageOf } from '../speech/transcribe';
import { useSpeechCapture } from '../speech/useSpeechCapture';
import { jobById } from '../jobs/jobs';
import { useMainConversationStore } from '../stores/useMainConversationStore';
import { useProfileStore } from '../stores/useProfileStore';

import { NESTOR_AVATAR_URL } from './avatar';
import { C, LinkButton, MainButton, Warn } from './ui';
import type { NestorChat } from './useNestorChat';

const Veil = styled.button`
  position: absolute;
  inset: 0;
  padding: 0;
  border: none;
  cursor: default;
  background: rgba(30, 30, 46, 0.38);
`;

const Window = styled.div`
  position: absolute;
  left: 16px;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: 12px;
  padding: 16px;
  border-radius: 18px;
  background: #ffffff;
  color: ${C.ink};
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.25);
  outline: none;
`;

const Head = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 15px;
  font-weight: 700;
  & img {
    width: 28px;
    height: 28px;
    border-radius: 50%;
  }
  & button {
    margin-left: auto;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    border: none;
    cursor: pointer;
    background: ${C.soft};
    color: ${C.muted};
    display: flex;
    align-items: center;
    justify-content: center;
  }
`;

const Record = styled.button<{ $on: boolean }>`
  align-self: center;
  width: 84px;
  height: 84px;
  border-radius: 50%;
  border: none;
  cursor: pointer;
  color: #ffffff;
  background: ${RECORD_RED};
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(208, 52, 44, 0.35);
  /* Recording: it pulses, as in the recorder. */
  ${({ $on }) =>
    $on &&
    css`
      animation: ${pulse} 1.4s infinite;
    `}
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
  &:focus-visible {
    outline: 2px solid ${C.brand};
    outline-offset: 3px;
  }
`;

const Status = styled.div`
  text-align: center;
  font-size: 14px;
  font-weight: 600;
`;

const Legend = styled.span<{ $center?: boolean }>`
  font-size: 12px;
  color: ${C.muted};
  text-align: ${({ $center }) => ($center ? 'center' : 'left')};
`;

const Said = styled.div`
  font-size: 14px;
  line-height: 1.45;
  padding: 8px 12px;
  border-radius: 10px;
  background: ${C.brandSoft};
  color: ${C.brandDark};
`;

/** What one can say to Nestor: examples to say, not buttons. */
const Examples = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 12px;
  border-radius: 10px;
  background: ${C.soft};
  font-size: 13px;
  & > strong {
    font-size: 11px;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    color: ${C.muted};
  }
`;

/**
 * Before an answer, about the request; after one, about the answer. With a
 * job, one example is a real task of that job.
 */
const sayExamples = (
  t: TFunction,
  hasAnswer: boolean,
  tasks: string[],
): string[] =>
  hasAnswer
    ? [
        t('Is what it answered reliable?'),
        t('How do I go on?'),
        tasks[1]
          ? t('Help me to {{task}}', { task: tasks[1] })
          : t('Help me improve my request'),
        t('I am done, take stock'),
      ]
    : [
        t('Look at what I wrote'),
        t('Help me improve it'),
        tasks[0]
          ? t('Help me to {{task}}', { task: tasks[0] })
          : t('How do I make a table?'),
        t('I am done, take stock'),
      ];

const Field = styled.textarea`
  width: 100%;
  box-sizing: border-box;
  font: inherit;
  font-size: 14px;
  padding: 9px 10px;
  border: 1px solid ${C.grey};
  border-radius: 10px;
  resize: vertical;
`;

export const AskNestorSheet = ({ chat }: { chat: NestorChat }) => {
  const { t, i18n } = useTranslation();
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const fieldRef = useRef<HTMLTextAreaElement | null>(null);
  const capture = useSpeechCapture({
    language: speechLanguageOf(i18n?.language),
    chunkSeconds: 60,
    live: true,
    onText: (piece) => setText((current) => appendText(current, piece)),
  });
  const isRecording =
    capture.status === 'recording' || capture.status === 'starting';
  const jobId = useProfileStore((state) => state.job?.id);
  const tasks = jobById(jobId)?.tasks ?? [];
  const hasAnswer = useMainConversationStore(
    (state) =>
      !!state.latestCompletedAssistantMessageId && !state.isAssistantResponding,
  );

  // A blocked microphone: the keyboard opens at once, never a dead end.
  useEffect(() => {
    if (capture.error === 'microphone') setTyping(true);
  }, [capture.error]);

  useEffect(() => {
    if (chat.sheetOpen) dialogRef.current?.focus();
    else {
      capture.stop();
      setText('');
      setTyping(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.sheetOpen]);

  // Escape closes the window, wherever the focus is in it.
  const { sheetOpen, setSheetOpen } = chat;
  useEffect(() => {
    if (!sheetOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSheetOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [sheetOpen, setSheetOpen]);

  // The keyboard appears only on demand, ready to type.
  useEffect(() => {
    if (typing) fieldRef.current?.focus();
  }, [typing]);

  if (!chat.sheetOpen) return null;
  const close = () => chat.setSheetOpen(false);
  const send = (via: 'voice' | 'keyboard') => {
    if (text.trim()) chat.askNestor(text.trim(), via);
  };

  const said = [text, capture.liveText].filter(Boolean).join(' ');
  return (
    <Box $css="position: absolute; inset: 0; z-index: 5;">
      {/* The veil: a click outside the window closes it. */}
      <Veil
        type="button"
        tabIndex={-1}
        aria-label={t('Close')}
        onClick={close}
      />
      <Window
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('Ask Nestor')}
        tabIndex={-1}
      >
        <Head>
          <img src={NESTOR_AVATAR_URL} alt="" />
          {t('Ask Nestor')}
          <button type="button" aria-label={t('Close')} onClick={close}>
            <Icon iconName="close" $size="18px" $withThemeInherited />
          </button>
        </Head>
        {!typing && (
          <>
            <Record
              type="button"
              $on={isRecording}
              data-recording={isRecording || undefined}
              aria-label={
                isRecording ? t('Stop listening') : t('Press to speak')
              }
              aria-pressed={isRecording}
              onClick={() =>
                isRecording ? capture.stop() : void capture.start()
              }
            >
              <Icon
                iconName={isRecording ? 'stop' : 'mic'}
                $size="40px"
                $withThemeInherited
              />
            </Record>
            <Status aria-live="polite">
              {isRecording
                ? t('I am listening…')
                : t('Press the red button to speak')}
            </Status>
            {isRecording && (
              <Listening
                seconds={capture.seconds}
                readLevel={capture.readLevel}
              />
            )}
            <Legend $center>
              {t('The microphone only turns on when you press.')}
            </Legend>
            {said ? (
              <Said>« {said} »</Said>
            ) : (
              <Examples>
                <strong>{t('For example, say')}</strong>
                {sayExamples(t, hasAnswer, tasks).map((example) => (
                  <span key={example}>« {example} »</span>
                ))}
              </Examples>
            )}
          </>
        )}
        {capture.error === 'microphone' && (
          <Warn role="alert">
            {t(
              'Your browser blocks the microphone. To allow it, click the padlock left of the site address, then “Microphone: Allow”. Meanwhile, type your question.',
            )}
          </Warn>
        )}
        {capture.error === 'transcription' && (
          <Warn role="alert">
            {t('I could not hear you. Try again, or type it.')}
          </Warn>
        )}
        {typing && (
          <Field
            ref={fieldRef}
            aria-label={t('Your question to Nestor')}
            value={text}
            rows={3}
            onChange={(event) => setText(event.target.value)}
          />
        )}
        {text.trim() && (
          <Box $direction="row" $gap="8px" $justify="center">
            <MainButton
              type="button"
              onClick={() => send(typing ? 'keyboard' : 'voice')}
            >
              {t('Send to Nestor')}
            </MainButton>
            <LinkButton
              type="button"
              style={{ alignSelf: 'center' }}
              onClick={() => setText('')}
            >
              {t('Start again')}
            </LinkButton>
          </Box>
        )}
        {!typing && (
          <LinkButton
            type="button"
            style={{ alignSelf: 'center' }}
            onClick={() => {
              capture.stop();
              setTyping(true);
            }}
          >
            {t('Or type it')}
          </LinkButton>
        )}
        <Legend>
          {t(
            'Nestor sees your request and your conversation. Nothing is sent to the Assistant.',
          )}
        </Legend>
      </Window>
    </Box>
  );
};
