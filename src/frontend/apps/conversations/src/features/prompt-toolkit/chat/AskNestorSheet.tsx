import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { Box, Icon } from '@/components';

import { NESTOR_AVATAR_URL } from '../components/PanelHome';
import { RECORD_RED } from '../speech/RecorderView';
import { appendText, speechLanguageOf } from '../speech/transcribe';
import { useSpeechCapture } from '../speech/useSpeechCapture';

import { C, LinkButton, MainButton } from './ui';
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
  box-shadow: ${({ $on }) =>
    $on
      ? `0 0 0 8px rgba(208, 52, 44, 0.18), 0 4px 12px rgba(208, 52, 44, 0.35)`
      : '0 4px 12px rgba(208, 52, 44, 0.35)'};
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
            <Legend $center>
              {t('The microphone only turns on when you press.')}
            </Legend>
            {said && <Said>« {said} »</Said>}
          </>
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
          {t('You are talking to Nestor: nothing is sent to the Assistant.')}
        </Legend>
      </Window>
    </Box>
  );
};
