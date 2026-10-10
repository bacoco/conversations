import { Button } from '@gouvfr-lasuite/cunningham-react';
import { KeyboardEvent, ReactNode, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { NESTOR_AVATAR_URL } from '../components/PanelHome';
import { PanelTextArea } from '../components/PanelTextArea';

import type { GuidedFill } from './useGuidedFill';

export const bubbleCss = (fromUser: boolean) => css`
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

export const suggestionCss = css`
  padding: 6px 10px;
  border-radius: 999px;
  cursor: pointer;
  font: inherit;
  font-size: 0.8125rem;
  text-align: left;
  color: var(--c--contextuals--content--semantic--brand--primary);
  border: 1px solid var(--c--contextuals--border--semantic--brand--secondary);
  background: var(--c--contextuals--background--surface--primary);
  &:hover:not(:disabled) {
    background: var(--c--contextuals--background--semantic--brand--tertiary);
  }
  &:disabled {
    cursor: not-allowed;
    opacity: 0.6;
  }
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 2px;
  }
`;

export const NestorBubble = ({ children }: { children: ReactNode }) => (
  <Box $direction="row" $align="flex-end" $gap="8px">
    <img
      src={NESTOR_AVATAR_URL}
      alt=""
      width={28}
      height={28}
      style={{ flex: 'none', borderRadius: '50%' }}
    />
    <Box $css={bubbleCss(false)}>{children}</Box>
  </Box>
);

export const UserBubble = ({ children }: { children: ReactNode }) => (
  <Box $direction="row" $justify="flex-end">
    <Box $css={bubbleCss(true)}>{children}</Box>
  </Box>
);

/** Ready answers under Nestor's question: one click answers it. */
export const SuggestionPills = ({
  suggestions,
  onPick,
  disabled = false,
}: {
  suggestions: string[];
  onPick: (suggestion: string) => void;
  disabled?: boolean;
}) => (
  <Box $direction="row" $gap="6px" $css="flex-wrap: wrap; padding-left: 36px;">
    {suggestions.map((suggestion) => (
      <Box
        key={suggestion}
        as="button"
        type="button"
        disabled={disabled}
        onClick={() => onPick(suggestion)}
        $css={suggestionCss}
      >
        {suggestion}
      </Box>
    ))}
  </Box>
);

/**
 * The questions and answers so far, then Nestor's current question with its
 * ready answers and a field to answer in one's own words.
 */
export const GuidedThread = ({
  fill,
  autoFocus = true,
  extraAction,
}: {
  fill: GuidedFill;
  /** Each new question is ready to be answered from the keyboard. */
  autoFocus?: boolean;
  /** One more way out, at the left of the answer's buttons. */
  extraAction?: ReactNode;
}) => {
  const { t } = useTranslation();
  const [answer, setAnswer] = useState('');
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const answerRef = useRef<HTMLTextAreaElement | null>(null);
  const { exchanges, question, status } = fill;

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ block: 'nearest' });
    if (autoFocus && status === 'ready' && question) {
      answerRef.current?.focus();
    }
  }, [exchanges, question, status, autoFocus]);

  const reply = (text: string) => {
    fill.reply(text);
    setAnswer('');
  };

  const send = () => {
    if (answer.trim()) {
      reply(answer.trim());
    }
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (
      event.key === 'Enter' &&
      !event.shiftKey &&
      !event.nativeEvent.isComposing
    ) {
      event.preventDefault();
      send();
    }
  };

  return (
    <>
      <Box as="ol" $gap="10px" $css="margin: 0; padding: 0; list-style: none;">
        {exchanges.map((exchange, index) => (
          <Box as="li" key={index} $gap="10px">
            <NestorBubble>{exchange.question}</NestorBubble>
            <UserBubble>{exchange.answer}</UserBubble>
          </Box>
        ))}
        {question && (
          <Box as="li" $gap="8px" aria-live="polite">
            <NestorBubble>{question.question}</NestorBubble>
            {question.suggestions.length > 0 && status === 'ready' && (
              <SuggestionPills
                suggestions={question.suggestions}
                onPick={reply}
              />
            )}
          </Box>
        )}
      </Box>

      {question && (
        <Box
          $gap="8px"
          // Right under Nestor's question, in the thread: not hidden below.
          $css="padding-left: 36px;"
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
          <Box
            $direction="row"
            $justify="space-between"
            $gap="8px"
            $css="flex-wrap: wrap;"
          >
            <Box $direction="row" $gap="4px" $css="flex-wrap: wrap;">
              {extraAction}
              <Button
                size="small"
                color="neutral"
                variant="tertiary"
                disabled={status === 'loading'}
                onClick={fill.finish}
              >
                {t('Finish now')}
              </Button>
            </Box>
            <Box $direction="row" $gap="8px">
              <Button
                size="small"
                color="neutral"
                variant="secondary"
                disabled={status === 'loading'}
                onClick={() => {
                  fill.skip();
                  setAnswer('');
                }}
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

      {status === 'error' && (
        <Box role="alert" $gap="8px" $align="flex-start">
          <Text $size="sm">
            {t('Nestor could not answer. Check your connection, then retry.')}
          </Text>
          <Button size="small" onClick={fill.retry}>
            {t('Retry')}
          </Button>
        </Box>
      )}
      {/* Scrolled into view above the coach's bottom bar, not under it. */}
      <div ref={bottomRef} style={{ scrollMarginBottom: 140 }} />
    </>
  );
};
