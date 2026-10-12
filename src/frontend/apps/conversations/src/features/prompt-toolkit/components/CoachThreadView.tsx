import { Button, Loader } from '@gouvfr-lasuite/cunningham-react';
import { ReactNode, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { COACH_FOLLOW_UPS, CoachFollowUp, NextGroup } from '../coach/coachApi';
import type { ThreadStatus } from '../coach/useCoachThread';
import { UserBubble, bubbleCss } from '../fill/GuidedThread';
import { LESSON_FOR_COMPETENCY } from '../learn/lessonForCompetency';
import type { CoachThreadEntry } from '../stores/useCoachThreadStore';
import { useProfileStore } from '../stores/useProfileStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';
import { usePlacePrompt } from '../tools/usePlacePrompt';

import { NextQuestionsBlock } from './AfterAnswerViews';
import { CoachLink } from './CoachParts';
import { NESTOR_AVATAR_URL } from './PanelHome';

type Tone = 'success' | 'warning' | 'brand' | 'info';

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

const noteCss = css`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 4px 12px 12px 12px;
  font-size: 0.875rem;
  line-height: 1.5;
  background: var(--c--contextuals--background--surface--tertiary);
`;

const promptCss = css`
  display: block;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  padding: 8px 10px;
  border-radius: 8px;
  border: 1px solid var(--c--contextuals--border--surface--primary);
  background: var(--c--contextuals--background--surface--primary);
`;

const linkCss = css`
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  font: inherit;
  font-size: 0.8125rem;
  color: var(--c--contextuals--content--semantic--brand--primary);
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 2px;
  }
`;

const Avatar = () => (
  <img
    src={NESTOR_AVATAR_URL}
    alt=""
    width={28}
    height={28}
    style={{ flex: 'none', borderRadius: '50%' }}
  />
);

const Part = ({
  icon,
  tone,
  title,
  children,
}: {
  icon: string;
  tone: Tone;
  title: string;
  children: React.ReactNode;
}) => (
  <Box $gap="4px">
    <Box $direction="row" $align="center" $gap="6px">
      <Icon iconName={icon} $size="18px" $theme={tone} />
      <Text $size="sm" $weight="700">
        {title}
      </Text>
    </Box>
    {children}
  </Box>
);

/** A request Nestor prepared, one click away from the message field. */
const ReadyPrompt = ({ prompt }: { prompt: string }) => {
  const { t } = useTranslation();
  const placePrompt = usePlacePrompt();
  return (
    <Box $gap="6px">
      <Text $size="sm" $css={promptCss}>
        {prompt}
      </Text>
      <Box $direction="row" $justify="flex-end">
        <Button
          size="small"
          onClick={() => placePrompt(prompt)}
          icon={<Icon iconName="north_west" $size="16px" />}
        >
          {t('Put it in the message field')}
        </Button>
      </Box>
    </Box>
  );
};

const Waiting = ({ label }: { label: string }) => (
  <Box $direction="row" $align="center" $gap="8px" role="status">
    <Loader size="small" />
    <Text $size="sm">{label}</Text>
  </Box>
);

const Failed = ({ onRetry }: { onRetry: () => void }) => {
  const { t } = useTranslation();
  return (
    <Box role="alert" $direction="row" $align="center" $gap="8px">
      <Text $size="sm">{t('Nestor did not answer. Try again.')}</Text>
      <Button size="small" color="neutral" onClick={onRetry}>
        {t('Retry')}
      </Button>
    </Box>
  );
};

/**
 * The request Nestor proposes, ready in one click; its text and why it
 * works stay folded, so the advice stays short.
 */
const TryDetails = ({ why, prompt }: { why?: string; prompt: string }) => {
  const { t } = useTranslation();
  const placePrompt = usePlacePrompt();
  const [isOpen, setIsOpen] = useState(false);
  const id = useId();
  if (!why && !prompt) {
    return null;
  }
  return (
    <Box $gap="8px">
      <Box $direction="row" $align="center" $gap="8px" $css="flex-wrap: wrap;">
        {prompt && (
          <Button
            size="small"
            onClick={() => placePrompt(prompt)}
            icon={<Icon iconName="north_west" $size="16px" />}
          >
            {t('Put it in the message field')}
          </Button>
        )}
        <Box
          as="button"
          type="button"
          aria-expanded={isOpen}
          aria-controls={id}
          onClick={() => setIsOpen((value) => !value)}
          $direction="row"
          $align="center"
          $gap="2px"
          $css={linkCss}
        >
          <Icon
            iconName={isOpen ? 'expand_less' : 'expand_more'}
            $size="18px"
            $withThemeInherited
          />
          {prompt ? t('See the proposed request') : t('See why')}
        </Box>
      </Box>
      {isOpen && (
        <Box id={id} $gap="6px">
          {why && <Text $size="sm">{why}</Text>}
          {prompt && (
            <Text $size="sm" $css={promptCss}>
              {prompt}
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
};

const useAskLabels = (): Record<CoachFollowUp, string> => {
  const { t } = useTranslation();
  return {
    why: t('Why?'),
    example: t('Show me an example'),
  };
};

/** One note of the coach, the questions asked under it and his replies. */
const ThreadNote = ({
  entry,
  isLatest,
  asking,
  onAsk,
  continuation,
}: {
  entry: CoachThreadEntry;
  isLatest: boolean;
  asking: { ask: CoachFollowUp; status: ThreadStatus } | null;
  onAsk: (ask: CoachFollowUp) => void;
  /** Under the latest note: the other ways to go on. */
  continuation?: ReactNode;
}) => {
  const { t } = useTranslation();
  const askLabels = useAskLabels();
  const isBeginner = useProfileStore((state) => state.isBeginner);
  const openLesson = usePromptToolkitStore((state) => state.openLesson);
  const lesson = entry.competency
    ? LESSON_FOR_COMPETENCY[entry.competency]
    : undefined;
  const asked = new Set(entry.replies.map((reply) => reply.ask));
  const left = COACH_FOLLOW_UPS.filter((ask) => !asked.has(ask));

  return (
    <Box $gap="10px">
      <Text
        $size="xs"
        $weight="600"
        $variation="secondary"
        $css="padding-left: 36px;"
      >
        {entry.fromStart
          ? t('Since the start · {{count}} exchanges', {
              count: entry.exchanges,
            })
          : t('Since my last advice · {{count}} exchanges', {
              count: entry.exchanges,
            })}
      </Text>
      <Box $direction="row" $align="flex-start" $gap="8px">
        <Avatar />
        <Box $css={noteCss}>
          {entry.followUp && (
            <Box
              $direction="row"
              $gap="8px"
              $css={css`
                padding: 8px 10px;
                border-radius: 8px;
                background: var(
                  --c--contextuals--background--semantic--${
                      entry.applied ? 'success' : 'neutral'
                    }--tertiary
                );
              `}
            >
              <Icon
                iconName={entry.applied ? 'celebration' : 'history'}
                $size="18px"
                $theme={entry.applied ? 'success' : 'neutral'}
              />
              <Text $size="sm">{entry.followUp}</Text>
            </Box>
          )}
          {entry.worked && (
            <Part icon="check_circle" tone="success" title={t('What worked')}>
              <Text $size="sm">{entry.worked}</Text>
            </Part>
          )}
          {!isBeginner && entry.issue && (
            <Part icon="report" tone="warning" title={t('What got stuck')}>
              <Text $size="sm">{entry.issue}</Text>
            </Part>
          )}
          {(entry.tryNow || entry.prompt) && (
            <Part icon="arrow_forward" tone="brand" title={t('Try now')}>
              {entry.tryNow && <Text $size="sm">{entry.tryNow}</Text>}
              <TryDetails why={entry.tryWhy} prompt={entry.prompt} />
            </Part>
          )}
          {!isBeginner && entry.habit && (
            <Part icon="lightbulb" tone="info" title={t('The habit to keep')}>
              <Text $size="sm">{entry.habit}</Text>
              {lesson && (
                <Box $direction="row">
                  <CoachLink
                    icon="school"
                    onClick={() => openLesson(lesson.lessonId, lesson.slide)}
                  >
                    {t('See the lesson · 1 min')}
                  </CoachLink>
                </Box>
              )}
            </Part>
          )}
        </Box>
      </Box>

      {entry.replies
        .filter((reply) => reply.ask in askLabels)
        .map((reply) => (
          <Box key={reply.ask} $gap="8px">
            <UserBubble>{askLabels[reply.ask]}</UserBubble>
            <Box $direction="row" $align="flex-end" $gap="8px">
              <Avatar />
              <Box $css={bubbleCss(false)} $gap="8px">
                <Text $size="sm">{reply.text}</Text>
                {reply.prompt && <ReadyPrompt prompt={reply.prompt} />}
              </Box>
            </Box>
          </Box>
        ))}

      {isLatest && asking?.status === 'loading' && (
        <Box $gap="8px">
          <UserBubble>{askLabels[asking.ask]}</UserBubble>
          <Waiting label={t('Nestor is answering…')} />
        </Box>
      )}
      {isLatest && asking?.status === 'error' && (
        <Failed onRetry={() => onAsk(asking.ask)} />
      )}
      {continuation && <Box $css="padding-left: 36px;">{continuation}</Box>}
      {/* Going on with Nestor: one click, nothing to type. */}
      {isLatest && left.length > 0 && asking?.status !== 'loading' && (
        <Box
          $direction="row"
          $gap="6px"
          $css="flex-wrap: wrap; padding-left: 36px;"
        >
          {left.map((ask) => (
            <Button
              key={ask}
              size="small"
              color="neutral"
              variant="bordered"
              onClick={() => onAsk(ask)}
            >
              {askLabels[ask]}
            </Button>
          ))}
        </Box>
      )}
    </Box>
  );
};

/**
 * "Advice": the coach's thread on the conversation. Each note reads the
 * exchanges since the previous one and checks the previous advice; the
 * session review ends it.
 */
export const CoachThreadView = ({
  entries,
  status,
  asking,
  hasAnswer,
  gaps,
  canReview,
  next,
  isUpToDate,
  onRetry,
  onAsk,
  onReview,
}: {
  entries: CoachThreadEntry[];
  status: ThreadStatus;
  asking: { entryId: string; ask: CoachFollowUp; status: ThreadStatus } | null;
  hasAnswer: boolean;
  gaps: string[];
  canReview: boolean;
  /** The next questions prepared for the latest answer. */
  next: { status: string; groups: NextGroup[] };
  /** The latest note covers the latest answer. */
  isUpToDate: boolean;
  onRetry: () => void;
  onAsk: (entryId: string, ask: CoachFollowUp) => void;
  onReview: () => void;
}) => {
  const { t } = useTranslation();
  const lastRef = useRef<HTMLLIElement | null>(null);
  // The next questions belong to the latest answer: under the note that
  // reads it, or at the end when no note will (none yet, or it failed).
  const continuation =
    next.status === 'ready' && next.groups.length > 0 ? (
      <NextQuestionsBlock groups={next.groups} />
    ) : null;
  const inNote = isUpToDate && status === 'idle';
  const count = entries.length;
  // A new note: it comes into view, from its start.
  useEffect(() => {
    if (count > 1) {
      lastRef.current?.scrollIntoView?.({
        block: 'start',
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
      });
    }
  }, [count]);

  if (!hasAnswer && count === 0) {
    return (
      <Box $padding={{ all: 'lg' }} $align="center">
        <Text $textAlign="center" $size="sm" $variation="secondary">
          {t(
            'Send a request: once the Assistant has answered, I can help with what comes next.',
          )}
        </Text>
      </Box>
    );
  }

  return (
    <Box $gap="16px" $padding={{ all: 'base' }}>
      <Box $gap="2px">
        <Text as="h3" $size="md" $weight="700" $margin="0">
          {t('Nestor follows your exchanges')}
        </Text>
        <Text $size="sm" $variation="secondary">
          {t(
            'Each time you come here, he looks at the exchanges since his last advice.',
          )}
        </Text>
      </Box>

      {count > 0 && (
        <Box
          as="ol"
          $gap="20px"
          $css="margin: 0; padding: 0; list-style: none;"
        >
          {entries.map((entry, index) => (
            <Box
              as="li"
              key={entry.id}
              ref={index === count - 1 ? lastRef : undefined}
            >
              <ThreadNote
                entry={entry}
                isLatest={index === count - 1}
                asking={asking?.entryId === entry.id ? asking : null}
                onAsk={(ask) => onAsk(entry.id, ask)}
                continuation={
                  index === count - 1 && inNote ? continuation : undefined
                }
              />
            </Box>
          ))}
        </Box>
      )}

      {/* Seen without the model: the answer is not ready as it is. */}
      {gaps.length > 0 && (
        <Box
          role="note"
          $direction="row"
          $gap="8px"
          $css={css`
            padding: 10px 12px;
            border-radius: 10px;
            background: var(
              --c--contextuals--background--semantic--warning--tertiary
            );
          `}
        >
          <Icon iconName="edit_note" $size="20px" $theme="warning" />
          <Box $gap="2px">
            <Text $size="sm" $weight="700">
              {t(
                'This answer is not ready to be sent: {{count}} parts to complete',
                { count: gaps.length },
              )}
            </Text>
            <Text $size="sm">{gaps.join(' · ')}</Text>
          </Box>
        </Box>
      )}

      {status === 'loading' && (
        <Waiting
          label={
            count === 0
              ? t('Nestor is reading the conversation…')
              : t('Nestor is reading the new exchanges…')
          }
        />
      )}
      {status === 'error' && <Failed onRetry={onRetry} />}
      {!inNote && status !== 'loading' && continuation}

      {/* The end of the thread: the review of the whole session. */}
      {canReview && status !== 'loading' && (
        <Box
          $direction="row"
          $align="center"
          $gap="8px"
          $css={css`
            padding-top: 12px;
            border-top: 1px solid
              var(--c--contextuals--border--surface--primary);
          `}
        >
          <Text $size="sm" $variation="secondary" $css="flex: 1;">
            {t('Done with this conversation?')}
          </Text>
          <Button
            size="small"
            color="brand"
            variant="secondary"
            onClick={onReview}
            icon={<Icon iconName="insights" $size="16px" />}
          >
            {t('Review the session')}
          </Button>
        </Box>
      )}
    </Box>
  );
};
