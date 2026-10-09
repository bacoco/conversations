import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Text } from '@/components';

import type { PromptAnalysis } from '../coach/coachApi';
import { levelColor, wordLevel } from '../coach/levels';

/**
 * The State's guide for public servants (DINUM) sums up a good prompt in four
 * rules: context, reference document, precise instruction, expected format.
 * Each one gets a level in words, never a grade.
 */
export const DinumGrid = ({ result }: { result: PromptAnalysis }) => {
  const { t } = useTranslation();
  const { competencies } = result;
  const rules = [
    {
      key: 'context',
      label: t('Context'),
      hint: t('The situation, the purpose, who it is for.'),
      score: Math.round((competencies.context + competencies.audience) / 2),
    },
    {
      key: 'sources',
      label: t('Reference document'),
      hint: t('The text or document to rely on.'),
      score: competencies.sources,
    },
    {
      key: 'task',
      label: t('Precise instruction'),
      hint: t('What you expect, exactly.'),
      score: Math.round((competencies.task + competencies.constraints) / 2),
    },
    {
      key: 'format',
      label: t('Expected format'),
      hint: t('Length, structure, tone.'),
      score: competencies.format,
    },
  ];

  return (
    <Box $gap="8px">
      <Text as="h3" $size="sm" $weight="700" $margin="0">
        {t('The 4 rules of a good prompt')}
      </Text>
      <Box as="ul" $gap="6px" $css="margin: 0; padding: 0; list-style: none;">
        {rules.map((rule) => (
          <Box
            as="li"
            key={rule.key}
            $direction="row"
            $align="center"
            $gap="10px"
            $css={css`
              padding: 8px 12px;
              border-radius: 10px;
              border: 1px solid var(--c--contextuals--border--surface--primary);
            `}
          >
            <Box $gap="1px" $css="flex: 1; min-width: 0;">
              <Text $size="sm" $weight="700">
                {rule.label}
              </Text>
              <Text $size="xs" $variation="secondary">
                {rule.hint}
              </Text>
            </Box>
            <Box
              as="span"
              $direction="row"
              $align="center"
              $gap="6px"
              $css={css`
                flex: none;
                font-size: 0.8125rem;
                font-weight: 700;
                color: ${levelColor(rule.score)};
              `}
            >
              <Box
                as="span"
                aria-hidden="true"
                $css={css`
                  width: 8px;
                  height: 8px;
                  border-radius: 50%;
                  background: ${levelColor(rule.score)};
                `}
              />
              {wordLevel(rule.score, t)}
            </Box>
          </Box>
        ))}
      </Box>
      <Text $size="xs" $variation="secondary">
        {t("From the State's guide to AI for public servants.")}
      </Text>
    </Box>
  );
};
