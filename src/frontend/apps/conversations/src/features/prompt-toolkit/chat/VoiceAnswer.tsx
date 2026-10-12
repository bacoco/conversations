import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { Box, Text } from '@/components';

import { appendText, speechLanguageOf } from '../speech/transcribe';
import { useSpeechCapture } from '../speech/useSpeechCapture';

/** Answering out loud: listen, show the words, send or start again. */
export const VoiceAnswer = ({
  onSend,
  onCancel,
}: {
  onSend: (text: string) => void;
  onCancel: () => void;
}) => {
  const { t, i18n } = useTranslation();
  const [text, setText] = useState('');
  const capture = useSpeechCapture({
    language: speechLanguageOf(i18n?.language),
    chunkSeconds: 60,
    live: true,
    onText: (piece) => setText((current) => appendText(current, piece)),
  });
  const { start, stop, status } = capture;
  useEffect(() => {
    void start();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const shown = [text, capture.liveText].filter(Boolean).join(' ');
  return (
    <Box
      $gap="10px"
      role="group"
      aria-label={t('Answer out loud')}
      $css="padding: 10px 12px; border-radius: 10px; background: #fdecea;"
    >
      <Text $size="sm" $weight="700" aria-live="polite">
        {status === 'recording'
          ? t('I am listening…')
          : status === 'transcribing'
            ? t('I am writing down what you said…')
            : t('Ready')}
      </Text>
      {shown && <Text $size="sm">« {shown} »</Text>}
      <Box $direction="row" $gap="8px">
        <Button
          size="small"
          disabled={!text.trim()}
          onClick={() => {
            stop();
            onSend(text.trim());
          }}
        >
          {t('Send my answer')}
        </Button>
        <Button
          size="small"
          color="neutral"
          variant="secondary"
          onClick={() => {
            stop();
            setText('');
            void start();
          }}
        >
          {t('Start again')}
        </Button>
        <Button
          size="small"
          color="neutral"
          variant="tertiary"
          onClick={() => {
            stop();
            onCancel();
          }}
        >
          {t('Close')}
        </Button>
      </Box>
    </Box>
  );
};
