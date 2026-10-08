import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import type { SessionPromptGrade } from '../coach/coachApi';
import { levelColor } from '../coach/levels';
import { getPromptLibrary } from '../library/content';

const CHART_HEIGHT = 96;

const tileCss = css`
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  border-radius: 10px;
  background: var(--c--contextuals--background--surface--secondary);
`;

const Stat = ({ value, label }: { value: string; label: string }) => (
  <Box $gap="2px" $css={tileCss}>
    <Text $size="lg" $weight="800" $css="line-height: 1.1;">
      {value}
    </Text>
    <Text $size="xs" $variation="secondary">
      {label}
    </Text>
  </Box>
);

/**
 * The session at a glance: how many prompts, their average grade, the
 * progress from the first to the last, and the kinds of requests.
 */
export const SessionDashboard = ({
  grades,
}: {
  grades: SessionPromptGrade[];
}) => {
  const { t, i18n } = useTranslation();
  const categories = useMemo(
    () => getPromptLibrary(i18n.language).categories,
    [i18n.language],
  );

  if (grades.length === 0) {
    return null;
  }

  const scores = grades.map((grade) => grade.score);
  const average = Math.round(
    scores.reduce((sum, score) => sum + score, 0) / scores.length,
  );
  const progress = scores[scores.length - 1] - scores[0];
  const kinds = Object.entries(
    grades.reduce<Record<string, number>>((count, grade) => {
      count[grade.kind] = (count[grade.kind] ?? 0) + 1;
      return count;
    }, {}),
  ).sort((a, b) => b[1] - a[1]);
  const kindLabel = (kind: string) => {
    const category = categories.find((c) => c.id === kind);
    return category
      ? { icon: category.icon, title: category.title }
      : { icon: 'more_horiz', title: t('Other requests') };
  };

  return (
    <Box $gap="14px">
      <Box $direction="row" $gap="8px">
        <Stat value={String(grades.length)} label={t('prompts')} />
        <Stat value={`${average}/100`} label={t('average grade')} />
        {/* Encouraging: show the progress when there is some, else the best. */}
        {grades.length > 1 && progress > 0 ? (
          <Stat
            value={`+${progress}`}
            label={t('points since the first prompt')}
          />
        ) : (
          <Stat value={`${Math.max(...scores)}/100`} label={t('best grade')} />
        )}
      </Box>

      <Box $gap="6px">
        <Text as="h4" $size="xs" $weight="700" $margin="0">
          {t('Grade of each prompt')}
        </Text>
        <Box
          role="img"
          aria-label={t('Grades in order: {{grades}}', {
            grades: scores.join(', '),
          })}
          $direction="row"
          $align="flex-end"
          $gap="4px"
          $css={css`
            height: ${CHART_HEIGHT + 18}px;
            padding: 0 2px;
            border-bottom: 1px solid
              var(--c--contextuals--border--surface--primary);
          `}
        >
          {scores.map((score, index) => (
            <Box
              key={index}
              $align="center"
              $justify="flex-end"
              $gap="2px"
              $css="flex: 1; min-width: 0; max-width: 40px; height: 100%;"
            >
              <Text
                aria-hidden="true"
                $size="xs"
                $variation="secondary"
                $css="font-size: 0.6875rem;"
              >
                {score}
              </Text>
              <Box
                aria-hidden="true"
                $css={css`
                  width: 100%;
                  height: ${Math.max(4, (score / 100) * CHART_HEIGHT)}px;
                  border-radius: 4px 4px 0 0;
                  background: ${levelColor(score)};
                `}
              />
            </Box>
          ))}
        </Box>
      </Box>

      <Box $gap="6px">
        <Text as="h4" $size="xs" $weight="700" $margin="0">
          {t('Kinds of requests')}
        </Text>
        <Box
          as="ul"
          $direction="row"
          $gap="6px"
          $css="flex-wrap: wrap; margin: 0; padding: 0; list-style: none;"
        >
          {kinds.map(([kind, count]) => {
            const label = kindLabel(kind);
            return (
              <Box
                as="li"
                key={kind}
                $direction="row"
                $align="center"
                $gap="4px"
                $css={css`
                  padding: 4px 10px;
                  border-radius: 999px;
                  font-size: 0.8125rem;
                  background: var(
                    --c--contextuals--background--semantic--brand--tertiary
                  );
                `}
              >
                <Icon iconName={label.icon} $size="16px" $theme="brand" />
                <Text $size="xs">
                  {label.title} · {count}
                </Text>
              </Box>
            );
          })}
        </Box>
      </Box>
    </Box>
  );
};
