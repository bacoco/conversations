import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { css, keyframes } from 'styled-components';

import { Box, Icon, useToast } from '@/components';

import { useAiAvailable } from '../coach/aiAvailability';

import { TRANSCRIPTION_URL, canRecord, speechLanguageOf } from './transcribe';
import { useSpeechCapture } from './useSpeechCapture';

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(208, 52, 44, 0.45); }
  100% { box-shadow: 0 0 0 9px rgba(208, 52, 44, 0); }
`;

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

/** A long dictation is still sent in pieces, so nothing is lost. */
const DICTATION_CHUNK_SECONDS = 60;

/**
 * Small microphone button for any text field: one click to speak, one click
 * to stop; the text is added after what is already written.
 */
export const MicButton = ({
  onText,
  size = 30,
}: {
  onText: (text: string) => void;
  size?: number;
}) => {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const isAiAvailable = useAiAvailable();
  const capture = useSpeechCapture({
    // `i18n` can be missing where the translation hook is mocked.
    language: speechLanguageOf(i18n?.language),
    chunkSeconds: DICTATION_CHUNK_SECONDS,
    onText,
  });
  const { error, clearError } = capture;

  useEffect(() => {
    if (error === 'microphone') {
      showToast(
        'error',
        t('The microphone is not available: allow it in your browser.'),
      );
    } else if (error === 'transcription') {
      showToast('error', t('The dictation could not be transcribed.'));
    }
    if (error) clearError();
  }, [error, clearError, showToast, t]);

  if (!isAiAvailable || !TRANSCRIPTION_URL || !canRecord()) {
    return null;
  }

  const isListening =
    capture.status === 'recording' || capture.status === 'starting';
  const isBusy = capture.status === 'transcribing';

  return (
    <Box
      as="button"
      type="button"
      aria-label={isListening ? t('Stop dictation') : t('Dictate')}
      title={isListening ? t('Stop dictation') : t('Dictate')}
      aria-pressed={isListening}
      disabled={isBusy}
      onClick={() => (isListening ? capture.stop() : void capture.start())}
      $align="center"
      $justify="center"
      $css={css`
        flex: none;
        width: ${size}px;
        height: ${size}px;
        padding: 0;
        border-radius: 50%;
        cursor: pointer;
        border: 1px solid
          ${
            isListening
              ? '#d0342c'
              : 'var(--c--contextuals--border--surface--primary)'
          };
        background: ${
          isListening
            ? '#d0342c'
            : 'var(--c--contextuals--background--surface--primary)'
        };
        color: ${
          isListening
            ? '#ffffff'
            : isBusy
              ? 'var(--c--contextuals--content--semantic--brand--primary)'
              : 'var(--c--contextuals--content--semantic--neutral--secondary)'
        };
        transition:
          color 0.15s ease,
          border-color 0.15s ease;
        ${
          isListening &&
          css`
            animation: ${pulse} 1.2s infinite;
          `
        }
        & .material-symbols-outlined {
          ${
            isBusy &&
            css`
              animation: ${spin} 1s linear infinite;
            `
          }
        }
        &:hover:not(:disabled) {
          border-color: ${
            isListening
              ? '#d0342c'
              : 'var(--c--contextuals--border--semantic--brand--primary)'
          };
          color: ${
            isListening
              ? '#ffffff'
              : 'var(--c--contextuals--content--semantic--brand--primary)'
          };
        }
        &:focus-visible {
          outline: 2px solid
            var(--c--contextuals--border--semantic--brand--primary);
          outline-offset: 2px;
        }
        @media (prefers-reduced-motion: reduce) {
          animation: none;
          & .material-symbols-outlined {
            animation: none;
          }
        }
      `}
    >
      <Icon
        iconName={isBusy ? 'progress_activity' : isListening ? 'stop' : 'mic'}
        $size={`${Math.round(size * 0.55)}px`}
        $withThemeInherited
      />
    </Box>
  );
};
