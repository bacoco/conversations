import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { RichText } from './RichText';
import { AnnotatedRequest } from './SlideView';
import type { Step } from './steps';
import type { Lesson } from './types';
import { useLearnProgressStore } from './useLearnProgressStore';

const memoCardCss = css`
  padding: 12px 14px;
  border-radius: 12px;
  border: 1px solid var(--c--contextuals--border--surface--primary);
`;

const goodCss = css`
  display: block;
  white-space: pre-wrap;
  padding: 8px 10px;
  border-radius: 8px;
  font-style: italic;
  background: var(--c--contextuals--background--semantic--success--tertiary);
`;

/** What a lesson leaves: its key takeaways and its good examples. */
export const lessonMemo = (lesson: Lesson) => ({
  takeaways: lesson.slides
    .map((slide) => slide.keyTakeaway)
    .filter((text): text is string => Boolean(text)),
  examples: lesson.slides
    .map((slide) => slide.example?.good)
    .filter((text): text is string => Boolean(text)),
  annotated: lesson.slides.find(
    (slide) => slide.kind === 'annotated' && slide.parts,
  )?.parts,
});

/** The memo of a step: one page to keep the essentials at hand. */
export const StepMemo = ({ step }: { step: Step }) => {
  const { t } = useTranslation();
  const memo = lessonMemo(step.lesson);
  return (
    <Box $gap="12px">
      {memo.takeaways.length > 0 && (
        <Box $gap="8px" $css={memoCardCss}>
          <Text $size="sm" $weight="700">
            {t('To remember')}
          </Text>
          <Box as="ul" $gap="6px" $css="margin: 0; padding-left: 18px;">
            {memo.takeaways.map((text) => (
              <Text as="li" key={text} $size="sm" $css="display: list-item;">
                {text}
              </Text>
            ))}
          </Box>
        </Box>
      )}
      {memo.annotated && (
        <Box $gap="8px" $css={memoCardCss}>
          <Text $size="sm" $weight="700">
            {t('A complete request, brick by brick')}
          </Text>
          <AnnotatedRequest parts={memo.annotated} />
        </Box>
      )}
      {memo.examples.length > 0 && (
        <Box $gap="8px" $css={memoCardCss}>
          <Text $size="sm" $weight="700">
            {t('Requests that work')}
          </Text>
          {memo.examples.map((text) => (
            <Text key={text} $size="sm" $css={goodCss}>
              « {text} »
            </Text>
          ))}
        </Box>
      )}
    </Box>
  );
};

/** The screens the learner kept, to read them again at any time. */
export const MyMemo = ({
  steps,
  onOpenStep,
}: {
  steps: Step[];
  onOpenStep: (lessonId: string) => void;
}) => {
  const { t } = useTranslation();
  const saved = useLearnProgressStore((state) => state.savedScreens);
  const toggleSaved = useLearnProgressStore((state) => state.toggleSavedScreen);
  const screens = saved
    .map((key) => {
      const [lessonId, index] = key.split(':');
      const step = steps.find((s) => s.lesson.id === lessonId);
      const slide = step?.lesson.slides[Number(index)];
      return step && slide ? { step, slide, index: Number(index) } : null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  if (screens.length === 0) {
    return (
      <Text $size="sm" $variation="secondary">
        {t(
          'Nothing kept yet. On a screen of a lesson, the bookmark keeps it here.',
        )}
      </Text>
    );
  }
  return (
    <Box as="ul" $gap="10px" $css="margin: 0; padding: 0; list-style: none;">
      {screens.map(({ step, slide, index }) => (
        <Box
          as="li"
          key={`${step.lesson.id}:${index}`}
          $gap="8px"
          $css={memoCardCss}
        >
          <Box $direction="row" $align="center" $gap="8px">
            <Box $css="flex: 1; min-width: 0;">
              <Text $size="xs" $variation="secondary">
                {t('Step {{number}}', { number: step.number })}
              </Text>
              <Text $weight="700">{slide.title}</Text>
            </Box>
            <Button
              size="small"
              color="neutral"
              variant="tertiary"
              onClick={() => toggleSaved(step.lesson.id, index)}
              aria-label={t('Remove from my memo')}
              icon={<Icon iconName="bookmark_remove" $size="18px" />}
            />
          </Box>
          <RichText text={slide.content} />
          {slide.parts && slide.kind === 'annotated' && (
            <AnnotatedRequest parts={slide.parts} />
          )}
          {slide.example?.good && (
            <Text $size="sm" $css={goodCss}>
              « {slide.example.good} »
            </Text>
          )}
          {slide.keyTakeaway && (
            <Text $size="sm" $weight="600">
              {slide.keyTakeaway}
            </Text>
          )}
          <Box $direction="row">
            <Button
              size="small"
              color="neutral"
              variant="tertiary"
              onClick={() => onOpenStep(step.lesson.id)}
            >
              {t('Open the step')}
            </Button>
          </Box>
        </Box>
      ))}
    </Box>
  );
};
