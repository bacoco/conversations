import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { useReward } from '../rewards/useReward';

import { Direction, ScreenActions, enterCss } from './CourseFrame';
import { SlideGate, SlideGateContext, SlideView } from './SlideView';
import type { Lesson } from './types';
import { useLearnProgressStore } from './useLearnProgressStore';

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
  const [direction, setDirection] = useState<Direction>('forward');
  // A screen with an exercise asks for its "Check" before going on.
  const [gate, setGate] = useState<SlideGate | null>(null);
  const move = (step: number) => {
    setDirection(step > 0 ? 'forward' : 'back');
    setIndex((current) => current + step);
  };
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
          padding: 22px 24px;
          border-radius: 14px;
          overflow: hidden;
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

        <Box key={index} $css={enterCss(direction)}>
          <SlideGateContext.Provider value={setGate}>
            <SlideView slide={slide} lessonId={lesson.id} index={index} />
          </SlideGateContext.Provider>
        </Box>
      </Box>

      <ScreenActions
        start={
          <Button
            color="neutral"
            variant="secondary"
            disabled={index === 0}
            onClick={() => move(-1)}
            icon={<Icon iconName="arrow_back" $size="18px" />}
          >
            {t('Previous')}
          </Button>
        }
      >
        {gate ? (
          <Button
            disabled={gate.disabled}
            onClick={gate.onClick}
            icon={<Icon iconName="check" $size="18px" />}
          >
            {gate.label}
          </Button>
        ) : (
          <Button
            onClick={isLast ? onDone : () => move(1)}
            iconPosition="right"
            icon={<Icon iconName="arrow_forward" $size="18px" />}
          >
            {isLast ? doneLabel : t('Next')}
          </Button>
        )}
      </ScreenActions>
    </Box>
  );
};
