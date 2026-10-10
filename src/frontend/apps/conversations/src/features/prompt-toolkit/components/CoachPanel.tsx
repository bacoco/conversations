import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { languageName } from '../coach/language';
import { usePromptAnalysis } from '../coach/usePromptAnalysis';
import { NestorBubble } from '../fill/GuidedThread';
import { useReward } from '../rewards/useReward';
import { useCoachHistoryStore } from '../stores/useCoachHistoryStore';
import { useMainConversationStore } from '../stores/useMainConversationStore';
import { useProfileStore } from '../stores/useProfileStore';
import {
  usePromptToolkitStore,
  useSectionReset,
} from '../stores/usePromptToolkitStore';
import { usePlacePrompt } from '../tools/usePlacePrompt';

import { CoachAnswer } from './CoachAnswer';
import { CoachDraft } from './CoachDraft';
import { CoachWelcome, CoachWrite } from './CoachWelcome';
import { SessionReviewPanel } from './SessionReviewPanel';

/** From this many requests in the conversation, a review makes sense. */
const REVIEW_MIN_REQUESTS = 2;

/** Room kept under the content for Nestor's round button (52px + margins). */
const DOCK_ROOM_PX = 84;

const reviewLinkCss = css`
  width: 100%;
  margin-top: auto;
  padding: 14px 16px;
  border: none;
  border-top: 1px solid var(--c--contextuals--border--surface--primary);
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  text-align: left;
  color: var(--c--contextuals--content--semantic--brand--primary);
  background: var(--c--contextuals--background--surface--primary);
  &:hover {
    background: var(--c--contextuals--background--semantic--brand--tertiary);
  }
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: -2px;
  }
`;

/**
 * The coach: one screen, no tabs, that follows the moment. Nothing written:
 * how it helps. A request in the message field: read it, complete it. An
 * answer of the Assistant: does it suit you, what next. The conversation in
 * the centre is never changed; a message only leaves on the user's click.
 *
 * `isActive` is false while the panel is hidden: nothing runs on typing then.
 */
