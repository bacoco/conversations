import { Button } from '@gouvfr-lasuite/cunningham-react';
import { ChangeEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css, keyframes } from 'styled-components';

import { Box, Icon, Text, useToast } from '@/components';

import { useAiAvailable } from '../coach/aiAvailability';
import { optionCss } from '../components/CoachModes';
import { DetailPage } from '../components/DetailPage';
import { PanelTextArea } from '../components/PanelTextArea';
import { useSectionReset } from '../stores/usePromptToolkitStore';
import { getDailyTools } from '../tools/tools';
import { usePlacePrompt } from '../tools/usePlacePrompt';

import { AudioFileTooLargeError, splitAudioFile } from './audioFile';
import {
  TRANSCRIPTION_URL,
  canRecord,
  speechLanguageOf,
  transcribe,
} from './transcribe';
import { useRecorderStore } from './useRecorderStore';
import { useSpeechCapture } from './useSpeechCapture';

/** Pieces of a recording: the text arrives about every half minute. */
const CHUNK_SECONDS = 30;
const RECORD_RED = '#d0342c';
const WAVE_BARS = 28;
const NESTOR_TRANSCRIPTION_URL = '/assets/nestor-transcription.webp';

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(208, 52, 44, 0.45); }
  100% { box-shadow: 0 0 0 14px rgba(208, 52, 44, 0); }
`;

const cardCss = css`
  padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--c--contextuals--border--surface--primary);
  background: var(--c--contextuals--background--surface--primary);
`;

const actionCss = (isMain: boolean, isWide = isMain) => css`
  display: grid;
  gap: 2px;
  padding: 10px 12px;
  border-radius: 10px;
  cursor: pointer;
  font: inherit;
  color: inherit;
  text-align: left;
  ${isWide && 'grid-column: 1 / -1;'}
  border: 1px solid
    ${
    isMain
      ? 'var(--c--contextuals--border--semantic--brand--primary)'
      : 'var(--c--contextuals--border--surface--primary)'
  };
  background: ${
    isMain
      ? 'var(--c--contextuals--background--semantic--brand--tertiary)'
      : 'var(--c--contextuals--background--surface--primary)'
  };
  &:hover {
    border-color: var(--c--contextuals--border--semantic--brand--primary);
  }
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 2px;
  }
`;

const formatTime = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(
    seconds % 60,
  ).padStart(2, '0')}`;

/** Bars that follow the microphone level while recording. */
const Wave = ({ readLevel }: { readLevel: () => number }) => {
  const barsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let timer = 0;
    let isStopped = false;
    const history = new Array<number>(WAVE_BARS).fill(0);
    const draw = () => {
      if (isStopped) return;
      history.shift();
      history.push(readLevel());
      barsRef.current?.childNodes.forEach((bar, index) => {
        (bar as HTMLElement).style.height = `${4 + history[index] * 28}px`;
      });
      timer = window.setTimeout(() => requestAnimationFrame(draw), 90);
    };
    draw();
    return () => {
      isStopped = true;
      window.clearTimeout(timer);
    };
  }, [readLevel]);

  return (
    <Box
      ref={barsRef}
      aria-hidden="true"
      $direction="row"
      $align="center"
      $gap="3px"
      $css="height: 32px;"
    >
      {Array.from({ length: WAVE_BARS }, (_, index) => (
        <Box
          key={index}
          $css={css`
            width: 4px;
            height: 4px;
            border-radius: 2px;
            background: ${RECORD_RED};
            transition: height 0.1s ease;
          `}
        />
      ))}
    </Box>
  );
};

/**
 * Record or paste: a meeting, an idea, a voice note. The text arrives while
 * speaking, then becomes minutes, decisions, actions or a summary.
 */
