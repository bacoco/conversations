import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { useReward } from '../rewards/useReward';

import { RichText } from './RichText';
import type { Lesson } from './types';
import { useLearnProgressStore } from './useLearnProgressStore';

const exampleCss = (tone: 'error' | 'success') => css`
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--c--contextuals--border--semantic--${tone}--secondary);
  background: var(--c--contextuals--background--semantic--${tone}--tertiary);
`;

/**
 * "Read", the first time of a step: one screen at a time; reaching the last
 * one marks the lesson read, then the step goes on.
 */
export const LessonView = ({
  lesson,
  doneLabel,
  onDone,
}: {
  lesson: Lesson;
  /** The button on the last screen, e.g. "Continue: remember". */
  doneLabel: string;
  onDone: () => void;
}) => {
  const { t } = useTranslation();
  const completeLesson = useLearnProgressStore((state) => state.completeLesson);
  const reward = useReward();
  const setSlidePosition = useLearnProgressStore(
    (state) => state.setSlidePosition,
  );
  // Resume at the screen the user left, unless the lesson was finished.
  const [index, setIndex] = useState(() => {
    const saved =
      useLearnProgressStore.getState().slidePositions[lesson.id] ?? 0;
    return saved < lesson.slides.length - 1 ? saved : 0;
  });
  const topRef = useRef<HTMLDivElement | null>(null);
  const slide = lesson.slides[index];
  const isLast = index === lesson.slides.length - 1;

  useEffect(() => {
    if (!isLast) {
      return;
    }
    // Points only the first time the lesson is finished.
    const isNew = !useLearnProgressStore
      .getState()
      .completedLessons.includes(lesson.id);
    completeLesson(lesson.id);
    if (isNew) {
      reward('lesson');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLast, lesson.id, completeLesson]);

  // Each screen starts at the top of the panel, and is remembered.
  useEffect(() => {
    topRef.current?.scrollIntoView?.({ block: 'nearest' });
    setSlidePosition(lesson.id, index);
  }, [index, lesson.id, setSlidePosition]);

  return (
    <Box ref={topRef} $gap="14px" $css="scroll-margin-top: 120px;">
      <Box
        as="article"
        aria-live="polite"
        $gap="14px"
        $css={css`
          padding: 18px;
          border-radius: 14px;
          border: 1px solid var(--c--contextuals--border--surface--primary);
          background: var(--c--contextuals--background--surface--primary);
        `}
      >
        <Box $direction="row" $align="center" $justify="space-between">
          <Text $size="sm" $variation="secondary">
            {t('Screen {{current}} of {{total}}', {
              current: index + 1,
              total: lesson.slides.length,
            })}
          </Text>
          <Box aria-hidden="true" $direction="row" $gap="6px">
            {lesson.slides.map((_, dot) => (
              <Box
                key={dot}
                $css={css`
                  width: ${dot === index ? 20 : 8}px;
                  height: 8px;
                  border-radius: 4px;
                  transition: width 0.2s ease;
                  background: ${
                    dot <= index
                      ? 'var(--c--contextuals--background--semantic--brand--primary)'
                      : 'var(--c--contextuals--border--surface--primary)'
                  };
                  @media (prefers-reduced-motion: reduce) {
                    transition: none;
                  }
                `}
              />
            ))}
          </Box>
        </Box>

        <Box $direction="row" $align="center" $gap="12px">
          <Box
            aria-hidden="true"
            $align="center"
            $justify="center"
            $css={css`
              flex: none;
              width: 44px;
              height: 44px;
              border-radius: 12px;
              font-size: 1.5rem;
              background: var(
                --c--contextuals--background--semantic--brand--tertiary
              );
            `}
          >
            {slide.icon}
          </Box>
          <Text as="h3" $size="lg" $weight="700" $margin="0">
            {slide.title}
          </Text>
        </Box>

        <RichText text={slide.content} />

        {(slide.example?.bad || slide.example?.good) && (
          <Box $gap="8px">
            {slide.example?.bad && (
              <Box $gap="6px" $css={exampleCss('error')}>
                <Box $direction="row" $align="center" $gap="6px">
                  <Icon iconName="close" $size="16px" $theme="error" />
                  <Text $size="xs" $weight="700" $theme="error">
                    {t('To avoid')}
                  </Text>
                </Box>
                <Text $size="sm" $css="font-style: italic;">
                  « {slide.example.bad} »
                </Text>
              </Box>
            )}
            {slide.example?.good && (
              <Box $gap="6px" $css={exampleCss('success')}>
                <Box $direction="row" $align="center" $gap="6px">
                  <Icon iconName="check" $size="16px" $theme="success" />
                  <Text $size="xs" $weight="700" $theme="success">
                    {t('Better')}
                  </Text>
                </Box>
                <Text $size="sm" $css="font-style: italic;">
                  « {slide.example.good} »
                </Text>
              </Box>
            )}
            {slide.example?.note && (
              <Text $size="xs" $variation="secondary">
                {slide.example.note}
              </Text>
            )}
          </Box>
        )}

        {slide.keyTakeaway && (
          <Box
            $direction="row"
            $gap="10px"
            $css={css`
              padding: 12px 14px;
              border-radius: 10px;
              background: var(
                --c--contextuals--background--semantic--brand--tertiary
              );
            `}
          >
            <Icon iconName="lightbulb" $size="20px" $theme="brand" />
            <Box $gap="2px">
              <Text $size="xs" $weight="700" $theme="brand">
                {t('Key takeaway')}
              </Text>
              <Text $size="sm" $weight="600">
                {slide.keyTakeaway}
              </Text>
            </Box>
          </Box>
        )}
      </Box>

      <Box
        $css={css`
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        `}
      >
        <Button
          fullWidth
          color="neutral"
          variant="secondary"
          disabled={index === 0}
          onClick={() => setIndex((current) => current - 1)}
          icon={<Icon iconName="arrow_back" $size="18px" />}
        >
          {t('Previous')}
        </Button>
        {isLast ? (
          <Button
            fullWidth
            onClick={onDone}
            iconPosition="right"
            icon={<Icon iconName="arrow_forward" $size="18px" />}
          >
            {doneLabel}
          </Button>
        ) : (
          <Button
            fullWidth
            onClick={() => setIndex((current) => current + 1)}
            iconPosition="right"
            icon={<Icon iconName="arrow_forward" $size="18px" />}
          >
            {t('Next')}
          </Button>
        )}
      </Box>
    </Box>
  );
};
