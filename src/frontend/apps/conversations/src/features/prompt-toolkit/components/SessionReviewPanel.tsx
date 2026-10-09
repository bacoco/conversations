import { Button, Loader } from '@gouvfr-lasuite/cunningham-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';
import { getConversation } from '@/features/chat/api/useConversation';
import type { ChatMessage } from '@/features/chat/types';
import { useConversationRouteId } from '@/utils';

import { SessionReview, reviewSession } from '../coach/coachApi';
import { useReward } from '../rewards/useReward';
import { useSectionReset } from '../stores/usePromptToolkitStore';

import { CoachFeedback } from './CoachFeedback';
import { CoachStatus } from './CoachStatus';
import { SessionDashboard } from './SessionDashboard';

const sectionCss = css`
  padding: 16px;
  border-bottom: 1px solid var(--c--contextuals--border--surface--primary);
`;

/** Text the user typed in each message of the conversation, in order. */
export const userPrompts = (messages: ChatMessage[]) =>
  messages
    .filter((message) => message.role === 'user')
    .map((message) =>
      message.parts
        .map((part) => (part.type === 'text' ? part.text : ''))
        .join('\n')
        .trim(),
    )
    .filter(Boolean);

const List = ({
  title,
  items,
  icon,
  theme,
}: {
  title: string;
  items: string[];
  icon: string;
  theme: 'success' | 'brand' | 'info';
}) =>
  items.length === 0 ? null : (
    <Box $gap="8px">
      <Text as="h3" $size="sm" $weight="700" $margin="0">
        {title}
      </Text>
      <Box as="ul" $gap="8px" $css="margin: 0; padding: 0; list-style: none;">
        {items.map((item) => (
          <Box as="li" key={item} $direction="row" $gap="8px">
            <Icon
              iconName={icon}
              $size="16px"
              $theme={theme}
              $css="margin-top: 2px;"
            />
            <Text $size="sm">{item}</Text>
          </Box>
        ))}
      </Box>
    </Box>
  );

/** Robin reviewing the session; replaced by a dedicated illustration later. */
const SESSION_IMAGE_URL = '/assets/robin-bilan.webp';

