import { useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import type { PromptAnalysis } from '../coach/coachApi';
import { useSkillLabels } from '../learn/CourseParts';
import { getCourseContent } from '../learn/content';
import { SEEN_GRADE } from '../learn/steps';
import { DAY_MS, useLearnProgressStore } from '../learn/useLearnProgressStore';
import { useReward } from '../rewards/useReward';

/** A step to try is looked for in real requests for a week. */
const PRACTICE_DAYS = 7;

/**
 * After "try it on my next request" at the end of a step: the coach says
 * whether this request does what the step taught, by name.
 */
export const PracticeCheck = ({ result }: { result: PromptAnalysis }) => {
  const { t, i18n } = useTranslation();
  const reward = useReward();
  const skillLabels = useSkillLabels();
  const pending = useLearnProgressStore((state) => state.pendingPractice);
  const setPendingPractice = useLearnProgressStore(
    (state) => state.setPendingPractice,
  );
  // Decided once per reading: the message stays while it is read.
  const verdict = useMemo(() => {
    if (!pending || Date.now() - pending.since > PRACTICE_DAYS * DAY_MS) {
      return null;
    }
    const missing = pending.skills.filter(
      (skill) => (result.competencies[skill] ?? 0) < SEEN_GRADE,
    );
    const lesson = getCourseContent(i18n.language).lessons.find(
      (item) => item.id === pending.lessonId,
    );
    return { missing, title: lesson?.title ?? '' };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);
  const doneRef = useRef(false);

  useEffect(() => {
    if (!verdict || doneRef.current) {
      return;
    }
    doneRef.current = true;
    if (verdict.missing.length === 0) {
      setPendingPractice(null);
      reward('quiz-passed');
    }
    // `reward` is a fresh function each render; it runs once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [verdict, setPendingPractice]);

  if (!verdict) {
    return null;
  }
  const isDone = verdict.missing.length === 0;
  return (
    <Box
      role="status"
      $direction="row"
      $gap="10px"
      $css={css`
        padding: 12px 14px;
        border-radius: 12px;
        background: var(
          --c--contextuals--background--semantic--${isDone ? 'success' : 'info'}--tertiary
        );
      `}
    >
      <Icon
        iconName={isDone ? 'school' : 'flag'}
        $size="20px"
        $theme={isDone ? 'success' : 'info'}
      />
      <Box $gap="2px" $css="flex: 1; min-width: 0;">
        <Text $size="sm" $weight="700">
          {isDone
            ? t('You applied the step “{{title}}”.', { title: verdict.title })
            : t('The step “{{title}}” is not there yet.', {
                title: verdict.title,
              })}
        </Text>
        {!isDone && (
          <Text $size="sm">
            {t('Still missing: {{skills}}.', {
              skills: verdict.missing
                .map((skill) => skillLabels[skill].toLocaleLowerCase())
                .join(', '),
            })}
          </Text>
        )}
      </Box>
    </Box>
  );
};
