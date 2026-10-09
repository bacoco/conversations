import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import {
  ROBIN_CARDS_URL,
  ROBIN_CHALLENGES_URL,
  ROBIN_LESSONS_URL,
  ROBIN_QUIZ_URL,
} from '../components/PanelHome';
import { SpaceIntro } from '../components/SpaceIntro';
import {
  usePromptToolkitStore,
  useSectionReset,
} from '../stores/usePromptToolkitStore';

import { ChallengeView } from './ChallengeView';
import { FlashcardsView } from './FlashcardsView';
import { LessonView } from './LessonView';
import { ManageProgressView } from './ManageProgressView';
import { QuizView } from './QuizView';
import { getChallenges } from './challenges';
import { getCourseContent } from './content';
import {
  FULL_QUIZ,
  LearnTab,
  useLearnProgressStore,
} from './useLearnProgressStore';

type Detail =
  | { name: 'lesson'; lessonId: string }
  | { name: 'quiz'; scope: string }
  | { name: 'manage' }
  | { name: 'challenge'; id: string };

const RING_SIZE = 64;
const RING_STROKE = 6;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

const tabCss = (isActive: boolean) => css`
  flex: 1;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 34px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font: inherit;
  font-size: 0.875rem;
  font-weight: ${isActive ? 600 : 400};
  color: ${
    isActive
      ? 'var(--c--contextuals--content--semantic--brand--primary)'
      : 'var(--c--contextuals--content--semantic--neutral--secondary)'
  };
  background: ${
    isActive
      ? 'var(--c--contextuals--background--semantic--brand--tertiary)'
      : 'transparent'
  };
  &:hover {
    color: var(--c--contextuals--content--semantic--brand--primary);
  }
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 1px;
  }
`;

const rowCss = css`
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
  color: inherit;
  text-align: left;
  border: 1px solid transparent;
  background: transparent;
  &:hover {
    border-color: var(--c--contextuals--border--surface--primary);
    background: var(--c--contextuals--background--surface--secondary);
  }
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 2px;
  }
`;

/** A vertical path joining numbered steps. */
const pathCss = css`
  position: relative;
  margin: 0;
  padding: 0;
  list-style: none;
  &::before {
    content: '';
    position: absolute;
    top: 24px;
    bottom: 24px;
    left: 26px;
    width: 2px;
    background: var(--c--contextuals--border--surface--primary);
  }
`;

const stepCss = (state: 'done' | 'next' | 'todo') => css`
  position: relative;
  z-index: 1;
  flex: none;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  font-size: 0.8125rem;
  font-weight: 700;
  color: ${
    state === 'done'
      ? 'var(--c--contextuals--content--semantic--success--on-success)'
      : state === 'next'
        ? 'var(--c--contextuals--content--semantic--brand--on-brand)'
        : 'var(--c--contextuals--content--semantic--neutral--secondary)'
  };
  background: ${
    state === 'done'
      ? 'var(--c--contextuals--background--semantic--success--primary)'
      : state === 'next'
        ? 'var(--c--contextuals--background--semantic--brand--primary)'
        : 'var(--c--contextuals--background--surface--primary)'
  };
  border: 2px solid
    ${
      state === 'todo'
        ? 'var(--c--contextuals--border--surface--primary)'
        : 'transparent'
    };
`;

