import { Button, Loader } from '@gouvfr-lasuite/cunningham-react';
import { ReactNode, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { useAiAvailable } from '../coach/aiAvailability';
import { explainQuizMistake } from '../coach/coachApi';
import { languageName } from '../coach/language';
import { DetailPage } from '../components/DetailPage';
import { NESTOR_AVATAR_URL, NESTOR_QUIZ_URL } from '../components/PanelHome';
import { useReward } from '../rewards/useReward';

import {
  QuizAnswer,
  QuizQuestionView,
  describeAnswer,
  describeRightAnswer,
  isAnswerRight,
  isComplete,
} from './QuizQuestionView';
import type { QuizQuestion } from './types';
import { FULL_QUIZ, useLearnProgressStore } from './useLearnProgressStore';

export interface QuizResult {
  /** Right at the first try. */
  right: number;
  total: number;
  /** Missed at the first try, or answered without being sure. */
  missed: QuizQuestion[];
}

/** A wrong answer comes back at the end, this many times at most. */
const MAX_RETRIES = 2;

const bubbleCss = css`
  padding: 10px 12px;
  border-radius: 12px 12px 12px 4px;
  font-size: 0.875rem;
  line-height: 1.5;
  white-space: pre-wrap;
  background: var(--c--contextuals--background--surface--tertiary);
`;

/** Nestor's word, with his face: reactions, hints, explanations. */
const FoxSays = ({ children }: { children: ReactNode }) => (
  <Box $direction="row" $align="flex-end" $gap="8px">
    <img
      src={NESTOR_AVATAR_URL}
      alt=""
      width={28}
      height={28}
      style={{ flex: 'none', borderRadius: '50%' }}
    />
    <Box $css={bubbleCss}>{children}</Box>
  </Box>
);

/**
 * One question at a time; the answer is checked when the learner says so,
 * sure or not. The right answer and why always follow; a question missed
 * comes back at the end. On its own page (full quiz, review, test) or
 * inside a step (`inStep`), where its end leads to the next time.
 */
export const QuizView = ({
  title,
  scope,
  questions,
  onBack,
  inStep,
  showHints = true,
  retryMistakes = true,
  onComplete,
  lessonLabel,
  onOpenLesson,
}: {
  title: string;
  /** Where the best score is kept; none: not kept. */
  scope?: string;
  questions: QuizQuestion[];
  onBack: () => void;
  inStep?: { doneLabel: string; onDone: (result: QuizResult) => void };
  showHints?: boolean;
  retryMistakes?: boolean;
  /** Called once, when the last question is done. */
  onComplete?: (result: QuizResult) => void;
  /** "Step 3 · …" for a lesson, to point to what to review. */
  lessonLabel?: (lessonId: string) => string | undefined;
  onOpenLesson?: (lessonId: string) => void;
}) => {
  const { t, i18n } = useTranslation();
  const reward = useReward();
  const isAiAvailable = useAiAvailable();
  const recordQuiz = useLearnProgressStore((state) => state.recordQuiz);
  const markToReview = useLearnProgressStore(
    (state) => state.markQuestionToReview,
  );
  const clearToReview = useLearnProgressStore(
    (state) => state.clearQuestionToReview,
  );
  /** The questions to ask, in order; missed ones are added at the end. */
  const [queue, setQueue] = useState(() => questions.map((_, index) => index));
  const [position, setPosition] = useState(0);
  const [answer, setAnswer] = useState<QuizAnswer | null>(null);
  const [checked, setChecked] = useState<{
    isRight: boolean;
    isSure: boolean;
  } | null>(null);
  const [firstTries, setFirstTries] = useState<Record<number, boolean>>({});
  const [unsure, setUnsure] = useState<number[]>([]);
  const [showHint, setShowHint] = useState(false);
  const [explanation, setExplanation] = useState<
    | { status: 'loading' }
    | { status: 'done'; text: string }
    | { status: 'error' }
    | null
  >(null);
  const [result, setResult] = useState<QuizResult | null>(null);
  const controllerRef = useRef<AbortController | null>(null);
  const topRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);
  useEffect(() => {
    topRef.current?.scrollIntoView?.({ block: 'nearest' });
  }, [position]);

  const index = queue[position];
  const question = questions[index];
  const isRetry = position >= questions.length;
  const labels = {
    true: t('True'),
    false: t('False'),
    helps: t('Helps the AI'),
    notHelps: t('Does not help'),
  };

  const check = (isSure: boolean) => {
    if (!answer || !isComplete(question, answer)) {
      return;
    }
    const isRight = isAnswerRight(question, answer);
    setChecked({ isRight, isSure });
    const isFirst = firstTries[index] === undefined;
    if (isFirst) {
      setFirstTries((tries) => ({ ...tries, [index]: isRight }));
      if (!isSure) {
        setUnsure((list) => [...list, index]);
      }
    }
    if (!isRight || !isSure) {
      markToReview(question.id);
    } else if (isFirst) {
      clearToReview(question.id);
    }
    const timesAsked = queue.filter((item) => item === index).length;
    if (!isRight && retryMistakes && timesAsked <= MAX_RETRIES) {
      setQueue((items) => [...items, index]);
    }
  };

  const finish = () => {
    const right = Object.values(firstTries).filter(Boolean).length;
    const missedIndexes = new Set([
      ...Object.entries(firstTries)
        .filter(([, isRight]) => !isRight)
        .map(([key]) => Number(key)),
      ...unsure,
    ]);
    const done: QuizResult = {
      right,
      total: questions.length,
      missed: [...missedIndexes].map((item) => questions[item]),
    };
    if (scope) {
      const share = Math.round((right / questions.length) * 100);
      recordQuiz(scope, share);
      if (share >= 80) {
        reward(scope === FULL_QUIZ ? 'full-quiz-passed' : 'quiz-passed');
      }
    }
    onComplete?.(done);
    setResult(done);
  };

  const next = () => {
    controllerRef.current?.abort();
    setExplanation(null);
    setShowHint(false);
    setAnswer(null);
    setChecked(null);
    if (position + 1 >= queue.length) {
      finish();
      return;
    }
    setPosition((current) => current + 1);
  };

  const restart = () => {
    setQueue(questions.map((_, item) => item));
    setPosition(0);
    setAnswer(null);
    setChecked(null);
    setFirstTries({});
    setUnsure([]);
    setResult(null);
  };

  const explain = async () => {
    if (!answer) {
      return;
    }
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setExplanation({ status: 'loading' });
    try {
      const text = await explainQuizMistake(
        {
          question: [question.question, question.prompt]
            .filter(Boolean)
            .join('\n'),
          answer: describeAnswer(question, answer, labels),
          rightAnswer: describeRightAnswer(question, labels),
          explanation: question.explanation,
        },
        languageName(i18n.language),
        controller.signal,
      );
      setExplanation({ status: 'done', text });
    } catch {
      if (!controller.signal.aborted) {
        setExplanation({ status: 'error' });
      }
    }
  };

  const page = (children: ReactNode) =>
    inStep ? (
      <Box ref={topRef} $gap="16px">
        {children}
      </Box>
    ) : (
      <DetailPage
        onBack={onBack}
        backLabel={t('Back to the course')}
        eyebrow={t('Quiz')}
        title={title}
        image={NESTOR_QUIZ_URL}
      >
        <Box ref={topRef} $gap="16px">
          {children}
        </Box>
      </DetailPage>
    );

  if (result) {
    const share = Math.round((result.right / result.total) * 100);
    const toReview = [
      ...new Set(result.missed.map((item) => item.lessonId)),
    ].filter((lessonId) => lessonLabel?.(lessonId));
    return page(
      <>
        <Box
          $align="center"
          $gap="10px"
          $css={css`
            padding: 20px 16px;
            border-radius: 12px;
            text-align: center;
            background: var(
              --c--contextuals--background--semantic--${
                  share >= 80 ? 'success' : 'brand'
                }--tertiary
            );
          `}
        >
          <img
            src={NESTOR_AVATAR_URL}
            alt=""
            width={56}
            height={56}
            style={{ borderRadius: '50%' }}
          />
          <Text $size="lg" $weight="700">
            {t('{{right}} right answers out of {{total}} at the first try', {
              right: result.right,
              total: result.total,
            })}
          </Text>
          <Text $size="sm">
            {share >= 80
              ? t('Excellent work, you master this topic!')
              : share >= 50
                ? t('Well done! A quick review and it will be perfect.')
                : t(
                    'Good start! Go over the lesson again, then try once more.',
                  )}
          </Text>
          {result.missed.length > 0 && (
            <Text $size="xs" $variation="secondary">
              {t(
                'The questions missed or unsure come back in your next review.',
              )}
            </Text>
          )}
        </Box>
        {toReview.length > 0 && onOpenLesson && (
          <Box $gap="6px">
            <Text $size="sm" $weight="700">
              {t('To go over again')}
            </Text>
            {toReview.map((lessonId) => (
              <Button
                key={lessonId}
                size="small"
                color="neutral"
                variant="secondary"
                onClick={() => onOpenLesson(lessonId)}
                icon={<Icon iconName="menu_book" $size="16px" />}
              >
                {lessonLabel?.(lessonId)}
              </Button>
            ))}
          </Box>
        )}
        <Box $direction="row" $gap="8px">
          {!inStep && retryMistakes && (
            <Button
              fullWidth
              color="neutral"
              variant="secondary"
              onClick={restart}
              icon={<Icon iconName="replay" $size="18px" />}
            >
              {t('Try again')}
            </Button>
          )}
          {inStep ? (
            <Button
              fullWidth
              onClick={() => inStep.onDone(result)}
              iconPosition="right"
              icon={<Icon iconName="arrow_forward" $size="18px" />}
            >
              {inStep.doneLabel}
            </Button>
          ) : (
            <Button fullWidth onClick={onBack}>
              {t('Back to the course')}
            </Button>
          )}
        </Box>
      </>,
    );
  }

  const reactions = checked
    ? checked.isRight
      ? [
          t('Right answer!'),
          t('Well spotted!'),
          t('Exactly.'),
          t('That is it.'),
        ]
      : [t('Not quite.'), t('Almost.'), t('Good try.')]
    : [];
  const reaction = reactions[position % Math.max(reactions.length, 1)];
  const answered = position + (checked ? 1 : 0);

  return page(
    <>
      <Box $gap="6px">
        <Box $direction="row" $justify="space-between">
          <Text $size="xs" $variation="secondary">
            {isRetry
              ? t('A question to try again')
              : t('Question {{current}} of {{total}}', {
                  current: position + 1,
                  total: questions.length,
                })}
          </Text>
        </Box>
        <Box
          aria-hidden="true"
          $css={css`
            height: 4px;
            border-radius: 2px;
            overflow: hidden;
            background: var(--c--contextuals--border--surface--primary);
            & > span {
              display: block;
              height: 100%;
              width: ${(answered / queue.length) * 100}%;
              background: var(
                --c--contextuals--background--semantic--brand--primary
              );
              transition: width 0.3s ease;
            }
          `}
        >
          <span />
        </Box>
      </Box>

      <Text
        as="h3"
        $size="lg"
        $weight="700"
        $margin="0"
        $css="line-height: 1.35;"
      >
        {question.question}
      </Text>

      <QuizQuestionView
        key={`${position}-${question.id}`}
        question={question}
        answer={answer}
        onAnswer={setAnswer}
        isLocked={checked !== null}
      />

      {!checked && showHints && question.hint && (
        <Box $gap="8px" $align="flex-start">
          {showHint ? (
            <FoxSays>{question.hint}</FoxSays>
          ) : (
            <Button
              size="small"
              color="neutral"
              variant="tertiary"
              onClick={() => setShowHint(true)}
              icon={<Icon iconName="lightbulb" $size="16px" />}
            >
              {t('A hint')}
            </Button>
          )}
        </Box>
      )}

      {!checked ? (
        <Box $direction="row" $gap="8px" $css="flex-wrap: wrap;">
          <Button
            disabled={!isComplete(question, answer)}
            onClick={() => check(true)}
            icon={<Icon iconName="check" $size="18px" />}
          >
            {t('Check my answer')}
          </Button>
          <Button
            color="neutral"
            variant="tertiary"
            disabled={!isComplete(question, answer)}
            onClick={() => check(false)}
          >
            {t('Check my answer, I am not sure')}
          </Button>
        </Box>
      ) : (
        <>
          <Box
            role="status"
            $gap="8px"
            $css={css`
              padding: 12px 14px;
              border-radius: 10px;
              background: var(
                --c--contextuals--background--semantic--${
                    checked.isRight ? 'success' : 'warning'
                  }--tertiary
              );
            `}
          >
            <FoxSays>
              <strong>{reaction}</strong>
            </FoxSays>
            <Text $size="sm" $css="line-height: 1.5;">
              {question.explanation}
            </Text>
            {checked.isRight && !checked.isSure && (
              <Text $size="xs" $variation="secondary">
                {t('Right! It will still come back in a review, to be sure.')}
              </Text>
            )}
            {!checked.isRight && retryMistakes && (
              <Text $size="xs" $variation="secondary">
                {t('This question comes back at the end.')}
              </Text>
            )}
          </Box>
          {!checked.isRight && isAiAvailable && (
            <Box $gap="8px" $align="flex-start">
              {explanation?.status === 'done' ? (
                <FoxSays>{explanation.text}</FoxSays>
              ) : (
                <Button
                  size="small"
                  color="neutral"
                  variant="tertiary"
                  disabled={explanation?.status === 'loading'}
                  onClick={() => void explain()}
                  icon={
                    explanation?.status === 'loading' ? (
                      <Loader size="small" />
                    ) : (
                      <Icon iconName="help" $size="16px" />
                    )
                  }
                >
                  {t('I did not understand')}
                </Button>
              )}
              {explanation?.status === 'error' && (
                <Text $size="xs" role="alert">
                  {t('Nestor could not explain. Please retry.')}
                </Text>
              )}
            </Box>
          )}
          <Box $direction="row" $justify="flex-end">
            <Button
              onClick={next}
              iconPosition="right"
              icon={
                <Icon
                  iconName={
                    position + 1 >= queue.length ? 'flag' : 'arrow_forward'
                  }
                  $size="18px"
                />
              }
            >
              {position + 1 >= queue.length
                ? t('See my score')
                : t('Next question')}
            </Button>
          </Box>
        </>
      )}
    </>,
  );
};
