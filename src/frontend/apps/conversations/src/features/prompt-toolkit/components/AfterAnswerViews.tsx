import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import type { NextGroup, StandardAxis } from '../coach/coachApi';
import { useStandardAxisLabels } from '../coach/useAfterAnswer';
import { suggestionCss } from '../fill/GuidedThread';
import { useProfileStore } from '../stores/useProfileStore';
import { usePlacePrompt } from '../tools/usePlacePrompt';

const questionCss = css`
  ${suggestionCss}
  width: 100%;
  border-radius: 10px;
  padding: 10px 12px;
`;

const separatorCss =
  'flex: 1; height: 1px; background: var(--c--contextuals--border--surface--primary);';

type Tone = 'info' | 'success' | 'warning' | 'brand' | 'neutral';

/** One colour per standard axis, the same after every answer. */
const AXIS_TONES: Record<StandardAxis, Tone> = {
  deepen: 'info',
  reshape: 'success',
  step_back: 'warning',
};
const AXIS_ICONS: Record<StandardAxis, string> = {
  deepen: 'zoom_in',
  reshape: 'transform',
  step_back: 'fact_check',
};
/** Extra axes are coloured by their place, never by their name. */
const EXTRA_TONES: Tone[] = ['brand', 'neutral'];

const groupQuestionCss = (tone: Tone) => css`
  ${questionCss}
  color: var(--c--contextuals--content--semantic--${tone}--primary);
  border: 1px solid var(--c--contextuals--border--semantic--${tone}--secondary);
  border-left-width: 4px;
  &:hover:not(:disabled) {
    background: var(--c--contextuals--background--semantic--${tone}--tertiary);
  }
  &:focus-visible {
    outline-color: var(--c--contextuals--border--semantic--${tone}--primary);
  }
`;

const NextGroupView = ({
  title,
  icon,
  tone,
  questions,
}: {
  title: string;
  icon: string;
  tone: Tone;
  questions: string[];
}) => {
  const placePrompt = usePlacePrompt();
  return (
    <Box as="section" aria-label={title} $gap="6px">
      <Box $direction="row" $align="center" $gap="6px">
        <Box
          aria-hidden
          $css={css`
            display: inline-flex;
            padding: 3px;
            border-radius: 6px;
            color: var(--c--contextuals--content--semantic--${tone}--primary);
            background: var(
              --c--contextuals--background--semantic--${tone}--tertiary
            );
          `}
        >
          <Icon iconName={icon} $size="16px" $withThemeInherited />
        </Box>
        <Text as="h4" $size="sm" $weight="700" $margin="0">
          {title}
        </Text>
      </Box>
      <Box as="ul" $gap="6px" $css="margin: 0; padding: 0; list-style: none;">
        {questions.map((question) => (
          <Box as="li" key={question}>
            <Box
              as="button"
              type="button"
              onClick={() => placePrompt(question)}
              $direction="row"
              $align="center"
              $gap="8px"
              $css={groupQuestionCss(tone)}
            >
              <Icon iconName="north_west" $size="16px" $withThemeInherited />
              <Text as="span" $size="sm" $css="flex: 1; min-width: 0;">
                {question}
              </Text>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

/**
 * "Other ways to go on", under the coach's latest advice: the next
 * questions prepared after each answer, by axis. Folded, the main one of
 * each standard axis; unfolded, all of them and the axes this conversation
 * calls for. Beginners only see the main ones.
 */
export const NextQuestionsBlock = ({ groups }: { groups: NextGroup[] }) => {
  const { t } = useTranslation();
  const axisLabels = useStandardAxisLabels();
  const isBeginner = useProfileStore((state) => state.isBeginner);
  const [isOpen, setIsOpen] = useState(false);
  const standard = groups.flatMap((group) =>
    group.kind === 'standard' ? [group] : [],
  );
  const extra = groups.flatMap((group) =>
    group.kind === 'extra' ? [group] : [],
  );
  const hasMore =
    !isBeginner &&
    (extra.length > 0 || standard.some((group) => group.questions.length > 1));
  const showAll = hasMore && isOpen;
  if (standard.length === 0 && extra.length === 0) {
    return null;
  }

  return (
    <Box as="section" aria-labelledby="next-questions-title" $gap="12px">
      <Box $gap="2px">
        <Text
          as="h4"
          id="next-questions-title"
          $size="sm"
          $weight="700"
          $margin="0"
        >
          {t('Other ways to go on')}
        </Text>
        <Text $size="xs" $variation="secondary">
          {t('Click a question to put it in the message field.')}
        </Text>
      </Box>
      {standard.map((group) => (
        <NextGroupView
          key={group.axis}
          title={axisLabels[group.axis]}
          icon={AXIS_ICONS[group.axis]}
          tone={AXIS_TONES[group.axis]}
          questions={showAll ? group.questions : group.questions.slice(0, 1)}
        />
      ))}
      {(showAll || standard.length === 0) && extra.length > 0 && (
        <Box $gap="12px">
          <Box $direction="row" $align="center" $gap="8px">
            <Box aria-hidden $css={separatorCss} />
            <Text $size="xs" $variation="secondary">
              {t('For this answer')}
            </Text>
            <Box aria-hidden $css={separatorCss} />
          </Box>
          {extra.map((group, index) => (
            <NextGroupView
              key={group.label}
              title={group.label}
              icon="auto_awesome"
              tone={EXTRA_TONES[index % EXTRA_TONES.length]}
              questions={group.questions}
            />
          ))}
        </Box>
      )}
      {hasMore && standard.length > 0 && (
        <Box
          as="button"
          type="button"
          aria-expanded={isOpen}
          onClick={() => setIsOpen((value) => !value)}
          $direction="row"
          $align="center"
          $gap="4px"
          $css={css`
            align-self: flex-start;
            padding: 0;
            border: none;
            background: none;
            cursor: pointer;
            font: inherit;
            font-size: 0.8125rem;
            color: var(--c--contextuals--content--semantic--brand--primary);
            &:focus-visible {
              outline: 2px solid
                var(--c--contextuals--border--semantic--brand--primary);
              outline-offset: 2px;
            }
          `}
        >
          <Icon
            iconName={isOpen ? 'expand_less' : 'expand_more'}
            $size="18px"
            $withThemeInherited
          />
          {isOpen ? t('See less') : t('See more ways')}
        </Box>
      )}
    </Box>
  );
};
