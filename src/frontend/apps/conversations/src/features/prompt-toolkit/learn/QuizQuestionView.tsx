import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import type { QuizQuestion } from './types';

/** What the learner answered, per kind of question. */
export type QuizAnswer =
  | { kind: 'choice'; index: number }
  | { kind: 'order'; sequence: number[] }
  | { kind: 'sort'; placed: Record<number, boolean> };

const LETTERS = 'ABCDEFGH';

/** The answers that are one choice among several, and their options. */
export const choiceOptions = (
  question: QuizQuestion,
  labels: { true: string; false: string },
) =>
  question.type === 'true-false'
    ? [labels.true, labels.false]
    : (question.options ?? []);

export const rightChoice = (question: QuizQuestion) =>
  question.type === 'true-false'
    ? question.correctAnswer
      ? 0
      : 1
    : (question.correctIndex ?? -1);

export const isComplete = (
  question: QuizQuestion,
  answer: QuizAnswer | null,
) => {
  if (!answer) {
    return false;
  }
  if (answer.kind === 'order') {
    return answer.sequence.length === (question.pieces ?? []).length;
  }
  if (answer.kind === 'sort') {
    return Object.keys(answer.placed).length === (question.items ?? []).length;
  }
  return true;
};

export const isAnswerRight = (question: QuizQuestion, answer: QuizAnswer) => {
  if (answer.kind === 'choice') {
    return answer.index === rightChoice(question);
  }
  if (answer.kind === 'order') {
    return answer.sequence.every((piece, position) => piece === position);
  }
  return (question.items ?? []).every(
    (item, index) => answer.placed[index] === item.helps,
  );
};

type OptionState = 'idle' | 'selected' | 'right' | 'wrong' | 'muted';

const tone = (state: OptionState) =>
  state === 'right'
    ? 'success'
    : state === 'wrong'
      ? 'error'
      : state === 'selected'
        ? 'brand'
        : null;

const choiceCss = (state: OptionState, isCard = false, isInline = false) => {
  const semantic = tone(state);
  return css`
    width: ${isInline ? 'auto' : '100%'};
    max-width: 100%;
    padding: ${isCard ? '12px 14px' : '10px 16px 10px 10px'};
    border-radius: ${isCard ? '12px' : '999px'};
    cursor: ${state === 'idle' || state === 'selected' ? 'pointer' : 'default'};
    font: inherit;
    font-size: 0.875rem;
    line-height: 1.45;
    text-align: left;
    color: inherit;
    border: ${state === 'selected' ? 2 : 1}px solid
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
    }
    &:focus-visible {
      outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
      outline-offset: 2px;
    }
  `;
};

const letterCss = (state: OptionState) => {
  const semantic = tone(state);
  return css`
    flex: none;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    font-size: 0.8125rem;
    font-weight: 700;
    color: ${
      semantic
        ? `var(--c--contextuals--content--semantic--${semantic}--on-${semantic})`
        : 'var(--c--contextuals--content--semantic--brand--primary)'
    };
    background: ${
      semantic
        ? `var(--c--contextuals--background--semantic--${semantic}--primary)`
        : 'var(--c--contextuals--background--semantic--brand--tertiary)'
    };
  `;
};

export const quoteCss = css`
  display: block;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.5;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--c--contextuals--background--surface--secondary);
`;

const chipCss = (isOn: boolean) => css`
  padding: 6px 12px;
  border-radius: 999px;
  cursor: pointer;
  font: inherit;
  font-size: 0.875rem;
  text-align: left;
  color: var(--c--contextuals--content--semantic--brand--primary);
  border: 1px solid
    ${
      isOn
        ? 'var(--c--contextuals--border--semantic--brand--primary)'
        : 'var(--c--contextuals--border--semantic--brand--secondary)'
    };
  background: ${
    isOn
      ? 'var(--c--contextuals--background--semantic--brand--tertiary)'
      : 'var(--c--contextuals--background--surface--primary)'
  };
  &:disabled {
    cursor: default;
  }
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 2px;
  }
`;

