import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { useAiAvailable } from '../coach/aiAvailability';
import { NESTOR_CARDS_URL, NESTOR_COURSE_URL } from '../components/PanelHome';
import {
  usePromptToolkitStore,
  useSectionReset,
} from '../stores/usePromptToolkitStore';

import { CoachHabits } from './CoachHabits';
import { CardsResult, FlashcardsView } from './FlashcardsView';
import { ManageProgressView } from './ManageProgressView';
import { QuizView } from './QuizView';
import { StepView, useStageLabels } from './StepView';
import { getChallenges } from './challenges';
import { getCourseContent } from './content';
import {
  Step,
  buildSteps,
  cardsToReview,
  isStepDone,
  isStepStarted,
  nextStage,
  nextStep,
} from './steps';
import type { Flashcard } from './types';
import { useLearnProgress } from './useLearnProgress';
import { FULL_QUIZ, useLearnProgressStore } from './useLearnProgressStore';

type View =
  | { name: 'path' }
  | { name: 'all' }
  | { name: 'step'; lessonId: string }
  | { name: 'review'; cards: Flashcard[] }
  | { name: 'quiz' }
  | { name: 'manage' };

const ILLUSTRATION_BACKGROUND = '#f7f8fd';

const rowCss = (isCurrent: boolean) => css`
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
  font: inherit;
  color: inherit;
  text-align: left;
  border: 1px solid
    ${
      isCurrent
        ? 'var(--c--contextuals--border--semantic--brand--secondary)'
        : 'transparent'
    };
  background: ${
    isCurrent
      ? 'var(--c--contextuals--background--semantic--brand--tertiary)'
      : 'transparent'
  };
  &:hover {
    background: var(--c--contextuals--background--surface--secondary);
  }
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 2px;
  }
`;

const badgeCss = (state: 'done' | 'current' | 'todo') => css`
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  box-sizing: border-box;
  font-size: 0.875rem;
  font-weight: 700;
  border: 2px solid
    ${
      state === 'todo'
        ? 'var(--c--contextuals--border--surface--primary)'
        : 'transparent'
    };
  color: ${
    state === 'done'
      ? 'var(--c--contextuals--content--semantic--success--primary)'
      : state === 'current'
        ? 'var(--c--contextuals--content--semantic--brand--on-brand)'
        : 'var(--c--contextuals--content--semantic--neutral--secondary)'
  };
  background: ${
    state === 'done'
      ? 'var(--c--contextuals--background--semantic--success--tertiary)'
      : state === 'current'
        ? 'var(--c--contextuals--background--semantic--brand--primary)'
        : 'var(--c--contextuals--background--surface--primary)'
  };
`;

/**
 * About how long a step takes, in minutes: a screen read, a card turned, a
 * question answered, an exercise. An order of magnitude, shown as such.
 */
export const stepMinutes = (step: Step) =>
  Math.max(
    2,
    Math.round(
      step.lesson.slides.length * 0.7 +
        (step.stages.includes('cards') ? step.cards.length * 0.3 : 0) +
        (step.stages.includes('quiz') ? step.quiz.length * 0.4 : 0) +
        (step.challenge ? 2 : step.practiseWithCoach ? 1 : 0),
    ),
  );

/**
 * The prompting course, one thing at a time: the step to do now, and one
 * button. The whole course (the eight steps, what the coach saw, the full
 * quiz, the progress) is one click away, never in the way.
 */
