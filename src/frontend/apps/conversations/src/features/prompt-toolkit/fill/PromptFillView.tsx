import { Button } from '@gouvfr-lasuite/cunningham-react';
import { KeyboardEvent, useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text, useToast } from '@/components';

import {
  FILL_MODEL,
  FillMode,
  FillStep,
  nextFillStep,
  refinePrompt,
} from '../coach/coachApi';
import { languageName } from '../coach/language';
import { CoachStatus } from '../components/CoachStatus';
import { ROBIN_AVATAR_URL } from '../components/PanelHome';
import { PanelTextArea } from '../components/PanelTextArea';
import { RefineBar } from '../components/RefineBar';
import { SavePromptButton } from '../library/SavePromptButton';
import { useReward } from '../rewards/useReward';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';
import { usePlacePrompt } from '../tools/usePlacePrompt';

interface Exchange {
  question: string;
  answer: string;
}

const bubbleCss = (fromUser: boolean) => css`
  max-width: 85%;
  padding: 10px 12px;
  border-radius: ${fromUser ? '12px 12px 4px 12px' : '12px 12px 12px 4px'};
  font-size: 0.875rem;
  line-height: 1.5;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  background: ${
    fromUser
      ? 'var(--c--contextuals--background--semantic--brand--tertiary)'
      : 'var(--c--contextuals--background--surface--tertiary)'
  };
`;

const suggestionCss = css`
  padding: 6px 10px;
  border-radius: 999px;
  cursor: pointer;
  font: inherit;
  font-size: 0.8125rem;
  text-align: left;
  color: var(--c--contextuals--content--semantic--brand--primary);
  border: 1px solid var(--c--contextuals--border--semantic--brand--secondary);
  background: var(--c--contextuals--background--surface--primary);
  &:hover {
    background: var(--c--contextuals--background--semantic--brand--tertiary);
  }
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 2px;
  }
`;

const RobinBubble = ({ children }: { children: string }) => (
  <Box $direction="row" $align="flex-end" $gap="8px">
    <img
      src={ROBIN_AVATAR_URL}
      alt=""
      width={28}
      height={28}
      style={{ flex: 'none', borderRadius: '50%' }}
    />
    <Box $css={bubbleCss(false)}>{children}</Box>
  </Box>
);

/**
 * Completes a prompt template by asking the user, one question at a time,
 * for what it is missing; ends with a prompt ready to send, no brackets left.
 */
