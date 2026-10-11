import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { useAiAvailable } from '../coach/aiAvailability';
import { type Competency, PROMPT_TOOLKIT_ENABLED } from '../coach/coachApi';
import { FOCUS_SKILLS } from '../coach/coachInsights';
import { detectSensitiveData } from '../coach/sensitiveData';
import { ROOM_PAUSE_MS, useRoomCoach } from '../coach/useRoomCoach';
import { useSkillLabels } from '../learn/CourseParts';
import { SEEN_GRADE } from '../learn/steps';
import { useLearnProgressStore } from '../learn/useLearnProgressStore';
import { useCoachPrefsStore } from '../stores/useCoachPrefsStore';
import { useMainConversationStore } from '../stores/useMainConversationStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

import { answerGaps } from './CoachAnswer';
import { useKindTips, useWhyTexts } from './CoachProgress';
import { NESTOR_AVATAR_URL } from './PanelHome';

/** The coach speaks up only when a habit is clearly missing. */
const ROOM_TIP_BELOW = 40;
/** And says nothing on a request that is already clear. */
const ROOM_CLEAR_FROM = 80;

const lineCss = (tone: 'brand' | 'warning' | 'success') => css`
  margin-bottom: 8px;
  padding: 8px 10px;
  border-radius: 12px;
  font-size: 0.875rem;
  background: var(--c--contextuals--background--semantic--${tone}--tertiary);
`;

const linkCss = css`
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  font: inherit;
  font-size: 0.8125rem;
  white-space: nowrap;
  color: var(--c--contextuals--content--semantic--brand--primary);
  text-decoration: underline;
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 2px;
  }
`;

const closeCss = css`
  flex: none;
  padding: 2px;
  border: none;
  border-radius: 50%;
  background: none;
  cursor: pointer;
  color: var(--c--contextuals--content--semantic--neutral--secondary);
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
  }
`;

type Hint =
  | { kind: 'sensitive'; text: string }
  | { kind: 'practice'; text: string }
  | { kind: 'tip'; text: string; skill: Competency; why?: string }
  | { kind: 'answer'; text: string };

/**
 * The coach in the room, one line above the message field. It watches the
 * request being written and, at a pause, says the one thing that matters:
 * personal data to remove, a clearly missing habit, or a lesson applied. It
 * stays quiet on a clear request, never interrupts the typing, never opens
 * the panel. After an answer with gaps, it says so before it is used.
 */
