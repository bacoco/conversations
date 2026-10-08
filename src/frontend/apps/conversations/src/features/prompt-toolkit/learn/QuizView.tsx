import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { useReward } from '../rewards/useReward';

import type { QuizQuestion } from './types';
import { FULL_QUIZ, useLearnProgressStore } from './useLearnProgressStore';

type Answer = number | boolean;
type OptionState = 'idle' | 'right' | 'wrong' | 'muted';

const LETTERS = 'ABCDEFGH';

const isRight = (question: QuizQuestion, answer: Answer) =>
  question.type === 'mcq'
    ? answer === question.correctIndex
    : answer === question.correctAnswer;

const tone = (state: OptionState) =>
  state === 'right' ? 'success' : state === 'wrong' ? 'error' : null;

const optionCss = (state: OptionState) => {
  const semantic = tone(state);
  return css`
    /* As wide as its text: short answers stay short. */
    width: fit-content;
    max-width: 100%;
    padding: 10px 16px 10px 10px;
    border-radius: 999px;
    cursor: ${state === 'idle' ? 'pointer' : 'default'};
    font: inherit;
    font-size: 0.875rem;
    line-height: 1.4;
    text-align: left;
    color: inherit;
    transition:
      border-color 0.15s ease,
      background-color 0.15s ease;
    border: 1px solid
      ${
        semantic
          ? `var(--c--contextuals--border--semantic--${semantic}--primary)`
          : 'var(--c--contextuals--border--surface--primary)'
      };
    background: ${
      semantic
        ? `var(--c--contextuals--background--semantic--${semantic}--tertiary)`
        : 'var(--c--contextuals--background--surface--primary)'
    };
    opacity: ${state === 'muted' ? 0.55 : 1};
    &:hover {
      border-color: ${
        state === 'idle'
          ? 'var(--c--contextuals--border--semantic--brand--primary)'
          : ''
      };
      background: ${
        state === 'idle'
          ? 'var(--c--contextuals--background--semantic--brand--tertiary)'
          : ''
      };
    }
    &:focus-visible {
      outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
      outline-offset: 2px;
    }
  `;
};

const letterCss = (state: OptionState) => {
  const semantic = tone(state) ?? 'brand';
  return css`
    flex: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    font-size: 0.8125rem;
    font-weight: 700;
    color: ${
      tone(state)
        ? `var(--c--contextuals--content--semantic--${semantic}--on-${semantic})`
        : 'var(--c--contextuals--content--semantic--brand--primary)'
    };
    background: ${
      tone(state)
        ? `var(--c--contextuals--background--semantic--${semantic}--primary)`
        : 'var(--c--contextuals--background--semantic--brand--tertiary)'
    };
  `;
};

