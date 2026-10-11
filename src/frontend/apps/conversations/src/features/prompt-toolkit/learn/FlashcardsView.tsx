import { Button } from '@gouvfr-lasuite/cunningham-react';
import { KeyboardEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { ScreenActions, enterCss } from './CourseFrame';
import type { Flashcard } from './types';
import { useLearnProgressStore } from './useLearnProgressStore';

const faceCss = (isBack: boolean) => css`
  position: absolute;
  inset: 0;
  padding: 20px;
  border-radius: 14px;
  backface-visibility: hidden;
  text-align: center;
  transform: ${isBack ? 'rotateY(180deg)' : 'none'};
  border: 1px solid
    ${
      isBack
        ? 'var(--c--contextuals--border--semantic--brand--secondary)'
        : 'var(--c--contextuals--border--surface--primary)'
    };
  background: ${
    isBack
      ? 'var(--c--contextuals--background--semantic--brand--tertiary)'
      : 'var(--c--contextuals--background--surface--primary)'
  };
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
`;

export interface CardsResult {
  known: number;
  toReview: number;
}

/**
 * Cards to remember, each seen once: a card turns over to show the answer,
 * then the user says whether they knew it; after the last one, `onDone`.
 * Keyboard: Space or Enter turns, arrows move.
 */
export const FlashcardsView = ({
  cards,
  onDone,
}: {
  cards: Flashcard[];
  onDone: (result: CardsResult) => void;
}) => {
  const { t } = useTranslation();
  const knownCards = useLearnProgressStore((state) => state.knownCards);
  // Known: back in 1, 3, 7, then 21 days; to review: at the next review.
  const reviewCard = useLearnProgressStore((state) => state.reviewCard);
  const [index, setIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [result, setResult] = useState<CardsResult>({ known: 0, toReview: 0 });
  const card = cards[index];
  const isKnown = knownCards.includes(card.id);

  const goTo = (next: number) => {
    setIndex(Math.min(Math.max(next, 0), cards.length - 1));
    setIsRevealed(false);
  };

  const answer = (known: boolean) => {
    reviewCard(card.id, known);
    const next = {
      known: result.known + (known ? 1 : 0),
      toReview: result.toReview + (known ? 0 : 1),
    };
    setResult(next);
    if (index === cards.length - 1) {
      onDone(next);
      return;
    }
    goTo(index + 1);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      goTo(index + 1);
    } else if (event.key === 'ArrowLeft') {
      event.preventDefault();
      goTo(index - 1);
    }
  };

  return (
    <Box $gap="14px" $css="width: 100%;">
      <Text $size="sm" $variation="secondary">
        {t(
          'Read the question, look for the answer in your head, then turn the card over.',
        )}
      </Text>
      <Box $direction="row" $justify="space-between" $align="center">
        <Text $size="sm" $weight="700" $theme="brand">
          {t('Card {{current}} of {{total}}', {
            current: index + 1,
            total: cards.length,
          })}
        </Text>
        {isKnown && (
          <Text
            $size="xs"
            $color="var(--c--contextuals--content--semantic--success--primary)"
          >
            ✓ {t('Already known')}
          </Text>
        )}
      </Box>

      <Box
        key={card.id}
        as="button"
        type="button"
        aria-pressed={isRevealed}
        aria-label={`${isRevealed ? t('Answer') : t('Question')} : ${
          isRevealed ? card.back : card.front
        }. ${isRevealed ? t('Hide the answer') : t('Show the answer')}`}
        onClick={() => setIsRevealed((value) => !value)}
        onKeyDown={onKeyDown}
        $css={css`
          ${enterCss('forward')}
          position: relative;
          height: clamp(240px, 42vh, 380px);
          padding: 0;
          border: none;
          background: transparent;
          cursor: pointer;
          font: inherit;
          color: inherit;
          perspective: 1000px;
          &:focus-visible {
            outline: 2px solid
              var(--c--contextuals--border--semantic--brand--primary);
            outline-offset: 4px;
            border-radius: 14px;
          }
        `}
      >
        <Box
          aria-hidden="true"
          $css={css`
            position: absolute;
            inset: 0;
            transform-style: preserve-3d;
            transition: transform 0.5s ease;
            transform: ${isRevealed ? 'rotateY(180deg)' : 'none'};
            @media (prefers-reduced-motion: reduce) {
              transition: none;
            }
          `}
        >
          <Box
            $align="center"
            $justify="center"
            $gap="10px"
            $css={faceCss(false)}
          >
            <Text $size="xs" $weight="700" $variation="secondary">
              {t('Question')}
            </Text>
            <Text $size="lg" $weight="700" $css="line-height: 1.35;">
              {card.front}
            </Text>
            <Text $size="xs" $variation="secondary">
              {t('Click to reveal the answer')}
            </Text>
          </Box>
          <Box
            $align="center"
            $justify="center"
            $gap="10px"
            $css={faceCss(true)}
          >
            <Text $size="xs" $weight="700" $theme="brand">
              {t('Answer')}
            </Text>
            <Text $size="md" $css="line-height: 1.5;">
              {card.back}
            </Text>
          </Box>
        </Box>
      </Box>

      <ScreenActions
        start={
          isRevealed && (
            <Button
              color="neutral"
              variant="secondary"
              onClick={() => answer(false)}
              icon={<Icon iconName="replay" $size="18px" />}
            >
              {t('To review later')}
            </Button>
          )
        }
      >
        {isRevealed ? (
          <Button
            onClick={() => answer(true)}
            icon={<Icon iconName="check" $size="18px" />}
          >
            {t('I knew it')}
          </Button>
        ) : (
          <Button
            onClick={() => setIsRevealed(true)}
            icon={<Icon iconName="flip" $size="18px" />}
          >
            {t('Show the answer')}
          </Button>
        )}
      </ScreenActions>
    </Box>
  );
};
