import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { badgeText, levelName } from './labels';
import {
  BADGES,
  LEVELS,
  POINTS,
  RewardEvent,
  levelOf,
  useRewardsStore,
} from './useRewardsStore';

const badgeCss = (isEarned: boolean) => css`
  height: 100%;
  padding: 12px;
  border-radius: 10px;
  text-align: center;
  border: 1px solid
    ${
      isEarned
        ? 'var(--c--contextuals--border--semantic--brand--secondary)'
        : 'var(--c--contextuals--border--surface--primary)'
    };
  background: ${
    isEarned
      ? 'var(--c--contextuals--background--semantic--brand--tertiary)'
      : 'var(--c--contextuals--background--surface--primary)'
  };
  opacity: ${isEarned ? 1 : 0.6};
`;

/** Level, badges (earned or not, and how to earn them) and the points. */
export const BadgesView = ({ onBack }: { onBack: () => void }) => {
  const { t } = useTranslation();
  const points = useRewardsStore((state) => state.points);
  const earned = useRewardsStore((state) => state.badges);
  const { level, next } = levelOf(points);

  const howToEarn: { event: RewardEvent; label: string }[] = [
    { event: 'analysis', label: t('A prompt analysed') },
    { event: 'great-prompt', label: t('A grade of 80 or more') },
    { event: 'improvement', label: t('An improved prompt used') },
    { event: 'fill', label: t('A prompt completed with Nestor') },
    { event: 'lesson', label: t('A lesson finished') },
    { event: 'quiz-passed', label: t('A lesson quiz at 80% or more') },
    { event: 'full-quiz-passed', label: t('The full quiz at 80% or more') },
    { event: 'review', label: t('A session review') },
    { event: 'challenge', label: t('A challenge succeeded') },
  ];

  return (
    <Box $gap="16px" $padding={{ all: 'base' }}>
      <Box $direction="row" $align="center" $gap="10px">
        <Button
          size="small"
          color="neutral"
          variant="tertiary"
          onClick={onBack}
          aria-label={t('Back')}
          icon={<Icon iconName="arrow_back" $size="18px" />}
        />
        <Box>
          <Text as="h2" $size="md" $weight="700" $margin="0">
            {t('Level {{level}}', { level: levelName(level.id, t) })}
          </Text>
          <Text $size="xs" $variation="secondary">
            {next
              ? t('{{points}} points · {{left}} more to reach {{next}}', {
                  points,
                  left: next.from - points,
                  next: levelName(next.id, t),
                })
              : t('{{points}} points · highest level reached', { points })}
          </Text>
        </Box>
      </Box>

      <Box
        as="ol"
        aria-label={t('Levels')}
        $direction="row"
        $gap="6px"
        $css="margin: 0; padding: 0; list-style: none;"
      >
        {LEVELS.map((step) => {
          const isReached = points >= step.from;
          return (
            <Box
              as="li"
              key={step.id}
              $align="center"
              $gap="2px"
              $css={css`
                flex: 1;
                padding: 8px 4px;
                border-radius: 8px;
                font-size: 0.8125rem;
                font-weight: ${step.id === level.id ? 700 : 400};
                color: ${
                  isReached
                    ? 'var(--c--contextuals--content--semantic--brand--primary)'
                    : 'var(--c--contextuals--content--semantic--neutral--tertiary)'
                };
                background: ${
                  step.id === level.id
                    ? 'var(--c--contextuals--background--semantic--brand--tertiary)'
                    : 'transparent'
                };
              `}
            >
              <span>{levelName(step.id, t)}</span>
              <Text $size="xs" $variation="secondary">
                {t('from {{points}} pts', { points: step.from })}
              </Text>
            </Box>
          );
        })}
      </Box>

      <Box $gap="8px">
        <Text as="h3" $size="sm" $weight="700" $margin="0">
          {t('Badges')}
        </Text>
        <Box
          as="ul"
          $css={css`
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
            gap: 8px;
            margin: 0;
            padding: 0;
            list-style: none;
          `}
        >
          {BADGES.map((badge) => {
            const isEarned = earned.includes(badge.id);
            const text = badgeText(badge.id, t);
            return (
              <li key={badge.id}>
                <Box $align="center" $gap="4px" $css={badgeCss(isEarned)}>
                  <Icon
                    iconName={isEarned ? badge.icon : 'lock'}
                    $size="28px"
                    $theme={isEarned ? 'brand' : 'neutral'}
                  />
                  <Text $size="sm" $weight="700">
                    {text.title}
                  </Text>
                  <Text $size="xs" $variation="secondary">
                    {text.how}
                  </Text>
                  <span className="sr-only">
                    {isEarned ? t('Earned') : t('Not earned yet')}
                  </span>
                </Box>
              </li>
            );
          })}
        </Box>
      </Box>

      <Box $gap="8px">
        <Text as="h3" $size="sm" $weight="700" $margin="0">
          {t('How to earn points')}
        </Text>
        <Box as="ul" $gap="4px" $css="margin: 0; padding: 0; list-style: none;">
          {howToEarn.map((item) => (
            <Box
              as="li"
              key={item.event}
              $direction="row"
              $justify="space-between"
              $gap="8px"
            >
              <Text $size="sm">{item.label}</Text>
              <Text $size="sm" $weight="700" $theme="brand">
                +{POINTS[item.event]}
              </Text>
            </Box>
          ))}
        </Box>
        <Text $size="xs" $variation="secondary">
          {t('Your points stay in this browser; nobody else sees them.')}
        </Text>
      </Box>
    </Box>
  );
};