export const PromptFillView = ({
  template,
  title,
  context = '',
  mode = 'template',
}: {
  template: string;
  title: string;
  context?: string;
  mode?: FillMode;
}) => {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const placePrompt = usePlacePrompt();
  const reward = useReward();
  const closeFill = usePromptToolkitStore((state) => state.closeFill);
  const resetCount = usePromptToolkitStore((state) => state.resetCount);
  const language = languageName(i18n.language);

  const [exchanges, setExchanges] = useState<Exchange[]>([]);
  const [step, setStep] = useState<FillStep | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>(
    'loading',
  );
  const [answer, setAnswer] = useState('');
  /** Changes asked on the final prompt, shown as a conversation. */
  const [adjustments, setAdjustments] = useState<
    { request: string; reply: string }[]
  >([]);
  const [isAdjusting, setIsAdjusting] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const answerRef = useRef<HTMLTextAreaElement | null>(null);

  const ask = useCallback(
    (history: Exchange[], finishNow = false) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setStatus('loading');
      nextFillStep(
        template,
        history,
        language,
        controller.signal,
        finishNow,
        context,
        mode,
      )
        .then((next) => {
          setStep(next);
          setStatus('ready');
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setStatus('error');
          }
        });
    },
    [template, language, context, mode],
  );

  // Start, and start over when the trash button is pressed.
  useEffect(() => {
    setExchanges([]);
    setStep(null);
    setAnswer('');
    setAdjustments([]);
    ask([]);
    return () => controllerRef.current?.abort();
  }, [ask, resetCount]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ block: 'nearest' });
    // Each new question is ready to be answered from the keyboard.
    if (status === 'ready' && step?.kind === 'question') {
      answerRef.current?.focus();
    }
  }, [exchanges, step, status, adjustments]);

  const reply = (text: string) => {
    if (step?.kind !== 'question' || status === 'loading') {
      return;
    }
    const history = [...exchanges, { question: step.question, answer: text }];
    setExchanges(history);
    setAnswer('');
    ask(history);
  };

  const send = () => {
    if (answer.trim()) {
      reply(answer.trim());
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      send();
    }
  };

  // "Change the tone", "add a date": Robin edits the final prompt in place.
  const adjust = async (request: string) => {
    if (step?.kind !== 'final') {
      return;
    }
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsAdjusting(true);
    try {
      const adjusted = await refinePrompt(
        step.prompt,
        request,
        language,
        controller.signal,
        FILL_MODEL,
      );
      // Keep Robin's congratulation; only the prompt changes.
      setStep({ ...step, prompt: adjusted.improvedPrompt });
      setAdjustments((list) => [
        ...list,
        {
          request,
          reply: adjusted.changes.length
            ? t('Done: {{changes}}.', {
                changes: adjusted.changes.join(', '),
              })
            : t('Done, the prompt is updated.'),
        },
      ]);
    } catch {
      if (!controller.signal.aborted) {
        showToast(
          'error',
          t('Robin could not change the prompt. Please retry.'),
        );
      }
    } finally {
      setIsAdjusting(false);
    }
  };

  const copy = async (prompt: string) => {
    await navigator.clipboard.writeText(prompt);
    showToast('success', t('Copied to clipboard.'), undefined, 2000);
  };

  const question = step?.kind === 'question' ? step : null;
  const final = step?.kind === 'final' ? step : null;

  return (
    <Box $css="min-height: 100%;">
      <CoachStatus
        isLoading={status === 'loading' || isAdjusting}
        loadingLabel={
          isAdjusting
            ? t('Robin is changing the prompt…')
            : exchanges.length === 0
              ? t('Robin is reading the prompt…')
              : t('Robin is preparing the next step…')
        }
      />
      <Box $gap="14px" $padding={{ all: 'base' }} $css="flex: 1;">
        <Box $direction="row" $align="center" $gap="10px">
          <Button
            size="small"
            color="neutral"
            variant="tertiary"
            onClick={closeFill}
            aria-label={t('Back')}
            icon={<Icon iconName="arrow_back" $size="18px" />}
          />
          <Box $css="min-width: 0;">
            <Text as="h2" $size="md" $weight="700" $margin="0">
              {t('Complete the prompt')}
            </Text>
            <Text $size="xs" $variation="secondary" $ellipsis>
              {title}
            </Text>
          </Box>
        </Box>

        <Text $size="sm" $variation="secondary">
          {mode === 'draft'
            ? t(
                'Robin asks you two or three questions, then writes a stronger version of your prompt.',
              )
            : t(
                'Robin asks you a few questions, then writes the complete prompt for you.',
              )}
        </Text>

        <Box
          as="ol"
          $gap="10px"
          $css="margin: 0; padding: 0; list-style: none;"
        >
          {exchanges.map((exchange, index) => (
            <Box as="li" key={index} $gap="10px">
              <RobinBubble>{exchange.question}</RobinBubble>
              <Box $direction="row" $justify="flex-end">
                <Box $css={bubbleCss(true)}>{exchange.answer}</Box>
              </Box>
            </Box>
          ))}
          {question && (
            <Box as="li" $gap="8px" aria-live="polite">
              <RobinBubble>{question.question}</RobinBubble>
              {question.suggestions.length > 0 && status === 'ready' && (
                <Box
                  $direction="row"
                  $gap="6px"
                  $css="flex-wrap: wrap; padding-left: 36px;"
                >
                  {question.suggestions.map((suggestion) => (
                    <Box
                      key={suggestion}
                      as="button"
                      type="button"
                      onClick={() => reply(suggestion)}
                      $css={suggestionCss}
                    >
                      {suggestion}
                    </Box>
                  ))}
                </Box>
              )}
            </Box>
          )}
        </Box>

        {status === 'error' && (
          <Box role="alert" $gap="8px" $align="flex-start">
            <Text $size="sm">
              {t('Robin could not answer. Check your connection, then retry.')}
            </Text>
            <Button size="small" onClick={() => ask(exchanges)}>
              {t('Retry')}
            </Button>
          </Box>
        )}

        {/* Robin's word on the result comes before any change asked. */}
        {final?.message && <RobinBubble>{final.message}</RobinBubble>}

        {adjustments.length > 0 && (
          <Box
            as="ol"
            $gap="10px"
            $css="margin: 0; padding: 0; list-style: none;"
          >
            {adjustments.map((item, index) => (
              <Box as="li" key={index} $gap="10px">
                <Box $direction="row" $justify="flex-end">
                  <Box $css={bubbleCss(true)}>{item.request}</Box>
                </Box>
                <RobinBubble>{item.reply}</RobinBubble>
              </Box>
            ))}
          </Box>
        )}

        {final && (
          <Box
            $gap="10px"
            $css={css`
              padding: 14px;
              border-radius: 12px;
              border: 1px solid
                var(--c--contextuals--border--semantic--success--secondary);
              background: var(
                --c--contextuals--background--semantic--success--tertiary
              );
            `}
          >
            <Box $direction="row" $align="center" $gap="8px">
              <Icon iconName="check_circle" $size="20px" $theme="success" />
              <Text $weight="700">{t('Your prompt is ready')}</Text>
            </Box>
            <Text
              $size="sm"
              $css={css`
                display: block;
                max-height: 320px;
                overflow-y: auto;
                padding: 10px 12px;
                border-radius: 8px;
                white-space: pre-wrap;
                line-height: 1.5;
                background: var(--c--contextuals--background--surface--primary);
              `}
            >
              {final.prompt}
            </Text>
            <Box $direction="row" $gap="8px" $justify="flex-end">
              <Button
                size="small"
                color="neutral"
                variant="tertiary"
                onClick={() => void copy(final.prompt)}
                icon={<Icon iconName="content_copy" $size="16px" />}
              >
                {t('Copy')}
              </Button>
              <SavePromptButton prompt={final.prompt} title={title} />
              <Button
                size="small"
                onClick={() => {
                  placePrompt(final.prompt);
                  reward('fill');
                  closeFill();
                }}
                icon={<Icon iconName="north_west" $size="16px" />}
              >
                {t('Use this prompt')}
              </Button>
            </Box>
            <RefineBar
              onRefine={(request) => void adjust(request)}
              isRefining={isAdjusting}
            />
          </Box>
        )}
        <div ref={bottomRef} />
      </Box>

      {question && (
        <Box
          $gap="8px"
          $css={css`
            position: sticky;
            bottom: 0;
            padding: 12px 16px;
            border-top: 1px solid
              var(--c--contextuals--border--surface--primary);
            background: var(--c--contextuals--background--surface--primary);
          `}
        >
          <PanelTextArea
            label={t('Your answer')}
            value={answer}
            onChange={setAnswer}
            onKeyDown={onKeyDown}
            placeholder={t('Your answer… (Enter to send)')}
            minRows={2}
            inputRef={answerRef}
          />
          <Box $direction="row" $justify="space-between" $gap="8px">
            <Button
              size="small"
              color="neutral"
              variant="tertiary"
              disabled={status === 'loading'}
              onClick={() => ask(exchanges, true)}
            >
              {t('Finish now')}
            </Button>
            <Box $direction="row" $gap="8px">
              <Button
                size="small"
                color="neutral"
                variant="secondary"
                disabled={status === 'loading'}
                onClick={() => reply(t('I do not know, skip this question.'))}
              >
                {t('Skip')}
              </Button>
              <Button
                size="small"
                disabled={status === 'loading' || !answer.trim()}
                onClick={send}
                icon={<Icon iconName="send" $size="16px" />}
              >
                {t('Send')}
              </Button>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};