export const LearnPanel = () => {
  const { t, i18n } = useTranslation();
  const course = useMemo(
    () => getCourseContent(i18n.language),
    [i18n.language],
  );
  // Practice is graded or guided by the coach: none without the Albert relay.
  const isAiAvailable = useAiAvailable();
  const steps = useMemo(
    () => buildSteps(course, getChallenges(i18n.language), isAiAvailable),
    [course, i18n.language, isAiAvailable],
  );
  const progress = useLearnProgress();
  const bestQuizScores = progress.bestQuizScores;
  const setSlidePosition = useLearnProgressStore(
    (state) => state.setSlidePosition,
  );
  const labels = useStageLabels();
  const [view, setView] = useState<View>({ name: 'path' });
  const [reviewResult, setReviewResult] = useState<CardsResult | null>(null);
  const back = () => setView({ name: 'path' });
  const openStep = (lessonId: string) => setView({ name: 'step', lessonId });
  // Progress is reset item by item, with a confirmation.
  useSectionReset('learn', () => setView({ name: 'manage' }));

  // A lesson asked from elsewhere in the panel opens its step.
  const lessonRequest = usePromptToolkitStore((state) => state.lessonRequest);
  const clearLessonRequest = usePromptToolkitStore(
    (state) => state.clearLessonRequest,
  );
  useEffect(() => {
    if (lessonRequest) {
      setView({ name: 'step', lessonId: lessonRequest });
      clearLessonRequest();
    }
  }, [lessonRequest, clearLessonRequest]);

  if (view.name === 'step') {
    const step = steps.find((s) => s.lesson.id === view.lessonId);
    if (step) {
      return (
        <StepView
          key={step.lesson.id}
          step={step}
          steps={steps}
          onBack={back}
          onOpenStep={openStep}
          onFullQuiz={() => setView({ name: 'quiz' })}
        />
      );
    }
  }

  if (view.name === 'quiz') {
    return (
      <QuizView
        scope={FULL_QUIZ}
        title={t('The whole course')}
        questions={course.quiz}
        onBack={back}
      />
    );
  }

  if (view.name === 'manage') {
    return <ManageProgressView course={course} onBack={back} />;
  }

  if (view.name === 'review') {
    return (
      <Box $gap="16px" $css="padding: 12px 16px 96px;">
        <Box $direction="row">
          <Button
            size="small"
            color="neutral"
            variant="tertiary"
            onClick={back}
            icon={<Icon iconName="arrow_back" $size="18px" />}
          >
            {t('Back to the course')}
          </Button>
        </Box>
        <Text as="h2" $size="lg" $weight="800" $margin="0">
          {t('Review in 2 minutes')}
        </Text>
        {reviewResult ? (
          <Box $gap="14px" $align="center" $css="text-align: center;">
            <img
              src={NESTOR_CARDS_URL}
              alt=""
              width={120}
              height={120}
              style={{
                borderRadius: '50%',
                background: ILLUSTRATION_BACKGROUND,
              }}
            />
            <Text $weight="700">{t('Review done')}</Text>
            <Text $size="sm">
              {[
                t('{{known}} cards known out of {{total}}', {
                  known: reviewResult.known,
                  total: view.cards.length,
                }),
                reviewResult.toReview
                  ? t('{{count}} to review later', {
                      count: reviewResult.toReview,
                    })
                  : '',
              ]
                .filter(Boolean)
                .join(' · ')}
            </Text>
            <Button fullWidth onClick={back}>
              {t('Back to the course')}
            </Button>
          </Box>
        ) : (
          <FlashcardsView cards={view.cards} onDone={setReviewResult} />
        )}
      </Box>
    );
  }

  const next = nextStep(steps, progress);
  const doneCount = steps.filter((step) => isStepDone(step, progress)).length;
  const toReview = cardsToReview(steps, progress);
  const nextStarted = next !== null && isStepStarted(next, progress);
  const stage = next ? nextStage(next, progress) : null;

  const backRow = (
    <Box $direction="row">
      <Button
        size="small"
        color="neutral"
        variant="tertiary"
        onClick={back}
        icon={<Icon iconName="arrow_back" $size="18px" />}
      >
        {t('Back to the course')}
      </Button>
    </Box>
  );

  if (view.name === 'all') {
    return (
      <Box $gap="18px" $css="padding: 12px 16px 96px;">
        {backRow}
        <Box $direction="row" $align="baseline" $justify="space-between">
          <Text as="h2" $size="lg" $weight="800" $margin="0">
            {t('The whole course')}
          </Text>
          <Text $size="xs" $variation="secondary">
            {t('{{done}} of {{total}} steps completed', {
              done: doneCount,
              total: steps.length,
            })}
          </Text>
        </Box>
        <Box
          as="ol"
          aria-label={t('The steps of the course')}
          $gap="2px"
          $css="margin: 0; padding: 0; list-style: none;"
        >
          {steps.map((step) => {
            const isDone = isStepDone(step, progress);
            const isCurrent = !isDone && next?.lesson.id === step.lesson.id;
            const stepStage = nextStage(step, progress);
            const isStarted = isStepStarted(step, progress);
            return (
              <li key={step.lesson.id}>
                <Box
                  as="button"
                  type="button"
                  aria-current={isCurrent ? 'step' : undefined}
                  onClick={() => openStep(step.lesson.id)}
                  $direction="row"
                  $align="center"
                  $gap="12px"
                  $css={rowCss(isCurrent)}
                >
                  <Box
                    $align="center"
                    $justify="center"
                    $css={badgeCss(
                      isDone ? 'done' : isCurrent ? 'current' : 'todo',
                    )}
                  >
                    {isDone ? (
                      <Icon iconName="check" $size="16px" $withThemeInherited />
                    ) : (
                      step.number
                    )}
                  </Box>
                  <Box $gap="2px" $css="flex: 1; min-width: 0;">
                    <Text $size="sm" $weight={isCurrent ? '700' : '600'}>
                      {step.lesson.title}
                    </Text>
                    {(isDone || (isStarted && stepStage)) && (
                      <Text
                        $size="xs"
                        $theme={isDone ? undefined : 'brand'}
                        $variation={isDone ? 'secondary' : undefined}
                      >
                        {isDone
                          ? t('Completed')
                          : t('In progress · {{stage}}', {
                              stage: stepStage ? labels[stepStage] : '',
                            })}
                      </Text>
                    )}
                  </Box>
                  <Icon
                    iconName="chevron_right"
                    $size="20px"
                    $variation="secondary"
                  />
                </Box>
              </li>
            );
          })}
        </Box>

        {isAiAvailable && (
          <CoachHabits
            steps={steps}
            onOpenStep={(lessonId, slide) => {
              setSlidePosition(lessonId, slide);
              openStep(lessonId);
            }}
          />
        )}

        <Box
          $direction="row"
          $justify="space-between"
          $gap="12px"
          $css="flex-wrap: wrap;"
        >
          <Button
            size="small"
            color="neutral"
            variant="tertiary"
            onClick={() => setView({ name: 'quiz' })}
            icon={<Icon iconName="emoji_events" $size="18px" />}
          >
            {bestQuizScores[FULL_QUIZ] === undefined
              ? t('The full quiz · {{count}} questions', {
                  count: course.quiz.length,
                })
              : t('The full quiz · best: {{score}}%', {
                  score: bestQuizScores[FULL_QUIZ],
                })}
          </Button>
          <Button
            size="small"
            color="neutral"
            variant="tertiary"
            onClick={() => setView({ name: 'manage' })}
            icon={<Icon iconName="tune" $size="18px" />}
          >
            {t('Manage my progress')}
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box
      $align="center"
      $gap="16px"
      $css={css`
        min-height: 100%;
        justify-content: center;
        padding: 24px 20px 96px;
        text-align: center;
      `}
    >
      <img
        src={NESTOR_COURSE_URL}
        alt=""
        width={140}
        height={140}
        style={{ borderRadius: '50%', background: ILLUSTRATION_BACKGROUND }}
      />
      {next ? (
        <>
          <Box $gap="6px" $align="center">
            <Text
              $size="xs"
              $weight="700"
              $theme="brand"
              $css="text-transform: uppercase; letter-spacing: 0.06em;"
            >
              {nextStarted ? t('To resume') : t('Your next lesson')}
            </Text>
            <Text as="h2" $size="h4" $weight="800" $margin="0">
              {next.lesson.title}
            </Text>
            <Text $variation="secondary">
              {nextStarted && stage
                ? t('About {{count}} min · you are at: {{stage}}', {
                    count: stepMinutes(next),
                    stage: labels[stage].toLocaleLowerCase(),
                  })
                : t('About {{count}} min', { count: stepMinutes(next) })}
            </Text>
          </Box>
          <Box $css="width: 100%; max-width: 320px;">
            <Button
              fullWidth
              onClick={() => openStep(next.lesson.id)}
              icon={<Icon iconName="play_arrow" $size="20px" />}
            >
              {nextStarted ? t('Resume') : t('Start')}
            </Button>
          </Box>
        </>
      ) : (
        <Box $gap="10px" $align="center">
          <Text as="h2" $size="h4" $weight="800" $margin="0">
            {t('Path completed, congratulations!')}
          </Text>
          <Button onClick={() => setView({ name: 'quiz' })}>
            {t('Take the full quiz')}
          </Button>
        </Box>
      )}

      {/* Where the user is, without a list: one dot per step. */}
      <Box
        role="img"
        aria-label={t('{{done}} of {{total}} steps completed', {
          done: doneCount,
          total: steps.length,
        })}
        $direction="row"
        $gap="6px"
      >
        {steps.map((step) => {
          const isDone = isStepDone(step, progress);
          const isNext = next?.lesson.id === step.lesson.id;
          return (
            <Box
              key={step.lesson.id}
              $css={css`
                width: ${isNext ? 18 : 8}px;
                height: 8px;
                border-radius: 4px;
                background: ${
                  isDone
                    ? 'var(--c--contextuals--background--semantic--success--primary)'
                    : isNext
                      ? 'var(--c--contextuals--background--semantic--brand--primary)'
                      : 'var(--c--contextuals--border--surface--primary)'
                };
              `}
            />
          );
        })}
      </Box>

      <Box
        $direction="row"
        $gap="8px"
        $justify="center"
        $css="flex-wrap: wrap;"
      >
        {toReview.length > 0 && (
          <Button
            size="small"
            color="neutral"
            variant="tertiary"
            onClick={() => {
              setReviewResult(null);
              setView({ name: 'review', cards: toReview });
            }}
            icon={<Icon iconName="style" $size="18px" />}
          >
            {t('Review {{count}} cards', { count: toReview.length })}
          </Button>
        )}
        <Button
          size="small"
          color="neutral"
          variant="tertiary"
          onClick={() => setView({ name: 'all' })}
          icon={<Icon iconName="list" $size="18px" />}
        >
          {t('See the whole course')}
        </Button>
      </Box>
    </Box>
  );
};