/** Coach of the whole session: how the user prompted, not one prompt. */
export const SessionReviewPanel = ({ language }: { language: string }) => {
  const { t } = useTranslation();
  const conversationId = useConversationRouteId();
  const reward = useReward();
  const [review, setReview] = useState<SessionReview | null>(null);
  const [promptCount, setPromptCount] = useState(0);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'empty'>(
    'idle',
  );
  const controllerRef = useRef<AbortController | null>(null);

  // A review belongs to one conversation.
  useEffect(() => {
    controllerRef.current?.abort();
    setReview(null);
    setStatus('idle');
  }, [conversationId]);
  useEffect(() => () => controllerRef.current?.abort(), []);
  useSectionReset('coach', () => {
    controllerRef.current?.abort();
    setReview(null);
    setStatus('idle');
  });

  const runReview = async () => {
    if (!conversationId) {
      return;
    }
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus('loading');
    try {
      const conversation = await getConversation({ id: conversationId });
      const prompts = userPrompts(conversation.messages);
      setPromptCount(prompts.length);
      if (prompts.length === 0) {
        setStatus('empty');
        return;
      }
      setReview(await reviewSession(prompts, language, controller.signal));
      reward('review');
      setStatus('idle');
    } catch {
      if (!controller.signal.aborted) {
        setStatus('error');
      }
    }
  };

  const button = (
    <Button
      fullWidth
      disabled={status === 'loading'}
      onClick={() => void runReview()}
      icon={
        status === 'loading' ? (
          <Loader size="small" />
        ) : (
          <Icon iconName="insights" $size="18px" />
        )
      }
    >
      {review ? t('Review again') : t('Review this session')}
    </Button>
  );

  // Before the first review: a page that says what you will get.
  if (!review || !conversationId) {
    return (
      <Box
        $align="center"
        $justify="center"
        $gap="20px"
        $css={css`
          flex: 1;
          padding: 24px 24px 120px;
          text-align: center;
        `}
      >
        <Box
          $css={css`
            width: min(260px, 70%);
            aspect-ratio: 1;
            border-radius: 50%;
            overflow: hidden;
            background: #f7f8fd;
          `}
        >
          <img
            src={SESSION_IMAGE_URL}
            alt=""
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        </Box>
        <Box $gap="6px" $align="center">
          <Text as="h3" $size="h4" $weight="800" $margin="0">
            {t('Session review')}
          </Text>
          <Text $variation="secondary" $css="max-width: 34ch;">
            {t(
              'Robin reads all the prompts of this conversation and tells you how you prompt.',
            )}
          </Text>
        </Box>
        <Box
          as="ul"
          $gap="10px"
          $css={css`
            margin: 0;
            padding: 0;
            list-style: none;
            text-align: left;
          `}
        >
          {[
            { icon: 'check_circle', label: t('What you already do well') },
            { icon: 'trending_up', label: t('The habits to build') },
            { icon: 'lightbulb', label: t('Three tips for next time') },
          ].map((item) => (
            <Box
              as="li"
              key={item.icon}
              $direction="row"
              $align="center"
              $gap="10px"
            >
              <Icon iconName={item.icon} $size="20px" $theme="brand" />
              <Text $weight="600">{item.label}</Text>
            </Box>
          ))}
        </Box>
        {conversationId ? (
          <Box $css="width: min(320px, 100%);">{button}</Box>
        ) : (
          <Text $size="sm" $weight="600" $theme="brand">
            {t('Open a conversation to review it')}
          </Text>
        )}
        {status === 'loading' && (
          <Text $size="sm" $variation="secondary" role="status">
            {t('The coach is reading your conversation…')}
          </Text>
        )}
        {status === 'empty' && (
          <Text $size="sm" role="status">
            {t('Send a few prompts in this conversation first.')}
          </Text>
        )}
        {status === 'error' && (
          <Text $size="sm" $theme="danger" role="alert">
            {t('The coach could not review this session. Please retry.')}
          </Text>
        )}
      </Box>
    );
  }

  return (
    <Box $direction="column">
      <CoachStatus
        isLoading={status === 'loading'}
        loadingLabel={t('The coach is reading your conversation…')}
      />
      <Box $gap="8px" $css={sectionCss}>
        {button}
        {status === 'empty' && (
          <Text $size="sm" role="status">
            {t('Send a few prompts in this conversation first.')}
          </Text>
        )}
        {status === 'error' && (
          <Text $size="sm" role="alert">
            {t('The coach could not review this session. Please retry.')}
          </Text>
        )}
      </Box>

      {review && (
        <>
          <Box $gap="6px" $css={sectionCss}>
            <Text as="h3" $size="sm" $weight="700" $margin="0">
              {t('Session summary')}
            </Text>
            <Text $size="xs" $variation="secondary">
              {t('{{count}} prompts reviewed', { count: promptCount })}
            </Text>
            {review.summary && <Text $size="sm">{review.summary}</Text>}
          </Box>
          {review.grades.length > 0 && (
            <Box $css={sectionCss}>
              <SessionDashboard grades={review.grades} />
            </Box>
          )}
          <Box $gap="16px" $css={sectionCss}>
            <List
              title={t('What you already do well')}
              items={review.strengths}
              icon="check"
              theme="success"
            />
            <List
              title={t('Habits to build')}
              items={review.habits}
              icon="trending_up"
              theme="brand"
            />
            <List
              title={t('Three tips for next time')}
              items={review.tips}
              icon="lightbulb"
              theme="info"
            />
          </Box>
          <Box $direction="row" $justify="flex-end" $css="padding: 8px 16px;">
            <CoachFeedback target="session" />
          </Box>
        </>
      )}
    </Box>
  );
};