/** One question at a time, with the explanation right after answering. */
export const QuizView = ({
  title,
  scope,
  questions,
  onBack,
}: {
  title: string;
  scope: string;
  questions: QuizQuestion[];
  onBack: () => void;
}) => {
  const { t } = useTranslation();
  const recordQuiz = useLearnProgressStore((state) => state.recordQuiz);
  const reward = useReward();
  const [index, setIndex] = useState(0);
  const [answer, setAnswer] = useState<Answer | null>(null);
  const [rightCount, setRightCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const question = questions[index];
  const isLast = index === questions.length - 1;

  const choose = (value: Answer) => {
    if (answer !== null) {
      return;
    }
    setAnswer(value);
    if (isRight(question, value)) {
      setRightCount((count) => count + 1);
    }
  };

  const next = () => {
    if (isLast) {
      const share = Math.round((rightCount / questions.length) * 100);
      recordQuiz(scope, share);
      if (share >= 80) {
        reward(scope === FULL_QUIZ ? 'full-quiz-passed' : 'quiz-passed');
      }
      setIsFinished(true);
      return;
    }
    setIndex((current) => current + 1);
    setAnswer(null);
  };

  const restart = () => {
    setIndex(0);
    setAnswer(null);
    setRightCount(0);
    setIsFinished(false);
  };

  const header = (
    <Box $direction="row" $align="center" $gap="8px">
      <Button
        size="small"
        color="neutral"
        variant="tertiary"
        onClick={onBack}
        aria-label={t('Back to the lessons')}
        icon={<Icon iconName="arrow_back" $size="18px" />}
      />
      <Box $css="flex: 1; min-width: 0;">
        <Text $size="xs" $variation="secondary">
          {t('Quiz')}
        </Text>
        <Text $weight="700" $ellipsis>
          {title}
        </Text>
      </Box>
    </Box>
  );

  if (isFinished) {
    const share = Math.round((rightCount / questions.length) * 100);
    return (
      <Box $gap="16px" $padding={{ all: 'base' }}>
        {header}
        <Box
          $align="center"
          $gap="10px"
          $css={css`
            padding: 24px 16px;
            border-radius: 12px;
            text-align: center;
            background: var(
              --c--contextuals--background--semantic--${
                  share >= 80 ? 'success' : 'brand'
                }--tertiary
            );
          `}
        >
          <Icon
            iconName={share >= 80 ? 'emoji_events' : 'trending_up'}
            $size="48px"
            $theme={share >= 80 ? 'success' : 'brand'}
          />
          <Text $size="xl" $weight="700">
            {t('{{right}} out of {{total}}', {
              right: rightCount,
              total: questions.length,
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
        </Box>
        <Box $direction="row" $gap="8px">
          <Button
            fullWidth
            color="neutral"
            variant="secondary"
            onClick={restart}
            icon={<Icon iconName="replay" $size="18px" />}
          >
            {t('Try again')}
          </Button>
          <Button fullWidth onClick={onBack}>
            {t('Back to the lessons')}
          </Button>
        </Box>
      </Box>
    );
  }

  const options: { label: string; value: Answer }[] =
    question.type === 'mcq'
      ? (question.options ?? []).map((label, value) => ({ label, value }))
      : [
          { label: t('True'), value: true },
          { label: t('False'), value: false },
        ];
  const isAnswerRight = answer !== null && isRight(question, answer);

  return (
    <Box $gap="16px" $padding={{ all: 'base' }}>
      {header}

      <Box $gap="6px">
        <Box $direction="row" $justify="space-between">
          <Text $size="xs" $variation="secondary">
            {t('Question {{current}} of {{total}}', {
              current: index + 1,
              total: questions.length,
            })}
          </Text>
          <Text $size="xs" $variation="secondary">
            {t('{{count}} right', { count: rightCount })}
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
              width: ${((index + (answer === null ? 0 : 1)) / questions.length) * 100}%;
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

      <Box as="ul" $gap="8px" $css="margin: 0; padding: 0; list-style: none;">
        {options.map((option, position) => {
          const state: OptionState =
            answer === null
              ? 'idle'
              : isRight(question, option.value)
                ? 'right'
                : answer === option.value
                  ? 'wrong'
                  : 'muted';
          return (
            <li key={String(option.value)}>
              <Box
                as="button"
                type="button"
                aria-disabled={answer !== null}
                onClick={() => choose(option.value)}
                $direction="row"
                $align="center"
                $gap="12px"
                $css={optionCss(state)}
              >
                <Box $align="center" $justify="center" $css={letterCss(state)}>
                  {state === 'right' ? (
                    <Icon iconName="check" $size="16px" $withThemeInherited />
                  ) : state === 'wrong' ? (
                    <Icon iconName="close" $size="16px" $withThemeInherited />
                  ) : (
                    LETTERS[position]
                  )}
                </Box>
                <span>{option.label}</span>
              </Box>
            </li>
          );
        })}
      </Box>

      {answer === null ? (
        <Text $size="xs" $variation="secondary" $textAlign="center">
          {t('Choose an answer.')}
        </Text>
      ) : (
        <>
          <Box
            role="status"
            $direction="row"
            $gap="10px"
            $css={css`
              padding: 12px 14px;
              border-radius: 10px;
              background: var(
                --c--contextuals--background--semantic--${
                    isAnswerRight ? 'success' : 'warning'
                  }--tertiary
              );
            `}
          >
            <Icon
              iconName={isAnswerRight ? 'celebration' : 'lightbulb'}
              $size="20px"
              $theme={isAnswerRight ? 'success' : 'warning'}
            />
            <Box $gap="4px">
              <Text $size="sm" $weight="700">
                {isAnswerRight
                  ? t('Right answer!')
                  : t('Not quite — here is why:')}
              </Text>
              <Text $size="sm" $css="line-height: 1.5;">
                {question.explanation}
              </Text>
            </Box>
          </Box>
          <Box $direction="row" $justify="flex-end">
            <Button
              onClick={next}
              iconPosition="right"
              icon={
                <Icon
                  iconName={isLast ? 'flag' : 'arrow_forward'}
                  $size="18px"
                />
              }
            >
              {isLast ? t('See my score') : t('Next question')}
            </Button>
          </Box>
        </>
      )}
    </Box>
  );
};
