import { Button } from '@gouvfr-lasuite/cunningham-react';
import { KeyboardEvent, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text, useToast } from '@/components';
import { getConversation } from '@/features/chat/api/useConversation';
import type { ChatMessage } from '@/features/chat/types';
import { useConversationRouteId } from '@/utils';

import { FollowUp, followUpPrompt } from '../coach/coachApi';
import { languageName } from '../coach/language';
import { useOfferPrompt } from '../fill/useOfferPrompt';
import { SavePromptButton } from '../library/SavePromptButton';

import { CoachStatus } from './CoachStatus';

/** The text of the last message with this role, or ''. */
export const lastMessageText = (
  messages: ChatMessage[],
  role: ChatMessage['role'],
) => {
  const message = [...messages].reverse().find((m) => m.role === role);
  return (
    message?.parts
      .map((part) => (part.type === 'text' ? part.text : ''))
      .join('\n')
      .trim() ?? ''
  );
};

const chipCss = css`
  padding: 4px 10px;
  border-radius: 999px;
  cursor: pointer;
  font: inherit;
  font-size: 0.8125rem;
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

/**
 * "The answer does not suit you?": Nestor reads the last exchange and writes
 * a better-worded follow-up, the moment users most need help.
 */
export const FollowUpCard = () => {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const offerPrompt = useOfferPrompt();
  const conversationId = useConversationRouteId();
  const [custom, setCustom] = useState('');
  const [result, setResult] = useState<FollowUp | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  // A follow-up belongs to one conversation.
  useEffect(() => {
    controllerRef.current?.abort();
    setResult(null);
  }, [conversationId]);
  useEffect(() => () => controllerRef.current?.abort(), []);

  if (!conversationId) {
    return null;
  }

  const issues = [
    t('Too long'),
    t('Too vague'),
    t('Off topic'),
    t('Wrong format'),
    t('Seems inaccurate'),
  ];

  const ask = async (issue: string) => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsLoading(true);
    try {
      const conversation = await getConversation({ id: conversationId });
      const request = lastMessageText(conversation.messages, 'user');
      const answer = lastMessageText(conversation.messages, 'assistant');
      if (!request || !answer) {
        showToast('info', t('There is no answer to follow up on yet.'));
        return;
      }
      setResult(
        await followUpPrompt(
          request,
          answer,
          issue,
          languageName(i18n.language),
          controller.signal,
        ),
      );
      setCustom('');
    } catch {
      if (!controller.signal.aborted) {
        showToast(
          'error',
          t('Nestor could not write a follow-up. Please retry.'),
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box
      as="section"
      aria-labelledby="follow-up-title"
      $gap="10px"
      $css={css`
        margin: 12px 16px 0;
        padding: 12px 14px;
        border-radius: 12px;
        border: 1px solid var(--c--contextuals--border--surface--primary);
      `}
    >
      <Box $direction="row" $align="center" $gap="8px">
        <Icon iconName="replay" $size="20px" $theme="brand" />
        <Text as="h3" id="follow-up-title" $size="sm" $weight="700" $margin="0">
          {t('The last answer does not suit you?')}
        </Text>
      </Box>
      <Text $size="xs" $variation="secondary">
        {t('Say what is wrong: Nestor writes a better follow-up for you.')}
      </Text>
      <Box $direction="row" $gap="6px" $css="flex-wrap: wrap;">
        {issues.map((issue) => (
          <Box
            key={issue}
            as="button"
            type="button"
            disabled={isLoading}
            onClick={() => void ask(issue)}
            $css={chipCss}
          >
            {issue}
          </Box>
        ))}
      </Box>
      <Box
        as="input"
        type="text"
        value={custom}
        aria-label={t('What is wrong with the answer')}
        placeholder={t('Or in your words, then Enter…')}
        onChange={(event: { target: { value: string } }) =>
          setCustom(event.target.value)
        }
        onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
          if (event.key === 'Enter' && custom.trim() && !isLoading) {
            event.preventDefault();
            void ask(custom.trim());
          }
        }}
        $css={css`
          height: 32px;
          padding: 0 10px;
          border-radius: 8px;
          font: inherit;
          font-size: 0.8125rem;
          color: inherit;
          border: 1px solid var(--c--contextuals--border--surface--primary);
          background: var(--c--contextuals--background--surface--primary);
          &:focus {
            outline: none;
            border-color: var(
              --c--contextuals--border--semantic--brand--primary
            );
          }
        `}
      />
      {isLoading && (
        <CoachStatus
          isLoading
          loadingLabel={t('Nestor is reading the last answer…')}
        />
      )}
      {result && (
        <Box $gap="8px" aria-live="polite">
          {result.why && (
            <Text $size="xs" $variation="secondary">
              {result.why}
            </Text>
          )}
          <Text
            $size="sm"
            $css={css`
              display: block;
              white-space: pre-wrap;
              line-height: 1.5;
              padding: 10px 12px;
              border-radius: 8px;
              background: var(--c--contextuals--background--surface--tertiary);
            `}
          >
            {result.prompt}
          </Text>
          <Box $direction="row" $gap="8px" $justify="flex-end">
            <SavePromptButton prompt={result.prompt} />
            <Button
              size="small"
              onClick={() => offerPrompt(result.prompt, t('Follow-up'))}
              icon={<Icon iconName="north_west" $size="16px" />}
            >
              {t('Use this follow-up')}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
};