/** The prompting course: a learning path, review cards and quizzes. */
export const LearnPanel = () => {
  const { t, i18n } = useTranslation();
  const course = useMemo(
    () => getCourseContent(i18n.language),
    [i18n.language],
  );
  const {
    completedLessons,
    bestQuizScores,
    lastTab: tab,
    setLastTab: setTab,
  } = useLearnProgressStore();
  const [detail, setDetail] = useState<Detail | null>(null);
  const challenges = useMemo(
    () => getChallenges(i18n.language),
    [i18n.language],
  );
  const completedChallenges = useLearnProgressStore(
    (state) => state.completedChallenges,
  );
  const back = () => setDetail(null);
  // Progress is reset item by item, with a confirmation.
  useSectionReset('learn', () => setDetail({ name: 'manage' }));

  // A lesson asked from the coach ("to make progress in…").
  const lessonRequest = usePromptToolkitStore((state) => state.lessonRequest);
  const clearLessonRequest = usePromptToolkitStore(
    (state) => state.clearLessonRequest,
  );
  useEffect(() => {
    if (lessonRequest) {
      setDetail({ name: 'lesson', lessonId: lessonRequest });
      clearLessonRequest();
    }
  }, [lessonRequest, clearLessonRequest]);

  if (detail?.name === 'lesson') {
    const position = course.lessons.findIndex((l) => l.id === detail.lessonId);
    const lesson = course.lessons[position];
    return (
      <LessonView
        key={lesson.id}
        lesson={lesson}
        lessonNumber={position + 1}
        onBack={back}
        hasQuiz={course.quiz.some((q) => q.lessonId === lesson.id)}
        onQuiz={() => setDetail({ name: 'quiz', scope: lesson.id })}
      />
    );
  }

  if (detail?.name === 'challenge') {
    const challenge = challenges.find((c) => c.id === detail.id);
    if (challenge) {
      return (
        <ChallengeView key={challenge.id} challenge={challenge} onBack={back} />
      );
    }
  }

  if (detail?.name === 'manage') {
    return <ManageProgressView course={course} onBack={back} />;
  }

  if (detail?.name === 'quiz') {
    const lesson = course.lessons.find((l) => l.id === detail.scope);
    return (
      <QuizView
        key={detail.scope}
        scope={detail.scope}
        title={lesson ? lesson.title : t('The whole course')}
        questions={
          lesson
            ? course.quiz.filter((q) => q.lessonId === lesson.id)
            : course.quiz
        }
        onBack={back}
      />
    );
  }

  const doneCount = course.lessons.filter((l) =>
    completedLessons.includes(l.id),
  ).length;
  const nextIndex = course.lessons.findIndex(
    (l) => !completedLessons.includes(l.id),
  );
  const nextLesson = nextIndex === -1 ? null : course.lessons[nextIndex];
  const ratio = doneCount / course.lessons.length;
  const intros: Record<
    LearnTab,
    { image: string; title: string; text: string; steps: string[] }
  > = {
    lessons: {
      image: ROBIN_LESSONS_URL,
      title: t('Lessons'),
      text: t('Short lessons to learn how to write a good prompt.'),
      steps: [
        t('Start with lesson 1: they follow on from each other.'),
        t('Each lesson takes a few slides.'),
        t('Your progress updates with each lesson completed.'),
      ],
    },
    cards: {
      image: ROBIN_CARDS_URL,
      title: t('Cards'),
      text: t('Review the essentials in a few minutes.'),
      steps: [
        t('Read the question on the card.'),
        t('Click the card to see the answer.'),
        t('Say whether you knew it or whether to review it.'),
      ],
    },
    quiz: {
      image: ROBIN_QUIZ_URL,
      title: t('Quiz'),
      text: t('Check what you remember.'),
      steps: [
        t('Take the full quiz or the quiz of one lesson.'),
        t('Answer the questions.'),
        t('See the right answer after each question.'),
      ],
    },
    challenges: {
      image: ROBIN_CHALLENGES_URL,
      title: t('Challenges'),
      text: t('Practise on real cases.'),
      steps: [
        t('Choose a challenge.'),
        t('Fix the weak prompt it gives you.'),
        t('The coach grades your version and gives you advice.'),
      ],
    },
  };
  const tabs: { id: LearnTab; icon: string; label: string }[] = [
    { id: 'lessons', icon: 'menu_book', label: t('Lessons') },
    { id: 'cards', icon: 'style', label: t('Cards') },
    { id: 'quiz', icon: 'quiz', label: t('Quiz') },
    { id: 'challenges', icon: 'sports_score', label: t('Challenges') },
  ];

  return (
    <Box $gap="16px" $padding={{ all: 'base' }}>
      <Box
        role="tablist"
        aria-label={t('Prompting course')}
        $direction="row"
        $gap="4px"
        $css={css`
          padding: 4px;
          border-radius: 8px;
          border: 1px solid var(--c--contextuals--border--surface--primary);
        `}
      >
        {tabs.map((item) => (
          <Box
            key={item.id}
            as="button"
            type="button"
            role="tab"
            aria-selected={tab === item.id}
            onClick={() => setTab(item.id)}
            $direction="row"
            $css={tabCss(tab === item.id)}
          >
            <Icon iconName={item.icon} $size="18px" $withThemeInherited />
            {item.label}
          </Box>
        ))}
      </Box>

      {/* Like the coach: the intro follows the selected tab. */}
      <SpaceIntro key={tab} {...intros[tab]} />

      {/* Lesson progress and the next step, at the top of the lessons. */}
      {tab === 'lessons' && (
        <Box
          $direction="row"
          $align="center"
          $gap="14px"
          $css={css`
            padding: 14px;
            border-radius: 12px;
            background: var(
              --c--contextuals--background--semantic--brand--tertiary
            );
          `}
        >
          <Box
            role="img"
            aria-label={t('{{done}} of {{total}} lessons completed', {
              done: doneCount,
              total: course.lessons.length,
            })}
            $css={`position: relative; flex: none; width: ${RING_SIZE}px; height: ${RING_SIZE}px;`}
          >
            <svg width={RING_SIZE} height={RING_SIZE} aria-hidden="true">
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                fill="none"
                stroke="var(--c--contextuals--border--surface--primary)"
                strokeWidth={RING_STROKE}
              />
              <circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_RADIUS}
                fill="none"
                stroke="var(--c--contextuals--background--semantic--success--primary)"
                strokeWidth={RING_STROKE}
                strokeLinecap="round"
                strokeDasharray={RING_LENGTH}
                strokeDashoffset={RING_LENGTH * (1 - ratio)}
                transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
              />
            </svg>
            <Box
              aria-hidden="true"
              $align="center"
              $justify="center"
              $css="position: absolute; inset: 0; font-weight: 700;"
            >
              {doneCount}/{course.lessons.length}
            </Box>
          </Box>
          <Box $gap="6px" $css="flex: 1; min-width: 0;">
            <Text $weight="700">
              {nextLesson
                ? t('Your progress')
                : t('Course completed, congratulations!')}
            </Text>
            {nextLesson ? (
              <Button
                size="small"
                onClick={() =>
                  setDetail({ name: 'lesson', lessonId: nextLesson.id })
                }
                icon={<Icon iconName="play_arrow" $size="18px" />}
              >
                {doneCount === 0
                  ? t('Start: lesson 1')
                  : t('Continue: lesson {{number}}', { number: nextIndex + 1 })}
              </Button>
            ) : (
              <Button
                size="small"
                onClick={() => setDetail({ name: 'quiz', scope: FULL_QUIZ })}
                icon={<Icon iconName="quiz" $size="18px" />}
              >
                {t('Take the full quiz')}
              </Button>
            )}
          </Box>
        </Box>
      )}

      {tab === 'lessons' && (
        <Box as="ol" aria-label={t('Lessons')} $css={pathCss}>
          {course.lessons.map((lesson, index) => {
            const isDone = completedLessons.includes(lesson.id);
            const state = isDone
              ? 'done'
              : index === nextIndex
                ? 'next'
                : 'todo';
            const best = bestQuizScores[lesson.id];
            return (
              <li key={lesson.id}>
                <Box
                  as="button"
                  type="button"
                  onClick={() =>
                    setDetail({ name: 'lesson', lessonId: lesson.id })
                  }
                  $direction="row"
                  $align="center"
                  $gap="12px"
                  $css={rowCss}
                >
                  <Box $align="center" $justify="center" $css={stepCss(state)}>
                    {isDone ? (
                      <Icon iconName="check" $size="16px" $withThemeInherited />
                    ) : (
                      index + 1
                    )}
                  </Box>
                  <Box $gap="2px" $css="flex: 1; min-width: 0;">
                    <Text $size="sm" $weight={state === 'next' ? '700' : '600'}>
                      {lesson.title}
                    </Text>
                    <Text $size="xs" $variation="secondary">
                      {t('{{count}} slides', { count: lesson.slides.length })}
                      {best !== undefined &&
                        ` · ${t('quiz: {{score}}%', { score: best })}`}
                    </Text>
                  </Box>
                  <span className="sr-only">
                    {isDone
                      ? t('Completed')
                      : state === 'next'
                        ? t('Next lesson')
                        : ''}
                  </span>
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
      )}

      {tab === 'cards' && <FlashcardsView cards={course.flashcards} />}

      {tab === 'challenges' && (
        <Box $gap="10px">
          <Box as="ol" aria-label={t('Challenges')} $css={pathCss}>
            {challenges.map((challenge, index) => {
              const done = completedChallenges.includes(challenge.id);
              return (
                <li key={challenge.id}>
                  <Box
                    as="button"
                    type="button"
                    onClick={() =>
                      setDetail({ name: 'challenge', id: challenge.id })
                    }
                    $direction="row"
                    $align="center"
                    $gap="12px"
                    $css={rowCss}
                  >
                    <Box
                      $align="center"
                      $justify="center"
                      $css={stepCss(done ? 'done' : 'todo')}
                    >
                      {done ? (
                        <Icon
                          iconName="check"
                          $size="16px"
                          $withThemeInherited
                        />
                      ) : (
                        index + 1
                      )}
                    </Box>
                    <Box $gap="2px" $css="flex: 1; min-width: 0;">
                      <Text $size="sm" $weight="600">
                        {challenge.title}
                      </Text>
                      <Text $size="xs" $variation="secondary">
                        {t('Level {{level}} of 3', { level: challenge.level })}
                      </Text>
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
        </Box>
      )}

      {tab === 'quiz' && (
        <Box $gap="12px">
          {/* The whole-course quiz, as the main challenge. */}
          <Box
            $direction="row"
            $align="center"
            $gap="14px"
            $css={css`
              padding: 16px;
              border-radius: 12px;
              border: 1px solid
                var(--c--contextuals--border--semantic--brand--secondary);
              background: var(
                --c--contextuals--background--semantic--brand--tertiary
              );
            `}
          >
            <Box
              $align="center"
              $justify="center"
              $css={css`
                flex: none;
                width: 48px;
                height: 48px;
                border-radius: 50%;
                color: var(
                  --c--contextuals--content--semantic--brand--on-brand
                );
                background: var(
                  --c--contextuals--background--semantic--brand--primary
                );
              `}
            >
              <Icon iconName="emoji_events" $size="26px" $withThemeInherited />
            </Box>
            <Box $gap="4px" $css="flex: 1; min-width: 0;">
              <Text $weight="700">{t('Full quiz')}</Text>
              <Text $size="xs" $variation="secondary">
                {t('{{count}} questions on the whole course', {
                  count: course.quiz.length,
                })}
                {bestQuizScores[FULL_QUIZ] !== undefined &&
                  ` · ${t('best: {{score}}%', { score: bestQuizScores[FULL_QUIZ] })}`}
              </Text>
            </Box>
            <Button
              size="small"
              onClick={() => setDetail({ name: 'quiz', scope: FULL_QUIZ })}
            >
              {bestQuizScores[FULL_QUIZ] === undefined
                ? t('Start')
                : t('Play again')}
            </Button>
          </Box>

          <Text as="h3" $size="sm" $weight="700" $margin="0">
            {t('One quiz per lesson')}
          </Text>
          <Box as="ol" aria-label={t('One quiz per lesson')} $css={pathCss}>
            {course.lessons.map((lesson, index) => {
              const count = course.quiz.filter(
                (q) => q.lessonId === lesson.id,
              ).length;
              if (count === 0) {
                return null;
              }
              const best = bestQuizScores[lesson.id];
              const done = best !== undefined;
              return (
                <li key={lesson.id}>
                  <Box
                    as="button"
                    type="button"
                    onClick={() =>
                      setDetail({ name: 'quiz', scope: lesson.id })
                    }
                    $direction="row"
                    $align="center"
                    $gap="12px"
                    $css={rowCss}
                  >
                    <Box
                      $align="center"
                      $justify="center"
                      $css={stepCss(done ? 'done' : 'todo')}
                    >
                      {done ? (
                        <Icon
                          iconName="check"
                          $size="16px"
                          $withThemeInherited
                        />
                      ) : (
                        index + 1
                      )}
                    </Box>
                    <Box $gap="2px" $css="flex: 1; min-width: 0;">
                      <Text $size="sm" $weight="600">
                        {lesson.title}
                      </Text>
                      <Text $size="xs" $variation="secondary">
                        {t('{{count}} questions', { count })}
                      </Text>
                    </Box>
                    {done && (
                      <Text
                        $size="xs"
                        $weight="700"
                        $css={css`
                          padding: 2px 8px;
                          border-radius: 999px;
                          color: var(
                            --c--contextuals--content--semantic--${
                                best >= 80 ? 'success' : 'brand'
                              }--primary
                          );
                          background: var(
                            --c--contextuals--background--semantic--${
                                best >= 80 ? 'success' : 'brand'
                              }--tertiary
                          );
                        `}
                      >
                        {best} %
                      </Text>
                    )}
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
        </Box>
      )}
    </Box>
  );
};