export const RoomCoachHint = () => {
  const { t } = useTranslation();
  const isAiAvailable = useAiAvailable();
  const roomCoach = useCoachPrefsStore((state) => state.roomCoach);
  const dismissedTips = useCoachPrefsStore((state) => state.dismissedTips);
  const dismissTip = useCoachPrefsStore((state) => state.dismissTip);
  const isPanelOpen = usePromptToolkitStore((state) => state.isOpen);
  const isCoachShown = usePromptToolkitStore(
    (state) =>
      state.isOpen && state.mode === 'coach' && !state.showHome && !state.fill,
  );
  const openCoachAndRead = usePromptToolkitStore(
    (state) => state.openCoachAndRead,
  );
  const startCoach = usePromptToolkitStore((state) => state.startCoach);
  const pending = useLearnProgressStore((state) => state.pendingPractice);
  const turns = useMainConversationStore((state) => state.turns);
  const answerId = useMainConversationStore(
    (state) => state.latestCompletedAssistantMessageId,
  );
  const tipFor = useKindTips();
  const why = useWhyTexts();
  const skillLabels = useSkillLabels();
  const { draft, analysis } = useRoomCoach(
    PROMPT_TOOLKIT_ENABLED && roomCoach && isAiAvailable && !isCoachShown,
  );
  // Personal data is said at a pause too, without the model.
  const [pausedOn, setPausedOn] = useState('');
  useEffect(() => {
    const timer = window.setTimeout(() => setPausedOn(draft), ROOM_PAUSE_MS);
    return () => window.clearTimeout(timer);
  }, [draft]);
  /** Closed for this request: quiet until it is sent or cleared. */
  const [isClosed, setIsClosed] = useState(false);
  const [closedAnswer, setClosedAnswer] = useState<string | null>(null);
  const [showWhy, setShowWhy] = useState(false);
  useEffect(() => {
    if (!draft) {
      setIsClosed(false);
    }
    setShowWhy(false);
  }, [draft]);

  const answer = [...turns].reverse().find((turn) => turn.role === 'assistant');
  const hint = useMemo((): Hint | null => {
    if (draft) {
      if (pausedOn === draft) {
        const sensitive = detectSensitiveData(draft);
        if (sensitive.length > 0) {
          return {
            kind: 'sensitive',
            text: t(
              'Your request contains personal data: remove what the task does not need before sending.',
            ),
          };
        }
      }
      if (!analysis) {
        return null;
      }
      if (
        pending &&
        pending.skills.every(
          (skill) => (analysis.competencies[skill] ?? 0) >= SEEN_GRADE,
        )
      ) {
        return {
          kind: 'practice',
          text: t('Well done: you apply what the lesson taught.'),
        };
      }
      if (analysis.score >= ROOM_CLEAR_FROM) {
        return null;
      }
      const kind = analysis.kind ?? 'other';
      const skipped = dismissedTips[kind] ?? [];
      const [weakest] = FOCUS_SKILLS.filter((skill) => !skipped.includes(skill))
        .map((skill) => ({ skill, grade: analysis.competencies[skill] ?? 0 }))
        .sort((a, b) => a.grade - b.grade);
      return weakest && weakest.grade < ROOM_TIP_BELOW
        ? {
            kind: 'tip',
            skill: weakest.skill,
            text: tipFor(weakest.skill, analysis.kind),
            why: why[weakest.skill],
          }
        : null;
    }
    // Nothing being written: an answer that leaves parts to complete.
    if (answer && answerId && closedAnswer !== answerId) {
      const { brackets, marks } = answerGaps(answer.text);
      const count = brackets.length + marks;
      if (count > 0) {
        return {
          kind: 'answer',
          text: t(
            'This answer is not ready to be sent yet: {{count}} parts to complete.',
            {
              count,
            },
          ),
        };
      }
    }
    return null;
    // `tipFor`, `why` and `t` follow the language.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    draft,
    pausedOn,
    analysis,
    pending,
    dismissedTips,
    answer,
    answerId,
    closedAnswer,
  ]);

  // With the coach open, only the answer's warning stays: its version to
  // send is being prepared there, not in the conversation.
  if (
    !PROMPT_TOOLKIT_ENABLED ||
    !roomCoach ||
    !hint ||
    (isCoachShown && hint.kind !== 'answer')
  ) {
    return null;
  }
  if (draft && isClosed) {
    return null;
  }
  const close = () => {
    if (hint.kind === 'answer') {
      setClosedAnswer(answerId);
    } else {
      setIsClosed(true);
    }
  };
  const tone =
    hint.kind === 'sensitive' || hint.kind === 'answer'
      ? 'warning'
      : hint.kind === 'practice'
        ? 'success'
        : 'brand';

  return (
    <Box
      role="status"
      aria-label={t('Nestor, your coach')}
      $direction="row"
      $align="flex-start"
      $gap="8px"
      $css={lineCss(tone)}
    >
      <img
        src={NESTOR_AVATAR_URL}
        alt=""
        width={24}
        height={24}
        style={{ flex: 'none', borderRadius: '50%' }}
      />
      <Box $gap="2px" $css="flex: 1; min-width: 0;">
        <Text $size="sm">
          {hint.kind === 'answer' && isCoachShown
            ? t(
                'Do not copy this answer as it is: its version to send is prepared in the panel, on the right.',
              )
            : hint.text}
        </Text>
        {hint.kind === 'tip' && showWhy && hint.why && (
          <Text $size="xs" $variation="secondary">
            {hint.why}
          </Text>
        )}
        <Box $direction="row" $gap="12px" $css="flex-wrap: wrap;">
          {hint.kind === 'tip' && hint.why && (
            <Box
              as="button"
              type="button"
              aria-expanded={showWhy}
              onClick={() => setShowWhy((value) => !value)}
              $css={linkCss}
            >
              {t('Why?')}
            </Box>
          )}
          {(hint.kind === 'tip' || hint.kind === 'sensitive') &&
            isAiAvailable && (
              <Box
                as="button"
                type="button"
                onClick={openCoachAndRead}
                $css={linkCss}
              >
                {t('Fix it with me')}
              </Box>
            )}
          {hint.kind === 'answer' && !isCoachShown && (
            <Box
              as="button"
              type="button"
              onClick={() => {
                setClosedAnswer(answerId);
                if (!isPanelOpen) {
                  usePromptToolkitStore.setState({ isOpen: true });
                }
                startCoach();
              }}
              $css={linkCss}
            >
              {t('Make it ready with Nestor')}
            </Box>
          )}
          {hint.kind === 'tip' && analysis && (
            <Box
              as="button"
              type="button"
              onClick={() => {
                dismissTip(analysis.kind ?? 'other', hint.skill);
                setIsClosed(true);
              }}
              $css={linkCss}
            >
              {t('Not needed here')}
            </Box>
          )}
        </Box>
      </Box>
      <Box
        as="button"
        type="button"
        aria-label={t('Close')}
        title={
          hint.kind === 'tip'
            ? t('{{skill}}: closed for this request', {
                skill: skillLabels[hint.skill],
              })
            : t('Close')
        }
        onClick={close}
        $css={closeCss}
      >
        <Icon iconName="close" $size="16px" $withThemeInherited />
      </Box>
    </Box>
  );
};
