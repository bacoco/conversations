import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { appendText, speechLanguageOf } from '../speech/transcribe';
import { useSpeechCapture } from '../speech/useSpeechCapture';

import { C, Choice, Choices, LinkButton, MainButton } from './ui';

const Band = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px 10px;
  border: 1px solid ${C.brandLine};
  border-radius: 10px;
  background: #ffffff;
  font-size: 13px;
`;

const Field = styled.textarea`
  width: 100%;
  box-sizing: border-box;
  font: inherit;
  font-size: 14px;
  padding: 8px 10px;
  border: 1px solid ${C.grey};
  border-radius: 10px;
  resize: vertical;
`;

/**
 * Answering a question: out loud first; the keyboard when the user asks
 * for it, or when the microphone does not answer.
 */
export const VoiceAnswer = ({
  onSend,
  onCancel,
}: {
  onSend: (text: string, via: 'voice' | 'keyboard') => void;
  onCancel: () => void;
}) => {
  const { t, i18n } = useTranslation();
  const [text, setText] = useState('');
  const [typing, setTyping] = useState(false);
  const capture = useSpeechCapture({
    language: speechLanguageOf(i18n?.language),
    chunkSeconds: 60,
    live: true,
    onText: (piece) => setText((current) => appendText(current, piece)),
  });
  const { start, stop, status, error } = capture;
  useEffect(() => {
    void start();
    return () => stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const shown = typing
    ? text
    : [text, capture.liveText].filter(Boolean).join(' ');
  const send = () => {
    stop();
    onSend(text.trim(), typing ? 'keyboard' : 'voice');
  };

  return (
    <Band role="group" aria-label={t('Answer out loud')}>
      {!typing && (
        <strong aria-live="polite">
          {error
            ? t('The microphone does not answer. Type your answer instead.')
            : status === 'recording'
              ? t('I am listening…')
              : status === 'transcribing'
                ? t('I am writing down what you said…')
                : t('Ready')}
        </strong>
      )}
      {!typing && shown && <span>« {shown} »</span>}
      {typing && (
        <Field
          aria-label={t('Your answer')}
          rows={2}
          value={text}
          // The field appears on demand, ready to type.
          ref={(field) => field?.focus()}
          onChange={(event) => setText(event.target.value)}
        />
      )}
      <Choices>
        {text.trim() && (
          <MainButton type="button" onClick={send}>
            {t('Send my answer')}
          </MainButton>
        )}
        {!typing && !error && (
          <Choice
            type="button"
            onClick={() => {
              stop();
              setText('');
              void start();
            }}
          >
            {t('Start again')}
          </Choice>
        )}
        <Choice
          type="button"
          $tone="dunno"
          onClick={() => {
            stop();
            onCancel();
          }}
        >
          {t('Close')}
        </Choice>
      </Choices>
      {!typing && (
        <LinkButton
          type="button"
          onClick={() => {
            stop();
            setTyping(true);
          }}
        >
          {t('Or type it')}
        </LinkButton>
      )}
    </Band>
  );
};