export const RecorderView = ({ onBack }: { onBack: () => void }) => {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const isAiAvailable = useAiAvailable();
  // The text is complete: the prompt goes straight to the message field
  // (no Nestor questions: the prompts have no blanks to fill in).
  const placePrompt = usePlacePrompt();
  const tools = useMemo(() => getDailyTools(t), [t]);
  const formats = tools.find((tool) => tool.id === 'minutes')?.options[0];

  const text = useRecorderStore((state) => state.text);
  const setText = useRecorderStore((state) => state.setText);
  const append = useRecorderStore((state) => state.append);
  useSectionReset('tools', () => setText(''));

  // Transcribed in the language chosen in the settings (French by default).
  const language = speechLanguageOf(i18n.language);
  const [format, setFormat] = useState(formats?.choices[0].id ?? '');
  const [importing, setImporting] = useState<{
    done: number;
    total: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const capture = useSpeechCapture({
    language,
    chunkSeconds: CHUNK_SECONDS,
    onText: append,
    live: true,
  });
  const { error, clearError } = capture;
  useEffect(() => {
    if (error === 'microphone') {
      showToast(
        'error',
        t('The microphone is not available: allow it in your browser.'),
      );
    } else if (error === 'transcription') {
      showToast('error', t('Part of the recording could not be transcribed.'));
    }
    if (error) clearError();
  }, [error, clearError, showToast, t]);

  const canTranscribe = isAiAvailable && Boolean(TRANSCRIPTION_URL);
  const canUseMicrophone = canTranscribe && canRecord();
  const isRecording =
    capture.status === 'recording' || capture.status === 'starting';
  const isPaused = capture.status === 'paused';
  const isActive = isRecording || isPaused;
  const isWorking =
    capture.status === 'transcribing' || capture.pending > 0 || !!importing;

  const importFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    let failed = 0;
    try {
      setImporting({ done: 0, total: 1 });
      const { count, piece } = await splitAudioFile(file);
      setImporting({ done: 0, total: count });
      let previous = '';
      for (let index = 0; index < count; index++) {
        // One piece that fails does not stop the others.
        try {
          const added = await transcribe(piece(index), language, {
            previous,
          });
          previous = `${previous} ${added}`.slice(-400);
          append(added);
        } catch {
          failed += 1;
        }
        setImporting({ done: index + 1, total: count });
      }
      if (failed === count) {
        showToast('error', t('This audio file could not be transcribed.'));
      } else if (failed) {
        showToast(
          'error',
          t('Part of the recording could not be transcribed.'),
        );
      }
    } catch (error) {
      showToast(
        'error',
        error instanceof AudioFileTooLargeError
          ? t(
              'This file is too long: cut it into parts of less than an hour, or record directly.',
            )
          : t('This audio file could not be transcribed.'),
      );
    } finally {
      setImporting(null);
    }
  };

  const content = text.trim();
  const block = `\n\n"""\n${content}\n"""`;
  // The result is read as it is: no "[to be defined]" left to fill in.
  const noBlanks = ` ${t(
    'Never write placeholders in square brackets: when the text does not say something (a person, a date), write a dash.',
  )}`;
  const actions = [
    {
      id: 'minutes',
      title: t('Meeting minutes'),
      description: t('Decisions and actions, in the format chosen above.'),
      prompt: () => {
        const instruction =
          formats?.choices.find((choice) => choice.id === format)
            ?.instruction ?? '';
        return (
          t(
            'From the text below, write {{format}}. End with a table of decisions and a table of actions (who, what, by when). Only use the text.',
            { format: instruction },
          ) +
          noBlanks +
          block
        );
      },
    },
    {
      id: 'decisions',
      title: t('Decision log'),
      description: t('Who decides what, by when.'),
      prompt: () =>
        t(
          'From the text below, write a decision log. For each decision: the decision in one sentence, the person in charge, the deadline. Format: a table, without the discussion. Only use the text.',
        ) +
        noBlanks +
        block,
    },
    {
      id: 'actions',
      title: t('Extract the actions'),
      description: t('A who / what / when table.'),
      prompt: () =>
        t(
          'List every action to take in the text below, as a table: action, person in charge, deadline. Do not invent anything.',
        ) +
        noBlanks +
        block,
    },
    {
      id: 'summary',
      title: t('Summarise'),
      description: t('The key points, on one page.'),
      prompt: () => {
        const tool = tools.find((item) => item.id === 'summary');
        if (!tool) return '';
        const choices = Object.fromEntries(
          tool.options.map((group) => [
            group.id,
            group.id === 'length'
              ? (group.choices.find((choice) => choice.id === 'page')
                  ?.instruction ?? group.choices[0].instruction)
              : group.choices[0].instruction,
          ]),
        );
        return tool.build(choices, content);
      },
    },
    {
      id: 'translate',
      title: t('Translate'),
      description: language === 'fr' ? t('Into English.') : t('Into French.'),
      prompt: () => {
        const tool = tools.find((item) => item.id === 'translate');
        const target = tool?.options[0].choices.find(
          (choice) => choice.id === (language === 'fr' ? 'en' : 'fr'),
        );
        return tool && target
          ? tool.build({ language: target.instruction }, content)
          : '';
      },
    },
    {
      id: 'raw',
      title: t('Send to the assistant'),
      description: t('The text as it is, in the message field.'),
      prompt: () => content,
    },
  ];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      showToast('success', t('Text copied.'), undefined, 3000);
    } catch {
      showToast('error', t('Copying was refused by the browser.'));
    }
  };

  const stateText = (() => {
    if (capture.status === 'starting') return t('Opening the microphone…');
    if (isPaused) return t('Paused');
    if (isRecording) return t('Recording. The text appears as you speak.');
    if (importing)
      return importing.total > 1
        ? t('Transcribing the file: part {{done}} of {{total}}…', {
            done: importing.done + 1,
            total: importing.total,
          })
        : t('Transcribing the file…');
    if (isWorking) return t('Transcribing the last part…');
    return t('Press to record: a meeting, an idea, a voice note.');
  })();

  return (
    <DetailPage
      onBack={() => {
        if (isActive) capture.stop();
        onBack();
      }}
      backLabel={t('Back to the tools')}
      title={t('Record and transcribe')}
      subtitle={t('Speak, import an audio file or paste a text.')}
    >
      {canTranscribe && (
        <Box $gap="16px">
          <Box $align="center" $gap="12px" $css={cardCss}>
            {!isActive && !isWorking && (
              <img
                src={NESTOR_TRANSCRIPTION_URL}
                alt=""
                width={128}
                height={128}
                style={{
                  borderRadius: '16px',
                  objectFit: 'cover',
                  background: '#f7f8fd',
                }}
              />
            )}
            {canUseMicrophone && (
              <Box
                as="button"
                type="button"
                onClick={() =>
                  isActive ? capture.stop() : void capture.start()
                }
                disabled={!!importing || capture.status === 'transcribing'}
                aria-label={
                  isActive ? t('Finish the recording') : t('Start recording')
                }
                $align="center"
                $justify="center"
                $css={css`
                  width: 104px;
                  height: 104px;
                  border-radius: 50%;
                  border: none;
                  cursor: pointer;
                  color: #ffffff;
                  background: ${RECORD_RED};
                  box-shadow: 0 6px 18px rgba(208, 52, 44, 0.3);
                  transition: transform 0.15s ease;
                  ${
                    isRecording &&
                    css`
                      animation: ${pulse} 1.4s infinite;
                    `
                  }
                  &:hover:not(:disabled) {
                    transform: scale(1.04);
                  }
                  &:disabled {
                    opacity: 0.5;
                    cursor: default;
                  }
                  &:focus-visible {
                    outline: 3px solid
                      var(--c--contextuals--border--semantic--brand--primary);
                    outline-offset: 3px;
                  }
                  @media (prefers-reduced-motion: reduce) {
                    animation: none;
                  }
                `}
              >
                {isActive ? (
                  <Box
                    aria-hidden="true"
                    $css="width: 32px; height: 32px; border-radius: 6px; background: #ffffff;"
                  />
                ) : (
                  <Icon iconName="mic" $size="44px" $withThemeInherited />
                )}
              </Box>
            )}
            {(isActive || capture.seconds > 0) && (
              <Text
                aria-live="off"
                $css={css`
                  font-size: 1.6rem;
                  font-variant-numeric: tabular-nums;
                  letter-spacing: 0.02em;
                `}
              >
                {formatTime(capture.seconds)}
              </Text>
            )}
            {isRecording && <Wave readLevel={capture.readLevel} />}
            <Text
              role="status"
              $size="sm"
              $variation="secondary"
              $textAlign="center"
            >
              {stateText}
            </Text>
            {isActive && (
              <Box $direction="row" $gap="8px">
                <Button
                  size="small"
                  color="neutral"
                  variant="bordered"
                  onClick={isPaused ? capture.resume : capture.pause}
                  icon={
                    <Icon
                      iconName={isPaused ? 'play_arrow' : 'pause'}
                      $size="18px"
                    />
                  }
                >
                  {isPaused ? t('Resume') : t('Pause')}
                </Button>
                <Button
                  size="small"
                  color="neutral"
                  variant="bordered"
                  onClick={capture.stop}
                  icon={<Icon iconName="stop" $size="18px" />}
                >
                  {t('Finish')}
                </Button>
              </Box>
            )}
            {!isActive && !importing && (
              // One line: "or import an audio file".
              <Box
                $direction="row"
                $align="baseline"
                $justify="center"
                $gap="4px"
                $css="flex-wrap: wrap; font-size: 0.875rem;"
              >
                {canUseMicrophone && (
                  <Text $size="sm" $variation="secondary">
                    {t('or')}
                  </Text>
                )}
                <Box
                  as="button"
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  $css={css`
                    display: inline;
                    padding: 0;
                    border: none;
                    background: none;
                    font: inherit;
                    cursor: pointer;
                    text-decoration: underline;
                    color: var(
                      --c--contextuals--content--semantic--brand--primary
                    );
                  `}
                >
                  {t('import an audio file')}
                </Box>
              </Box>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*,video/webm,video/mp4"
              hidden
              onChange={(event) => void importFile(event)}
            />
          </Box>
        </Box>
      )}

      <Box $gap="8px" $css={cardCss}>
        <Text $size="sm" $weight="700">
          {t('Text')}
        </Text>
        <PanelTextArea
          label={t('Text')}
          minRows={6}
          dictation={false}
          value={text}
          onChange={setText}
          placeholder={
            canTranscribe
              ? t(
                  'The transcription appears here. You can also paste a text or notes.',
                )
              : t('Paste a text or your notes here.')
          }
        />
        {/* What is being said, before its final text replaces it. */}
        {capture.liveText && (
          <Box
            aria-live="polite"
            $direction="row"
            $gap="8px"
            $align="flex-start"
            $css={css`
              padding: 8px 10px;
              border-radius: 8px;
              background: var(--c--contextuals--background--surface--secondary);
            `}
          >
            <Box
              aria-hidden="true"
              $css={css`
                flex: none;
                width: 8px;
                height: 8px;
                margin-top: 6px;
                border-radius: 50%;
                background: ${RECORD_RED};
                animation: ${pulse} 1.4s infinite;
                @media (prefers-reduced-motion: reduce) {
                  animation: none;
                }
              `}
            />
            <Text
              $size="sm"
              $variation="secondary"
              $css="font-style: italic; min-width: 0; overflow-wrap: anywhere;"
            >
              {capture.liveText}
            </Text>
          </Box>
        )}
      </Box>

      {content && !isActive && (
        <Box $gap="10px">
          <Text as="h3" $size="sm" $weight="700" $margin="0">
            {t('What to do with it?')}
          </Text>
          {formats && (
            <Box
              role="radiogroup"
              aria-label={formats.label}
              $direction="row"
              $css={css`
                gap: 4px;
                padding: 3px;
                border-radius: 8px;
                border: 1px solid
                  var(--c--contextuals--border--surface--primary);
              `}
            >
              {formats.choices.map((choice) => (
                <Box
                  key={choice.id}
                  as="button"
                  type="button"
                  role="radio"
                  aria-checked={format === choice.id}
                  onClick={() => setFormat(choice.id)}
                  $css={optionCss(format === choice.id)}
                >
                  {choice.label}
                </Box>
              ))}
            </Box>
          )}
          <Box
            $css={css`
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 8px;
            `}
          >
            {actions.map((action, index) => (
              <Box
                key={action.id}
                as="button"
                type="button"
                onClick={() => {
                  const prompt = action.prompt();
                  if (prompt) placePrompt(prompt);
                }}
                // Six actions: the first and the last take the whole row.
                $css={actionCss(
                  index === 0,
                  index === 0 || index === actions.length - 1,
                )}
              >
                <Text $weight="700" $size="sm">
                  {action.title}
                </Text>
                <Text $size="xs" $variation="secondary">
                  {action.description}
                </Text>
              </Box>
            ))}
          </Box>
          <Box $direction="row" $gap="8px" $css="flex-wrap: wrap;">
            <Button
              size="small"
              color="neutral"
              variant="bordered"
              onClick={() => void copy()}
              icon={<Icon iconName="content_copy" $size="18px" />}
            >
              {t('Copy the text')}
            </Button>
            <Button
              size="small"
              color="neutral"
              variant="tertiary"
              disabled={isWorking}
              onClick={() => setText('')}
              icon={<Icon iconName="delete" $size="18px" />}
            >
              {t('Clear')}
            </Button>
          </Box>
        </Box>
      )}
    </DetailPage>
  );
};