/** One choice among several, shown as fits the kind of question. */
const ChoiceQuestion = ({
  question,
  answer,
  onAnswer,
  isLocked,
}: {
  question: QuizQuestion;
  answer: QuizAnswer | null;
  onAnswer: (answer: QuizAnswer) => void;
  isLocked: boolean;
}) => {
  const { t } = useTranslation();
  const options = choiceOptions(question, {
    true: t('True'),
    false: t('False'),
  });
  const right = rightChoice(question);
  const selected = answer?.kind === 'choice' ? answer.index : null;
  const stateOf = (index: number): OptionState =>
    !isLocked
      ? selected === index
        ? 'selected'
        : 'idle'
      : index === right
        ? 'right'
        : index === selected
          ? 'wrong'
          : 'muted';
  const isCards = question.type === 'best';
  const isSentences = question.type === 'spot';

  return (
    <Box $gap="10px">
      {(question.type === 'missing' || question.type === 'cloze') &&
        question.prompt && (
          <Text $size="sm" $css={quoteCss}>
            {question.type === 'cloze'
              ? question.prompt.split('___').map((part, index, parts) => (
                  <span key={index}>
                    {part}
                    {index < parts.length - 1 && (
                      <Box
                        as="span"
                        $css={css`
                          display: inline-block;
                          min-width: 64px;
                          padding: 0 6px;
                          border-bottom: 2px solid
                            var(
                              --c--contextuals--border--semantic--brand--primary
                            );
                          font-weight: 700;
                          color: var(
                            --c--contextuals--content--semantic--brand--primary
                          );
                        `}
                      >
                        {selected !== null ? options[selected] : '…'}
                      </Box>
                    )}
                  </span>
                ))
              : question.prompt}
          </Text>
        )}
      {isSentences && question.prompt && (
        <Text $size="xs" $variation="secondary">
          {question.prompt}
        </Text>
      )}
      <Box
        as="ul"
        $gap="8px"
        $direction={
          question.type === 'missing' || question.type === 'cloze'
            ? 'row'
            : 'column'
        }
        $css="margin: 0; padding: 0; list-style: none; flex-wrap: wrap;"
      >
        {options.map((option, index) => {
          const state = stateOf(index);
          return (
            <li key={option}>
              <Box
                as="button"
                type="button"
                aria-pressed={!isLocked ? selected === index : undefined}
                aria-disabled={isLocked}
                onClick={() => !isLocked && onAnswer({ kind: 'choice', index })}
                $direction="row"
                $align={isCards || isSentences ? 'flex-start' : 'center'}
                $gap="12px"
                $css={choiceCss(
                  state,
                  isCards || isSentences,
                  question.type === 'missing' || question.type === 'cloze',
                )}
              >
                {question.type !== 'missing' && question.type !== 'cloze' && (
                  <Box
                    $align="center"
                    $justify="center"
                    $css={letterCss(state)}
                  >
                    {state === 'right' ? (
                      <Icon iconName="check" $size="16px" $withThemeInherited />
                    ) : state === 'wrong' ? (
                      <Icon iconName="close" $size="16px" $withThemeInherited />
                    ) : (
                      LETTERS[index]
                    )}
                  </Box>
                )}
                <Box $gap="2px" $css="flex: 1; min-width: 0;">
                  {isCards && (
                    <Text $size="xs" $weight="700" $variation="secondary">
                      {t('Request {{letter}}', { letter: LETTERS[index] })}
                    </Text>
                  )}
                  <span style={{ whiteSpace: 'pre-wrap' }}>{option}</span>
                </Box>
              </Box>
            </li>
          );
        })}
      </Box>
    </Box>
  );
};

