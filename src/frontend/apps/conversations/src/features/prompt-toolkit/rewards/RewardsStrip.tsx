import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { levelName } from './labels';
import { BADGES, levelOf, useRewardsStore } from './useRewardsStore';

/** The level, the points to the next one, and the badges: one line. */
export const RewardsStrip = ({ onOpen }: { onOpen: () => void }) => {
  const { t } = useTranslation();
  const points = useRewardsStore((state) => state.points);
  const badges = useRewardsStore((state) => state.badges);
  const { level, next } = levelOf(points);
  const ratio = next ? (points - level.from) / (next.from - level.from) : 1;

  return (
    <Box
      as="button"
      type="button"
      onClick={onOpen}
      aria-label={t('My level and badges')}
      $direction="row"
      $align="center"
      $gap="12px"
      $css={css`
        width: 100%;
        padding: 10px 12px;
        border-radius: 10px;
        cursor: pointer;
        font: inherit;
        color: inherit;
        text-align: left;
        border: 1px solid var(--c--contextuals--border--surface--primary);
        background: var(--c--contextuals--background--surface--secondary);
        &:hover {
          border-color: var(--c--contextuals--border--semantic--brand--primary);
        }
        &:focus-visible {
          outline: 2px solid
            var(--c--contextuals--border--semantic--brand--primary);
          outline-offset: 2px;
        }
      `}
    >
      <Icon iconName="military_tech" $size="24px" $theme="brand" />
      <Box $gap="4px" $css="flex: 1; min-width: 0;">
        <Box $direction="row" $justify="space-between" $gap="8px">
          <Text $size="sm" $weight="700">
            {levelName(level.id, t)}
          </Text>
          <Text $size="xs" $variation="secondary">
            {t('{{points}} pts · {{badges}}/{{total}} badges', {
              points,
              badges: badges.length,
              total: BADGES.length,
            })}
          </Text>
        </Box>
        <Box
          aria-hidden="true"
          $css={css`
            height: 6px;
            border-radius: 3px;
            overflow: hidden;
            background: var(--c--contextuals--border--surface--primary);
            & > span {
              display: block;
              height: 100%;
              width: ${Math.round(ratio * 100)}%;
              background: var(
                --c--contextuals--background--semantic--brand--primary
              );
            }
          `}
        >
          <span />
        </Box>
      </Box>
      <Icon iconName="chevron_right" $size="20px" $variation="secondary" />
    </Box>
  );
};
