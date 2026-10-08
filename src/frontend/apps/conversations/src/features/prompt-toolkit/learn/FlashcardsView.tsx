import { Button } from '@gouvfr-lasuite/cunningham-react';
import { KeyboardEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

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

/**
 * Review cards: a card turns over to show the answer, then the user says
 * whether they knew it. Keyboard: Space or Enter turns, arrows move.
 */
export const FlashcardsView = ({ cards }: { cards: Flashcard[] }) => {
  const { t } = useTranslation();
  const { knownCards, setCardKnown, cardIndex, setCardIndex } =
    useLearnProgressStore();
  // The current card is remembered between visits.
  const index = cardIndex < cards.length ? cardIndex : 0;
  const [isRevealed, setIsRevealed] = useState(false);
  const card = cards[index];
  const knownCount = cards.filter((c) => knownCards.includes(c.id)).length;
  const isKnown = knownCards.includes(card.id);

  const goTo = (next: number) => {
    setCardIndex((next + cards.length) % cards.length);
    setIsRevealed(false);
  };

  const answer = (known: boolean) => {
    setCardKnown(card.id, known);
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
    <Box $gap="14px" $css="width: 100%; max-width: 360px; margin-inline: auto;">
      <Box $direction="row" $justify="space-between" $align="center">
        <Text $size="sm" $weight="700">
          {t('Card {{current}} of {{total}}', {
            current: index + 1,
            total: cards.length,
          })}
        </Text>
        <Text
          $size="xs"
          $weight="600"
          $color="var(--c--contextuals--content--semantic--success--primary)"
        >
          {t('{{known}}/{{total}} known', {
            known: knownCount,
            total: cards.length,
          })}
        </Text>
      </Box>

      <Box
        as="button"
        type="button"
        aria-pressed={isRevealed}
        aria-label={`${isRevealed ? t('Answer') : t('Question')} : ${
          isRevealed ? card.back : card.front
        }. ${isRevealed ? t('Hide the answer') : t('Show the answer')}`}
        onClick={() => setIsRevealed((value) => !value)}
        onKeyDown={onKeyDown}
        $css={css`
          position: relative;
          height: 220px;
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
            <Text $size="md" $weight="700">
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
            <Text $size="sm">{card.back}</Text>
          </Box>
        </Box>
      </Box>

      {isRevealed ? (
        <Box $direction="row" $gap="8px">
          <Button
            fullWidth
            color="neutral"
            variant="secondary"
            onClick={() => answer(false)}
            icon={<Icon iconName="replay" $size="18px" />}
          >
            {t('To review')}
          </Button>
          <Button
            fullWidth
            onClick={() => answer(true)}
            icon={<Icon iconName="check" $size="18px" />}
          >
            {t('I knew it')}
          </Button>
        </Box>
      ) : (
        <Box $direction="row" $justify="space-between" $align="center">
          <Button
            color="neutral"
            variant="tertiary"
            onClick={() => goTo(index - 1)}
            aria-label={t('Previous card')}
            icon={<Icon iconName="chevron_left" $size="20px" />}
          />
          {isKnown && (
            <Text
              $size="xs"
              $color="var(--c--contextuals--content--semantic--success--primary)"
            >
              ✓ {t('Already known')}
            </Text>
          )}
          <Button
            color="neutral"
            variant="tertiary"
            onClick={() => goTo(index + 1)}
            aria-label={t('Next card')}
            icon={<Icon iconName="chevron_right" $size="20px" />}
          />
        </Box>
      )}
    </Box>
  );
};
