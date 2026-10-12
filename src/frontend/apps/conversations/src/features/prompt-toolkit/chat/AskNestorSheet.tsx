import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { RECORD_RED } from '../speech/RecorderView';
import { appendText, speechLanguageOf } from '../speech/transcribe';
import { useSpeechCapture } from '../speech/useSpeechCapture';

import type { NestorChat } from './useNestorChat';

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

  return (
    <Box $css="position: absolute; inset: 0; z-index: 5; display: grid; place-items: center; padding: 16px;">
      {/* The veil: a click outside the window closes it. */}
      <Box
        as="button"
        type="button"
        tabIndex={-1}
        aria-label={t('Close')}
        onClick={close}
        $css="position: absolute; inset: 0; padding: 0; border: none; cursor: default; background: rgba(0,0,0,0.35);"
      />
      <Box
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={t('Ask Nestor')}
        tabIndex={-1}
        $align="center"
        $gap="14px"
        $css="position: relative; width: min(360px, 100%); padding: 20px; border-radius: 16px; background: #fff; outline: none;"
      >
        <Text $weight="700">{t('Ask Nestor')}</Text>
        {!typing && (
          <>
            <Box
              as="button"
              type="button"
              aria-label={
                isRecording ? t('Stop listening') : t('Press to speak')
              }
              aria-pressed={isRecording}
              onClick={() =>
                isRecording ? capture.stop() : void capture.start()
              }
              $css={css`
                width: 96px;
                height: 96px;
                border-radius: 50%;
                border: none;
                cursor: pointer;
                color: #fff;
                background: ${RECORD_RED};
              `}
            >
              <Icon
                iconName={isRecording ? 'stop' : 'mic'}
                $size="40px"
                $withThemeInherited
              />
            </Box>
            <Text $size="sm" $textAlign="center">
              {isRecording
                ? t('I am listening…')
                : t('Press the red button to speak')}
            </Text>
            <Text $size="xs" $variation="secondary" $textAlign="center">
              {t('The microphone only turns on when you press.')}
            </Text>
          </>
        )}
        {(text || capture.liveText) && !typing && (
          <Text $size="sm">
            « {[text, capture.liveText].filter(Boolean).join(' ')} »
          </Text>
        )}
        {typing && (
          <Box
            as="textarea"
            aria-label={t('Your question to Nestor')}
            value={text}
            ref={fieldRef}
            rows={3}
            onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) =>
              setText(event.target.value)
            }
            $css="width: 100%; font: inherit; padding: 8px; border-radius: 8px;"
          />
        )}
        {text.trim() && (
          <Box $direction="row" $gap="8px">
            <Button
              size="small"
              onClick={() => send(typing ? 'keyboard' : 'voice')}
            >
              {t('Send to Nestor')}
            </Button>
            <Button
              size="small"
              color="neutral"
              variant="secondary"
              onClick={() => setText('')}
            >
              {t('Start again')}
            </Button>
          </Box>
        )}
        {!typing && (
          <Button
            size="small"
            color="neutral"
            variant="tertiary"
            onClick={() => {
              capture.stop();
              setTyping(true);
            }}
          >
            {t('Or type it')}
          </Button>
        )}
      </Box>
    </Box>
  );
};
