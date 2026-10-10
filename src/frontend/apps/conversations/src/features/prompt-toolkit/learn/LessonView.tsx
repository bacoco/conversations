import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { NESTOR_LESSONS_URL } from '../components/PanelHome';
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

/** One lesson as a sequence of slide cards; reaching the end marks it done. */
export const LessonView = ({
  lesson,
  lessonNumber,
  onBack,
  onQuiz,
  hasQuiz,
}: {
  lesson: Lesson;
  lessonNumber: number;
  onBack: () => void;
  onQuiz: () => void;
  hasQuiz: boolean;
}) => {
  const { t } = useTranslation();
  const completeLesson = useLearnProgressStore((state) => state.completeLesson);
  const reward = useReward();
  const setSlidePosition = useLearnProgressStore(
    (state) => state.setSlidePosition,
  );
  // Resume at the slide the user left, unless the lesson was finished.
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

  // Each slide starts at the top of the panel, and is remembered.
  useEffect(() => {
    topRef.current?.scrollIntoView?.({ block: 'nearest' });
    setSlidePosition(lesson.id, index);
  }, [index, lesson.id, setSlidePosition]);

  return (
    <Box $css="min-height: 100%;">
      <Box ref={topRef} $css="flex: 1;">
        <Box
          $direction="row"
          $align="center"
          $gap="12px"
          $css="padding: 16px 16px 8px;"
        >
          <Button
            size="small"
            color="neutral"
            variant="tertiary"
            onClick={onBack}
            aria-label={t('Back to the lessons')}
            icon={<Icon iconName="arrow_back" $size="18px" />}
          />
          <img
            src={NESTOR_LESSONS_URL}
            alt=""
            width={52}
            height={52}
            style={{ flex: 'none', borderRadius: '50%', background: '#f7f8fd' }}
          />
          <Box $css="flex: 1; min-width: 0;">
            <Text $size="xs" $variation="secondary">
              {t('Lesson {{number}}', { number: lessonNumber })}
            </Text>
            <Text $weight="700" $ellipsis>
              {lesson.title}
            </Text>
          </Box>
        </Box>

        {/* The slide sits in the middle of the space, in a calm column. */}
        <Box
          $gap="20px"
          $css={css`
            flex: 1;
            justify-content: center;
            width: 100%;
            max-width: 520px;
            margin-inline: auto;
            padding: 16px 20px 32px;
          `}
        >
          <Box
            role="progressbar"
            aria-label={t('Slide {{current}} of {{total}}', {
              current: index + 1,
              total: lesson.slides.length,
            })}
            aria-valuemin={1}
            aria-valuemax={lesson.slides.length}
            aria-valuenow={index + 1}
            $direction="row"
            $gap="4px"
          >
            {lesson.slides.map((_, dot) => (
              <Box
                key={dot}
                $css={css`
                  flex: 1;
                  min-width: 0;
                  height: 4px;
                  border-radius: 2px;
                  transition: background 0.2s ease;
                  background: ${
                    dot <= index
                      ? 'var(--c--contextuals--background--semantic--brand--primary)'
                      : 'var(--c--contextuals--border--surface--primary)'
                  };
                `}
              />
            ))}
          </Box>

          <Box
            as="section"
            aria-live="polite"
            $gap="16px"
            $css={css`
              padding: 18px;
              border-radius: 12px;
              border: 1px solid var(--c--contextuals--border--surface--primary);
              background: var(--c--contextuals--background--surface--primary);
            `}
          >
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
                  border-left: 4px solid
                    var(--c--contextuals--border--semantic--brand--primary);
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
        </Box>
      </Box>

      {/* Navigation stays at hand at the bottom of the panel. */}
      <Box
        $direction="row"
        $align="center"
        $justify="space-between"
        $gap="8px"
        $css={css`
          position: sticky;
          bottom: 0;
          /* Room on the right for Nestor's round button. */
          padding: 12px 84px 12px 16px;
          border-top: 1px solid var(--c--contextuals--border--surface--primary);
          background: var(--c--contextuals--background--surface--primary);
        `}
      >
        <Button
          color="neutral"
          variant="tertiary"
          disabled={index === 0}
          onClick={() => setIndex((current) => current - 1)}
          icon={<Icon iconName="chevron_left" $size="18px" />}
        >
          {t('Previous')}
        </Button>
        <Text $size="sm" $variation="secondary" aria-hidden="true">
          {index + 1} / {lesson.slides.length}
        </Text>
        {isLast ? (
          hasQuiz ? (
            <Button
              onClick={onQuiz}
              icon={<Icon iconName="quiz" $size="18px" />}
            >
              {t('Quiz')}
            </Button>
          ) : (
            <Button onClick={onBack}>{t('Finish')}</Button>
          )
        ) : (
          <Button
            onClick={() => setIndex((current) => current + 1)}
            iconPosition="right"
            icon={<Icon iconName="chevron_right" $size="18px" />}
          >
            {t('Next')}
          </Button>
        )}
      </Box>
    </Box>
  );
};