export const CoachPanel = ({ isActive = true }: { isActive?: boolean }) => {
  const { t, i18n } = useTranslation();
  const language = languageName(i18n.language);
  const reward = useReward();
  const placePrompt = usePlacePrompt();
  const chatInput = usePromptToolkitStore((state) => state.chatInput);
  const openTool = usePromptToolkitStore((state) => state.openTool);
  const isBeginner = useProfileStore((state) => state.isBeginner);
  const turns = useMainConversationStore((state) => state.turns);
  const answerId = useMainConversationStore(
    (state) => state.latestCompletedAssistantMessageId,
  );
  const isResponding = useMainConversationStore(
    (state) => state.isAssistantResponding,
  );
  const draft = chatInput.trim();
  const analysis = usePromptAnalysis(chatInput, language);

  const [isReviewing, setIsReviewing] = useState(false);
  const [isWriting, setIsWriting] = useState(false);
  /** What the coach just put in the message field. */
  const [placed, setPlaced] = useState<string | null>(null);
  const [tipAfterAnswer, setTipAfterAnswer] = useState(false);
  /** Bumped by the trash button: every moment starts over. */
  const [resetKey, setResetKey] = useState(0);

  // Record the grade when the analysed prompt is sent (the input empties).
  const recordInHistory = useCoachHistoryStore((state) => state.record);
  const setCoachWaitsForAnswer = usePromptToolkitStore(
    (state) => state.setCoachWaitsForAnswer,
  );
  const previousInputRef = useRef(chatInput);
  useEffect(() => {
    const previous = previousInputRef.current.trim();
    previousInputRef.current = chatInput;
    const sent = analysis.analysis;
    if (chatInput.trim() === '' && sent && previous === analysis.analyzedText) {
      // Its rank in the conversation: the request may already be there.
      const userTurns = useMainConversationStore
        .getState()
        .turns.filter((turn) => turn.role === 'user');
      const isListed = userTurns.at(-1)?.text.trim() === previous;
      recordInHistory(previous, sent.score, sent.competencies, {
        kind: sent.kind,
        turn: userTurns.length + (isListed ? 0 : 1),
      });
      // The coach will have something to say about the answer.
      setCoachWaitsForAnswer(true);
    }
  }, [
    chatInput,
    analysis.analysis,
    analysis.analyzedText,
    recordInHistory,
    setCoachWaitsForAnswer,
  ]);

  // Each new reading earns points; a very clear request, a bit more.
  const result = analysis.analysis;
  const rewardedRef = useRef<typeof result>(null);
  useEffect(() => {
    if (!result || rewardedRef.current === result) {
      return;
    }
    rewardedRef.current = result;
    reward('analysis');
    if (result.score >= 80) {
      reward('great-prompt');
    }
    // `reward` is a fresh function each render; only new grades matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  // Once sent or cleared, the message field no longer holds what we placed.
  useEffect(() => {
    if (!draft) {
      setPlaced(null);
    }
  }, [draft]);

  useSectionReset('coach', () => {
    analysis.reset();
    setIsReviewing(false);
    setIsWriting(false);
    setPlaced(null);
    setTipAfterAnswer(false);
    setResetKey((key) => key + 1);
  });

  const place = (text: string) => {
    placePrompt(text);
    setPlaced(text.trim());
    setIsWriting(false);
    analysis.reset();
  };

  const hasAnswer =
    !isResponding && answerId !== null && turns.at(-1)?.role === 'assistant';
  const requestCount = turns.filter((turn) => turn.role === 'user').length;
  const moment = isReviewing
    ? 'review'
    : isWriting
      ? 'write'
      : draft
        ? 'draft'
        : isResponding
          ? 'waiting'
          : hasAnswer
            ? 'answer'
            : 'none';

  return (
    <Box
      key={resetKey}
      $direction="column"
      // The read bar of a request already sits above Nestor's round button.
      $css={`flex: 1 0 auto; padding-bottom: ${moment === 'draft' ? 0 : DOCK_ROOM_PX}px;`}
    >
      {moment === 'review' && (
        <SessionReviewPanel
          language={language}
          autoStart
          onBack={() => setIsReviewing(false)}
        />
      )}
      {moment === 'write' && (
        <CoachWrite
          language={language}
          onPlace={place}
          onCancel={() => setIsWriting(false)}
        />
      )}
      {moment === 'draft' && (
        <CoachDraft
          draft={draft}
          analysis={analysis}
          language={language}
          isActive={isActive}
          isBeginner={isBeginner}
          isPlaced={placed === draft}
          onPlace={place}
        />
      )}
      {moment === 'waiting' && (
        <Box $padding={{ all: 'base' }}>
          <NestorBubble>
            {t(
              'The Assistant is writing its answer… Then I will ask you whether it suits you.',
            )}
          </NestorBubble>
        </Box>
      )}
      {moment === 'answer' && (
        <CoachAnswer
          key={answerId}
          turns={turns}
          language={language}
          showCorrectionTip={tipAfterAnswer}
          onTipShown={() => setTipAfterAnswer(false)}
          onCorrectionSent={() => setTipAfterAnswer(true)}
        />
      )}
      {moment === 'none' && (
        <CoachWelcome
          onHelpWrite={() => setIsWriting(true)}
          onExample={() => openTool('library')}
        />
      )}
      {(moment === 'none' || moment === 'answer') &&
        requestCount >= REVIEW_MIN_REQUESTS && (
          <Box
            as="button"
            type="button"
            onClick={() => setIsReviewing(true)}
            $direction="row"
            $align="center"
            $gap="10px"
            $css={reviewLinkCss}
          >
            <Icon iconName="insights" $size="20px" $withThemeInherited />
            <Text as="span" $theme="brand" $weight="600" $css="flex: 1;">
              {t('Review this exchange')}
            </Text>
            <Icon iconName="chevron_right" $size="20px" $withThemeInherited />
          </Box>
        )}
    </Box>
  );
};