/** The pieces of a request to put back in order, one tap each. */
const OrderQuestion = ({
  question,
  answer,
  onAnswer,
  isLocked,
}: {
  question: QuizQuestion;
  answer: QuizAnswer | null;
  onAnswer: (answer: QuizAnswer) => void;
  isLocked: boolean;
}) => {
  const { t } = useTranslation();
  const pieces = question.pieces ?? [];
  const sequence = answer?.kind === 'order' ? answer.sequence : [];
  // A fixed shuffle: the same for everyone, never the right order.
  const shown = pieces
    .map((piece, index) => ({ piece, index }))
    .sort((a, b) => ((a.index * 7 + 3) % 5) - ((b.index * 7 + 3) % 5));
  const remaining = shown.filter((item) => !sequence.includes(item.index));

  return (
    <Box $gap="10px">
      <Text $size="xs" $variation="secondary">
        {t('Tap the pieces in order. Tap one again to take it out.')}
      </Text>
      <Box
        as="ol"
        aria-label={t('Your order')}
        $gap="6px"
        $css={css`
          margin: 0;
          padding: 10px;
          min-height: 44px;
          list-style: none;
          border-radius: 10px;
          border: 1px dashed
            var(--c--contextuals--border--semantic--brand--secondary);
        `}
      >
        {sequence.map((pieceIndex, position) => {
          const isRight = isLocked && pieceIndex === position;
          const isWrong = isLocked && pieceIndex !== position;
          return (
            <li key={pieceIndex}>
              <Box
                as="button"
                type="button"
                disabled={isLocked}
                onClick={() =>
                  onAnswer({
                    kind: 'order',
                    sequence: sequence.filter((item) => item !== pieceIndex),
                  })
                }
                $direction="row"
                $align="center"
                $gap="8px"
                $css={choiceCss(
                  isRight ? 'right' : isWrong ? 'wrong' : 'selected',
                  true,
                )}
              >
                <Text $size="xs" $weight="700">
                  {position + 1}.
                </Text>
                <span>{pieces[pieceIndex]}</span>
              </Box>
            </li>
          );
        })}
      </Box>
      {!isLocked && (
        <Box $direction="row" $gap="6px" $css="flex-wrap: wrap;">
          {remaining.map((item) => (
            <Box
              key={item.index}
              as="button"
              type="button"
              onClick={() =>
                onAnswer({ kind: 'order', sequence: [...sequence, item.index] })
              }
              $css={chipCss(false)}
            >
              {item.piece}
            </Box>
          ))}
        </Box>
      )}
      {isLocked && !isAnswerRight(question, { kind: 'order', sequence }) && (
        <Box $gap="4px">
          <Text $size="xs" $weight="700">
            {t('The right order')}
          </Text>
          <Box as="ol" $css="margin: 0; padding-left: 20px;">
            {pieces.map((piece) => (
              <Text as="li" key={piece} $size="sm" $css="display: list-item;">
                {piece}
              </Text>
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
};

/** Each item: does it help the AI or not? */
const SortQuestion = ({
  question,
  answer,
  onAnswer,
  isLocked,
}: {
  question: QuizQuestion;
  answer: QuizAnswer | null;
  onAnswer: (answer: QuizAnswer) => void;
  isLocked: boolean;
}) => {
  const { t } = useTranslation();
  const placed = answer?.kind === 'sort' ? answer.placed : {};
  const place = (index: number, helps: boolean) =>
    onAnswer({ kind: 'sort', placed: { ...placed, [index]: helps } });

  return (
    <Box as="ul" $gap="8px" $css="margin: 0; padding: 0; list-style: none;">
      {(question.items ?? []).map((item, index) => {
        const value = placed[index];
        const isWrong = isLocked && value !== item.helps;
        return (
          <Box
            as="li"
            key={item.text}
            $gap="6px"
            $css={css`
              padding: 10px 12px;
              border-radius: 10px;
              border: 1px solid
                ${
                  isLocked
                    ? isWrong
                      ? 'var(--c--contextuals--border--semantic--error--primary)'
                      : 'var(--c--contextuals--border--semantic--success--primary)'
                    : 'var(--c--contextuals--border--surface--primary)'
                };
            `}
          >
            <Text $size="sm">{item.text}</Text>
            <Box
              role="group"
              aria-label={item.text}
              $direction="row"
              $gap="6px"
              $css="flex-wrap: wrap;"
            >
              {[true, false].map((helps) => (
                <Box
                  key={String(helps)}
                  as="button"
                  type="button"
                  aria-pressed={value === helps}
                  disabled={isLocked}
                  onClick={() => place(index, helps)}
                  $css={chipCss(value === helps)}
                >
                  {helps ? t('Helps the AI') : t('Does not help')}
                </Box>
              ))}
            </Box>
            {isWrong && (
              <Text $size="xs" $theme="error">
                {item.helps ? t('It helps the AI.') : t('It does not help.')}
              </Text>
            )}
          </Box>
        );
      })}
    </Box>
  );
};

/** The question, shown and answered as fits its kind. */
export const QuizQuestionView = (props: {
  question: QuizQuestion;
  answer: QuizAnswer | null;
  onAnswer: (answer: QuizAnswer) => void;
  isLocked: boolean;
}) => {
  if (props.question.type === 'order') {
    return <OrderQuestion {...props} />;
  }
  if (props.question.type === 'sort') {
    return <SortQuestion {...props} />;
  }
  return <ChoiceQuestion {...props} />;
};

/** The answer in words, for Nestor to explain a mistake. */
export const describeAnswer = (
  question: QuizQuestion,
  answer: QuizAnswer,
  labels: { true: string; false: string; helps: string; notHelps: string },
) => {
  if (answer.kind === 'choice') {
    return choiceOptions(question, labels)[answer.index] ?? '';
  }
  if (answer.kind === 'order') {
    return answer.sequence
      .map((index) => (question.pieces ?? [])[index])
      .join(' / ');
  }
  return (question.items ?? [])
    .map(
      (item, index) =>
        `${item.text}: ${answer.placed[index] ? labels.helps : labels.notHelps}`,
    )
    .join('; ');
};

/** The right answer in words. */
export const describeRightAnswer = (
  question: QuizQuestion,
  labels: { true: string; false: string; helps: string; notHelps: string },
) => {
  if (question.type === 'order') {
    return (question.pieces ?? []).join(' / ');
  }
  if (question.type === 'sort') {
    return (question.items ?? [])
      .map(
        (item) =>
          `${item.text}: ${item.helps ? labels.helps : labels.notHelps}`,
      )
      .join('; ');
  }
  return choiceOptions(question, labels)[rightChoice(question)] ?? '';
};
