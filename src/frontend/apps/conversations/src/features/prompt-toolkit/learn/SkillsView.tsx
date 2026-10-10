import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Text } from '@/components';

import { Disclosure } from '../components/CoachParts';
import { useCoachHistoryStore } from '../stores/useCoachHistoryStore';

import { levelPillCss, useLevelLabels, useSkillLabels } from './CourseParts';
import { SHOWN_SKILLS, Step, whereTaught } from './steps';
import { useSkillLevels } from './useLearnProgress';

const linkCss = css`
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  font: inherit;
  font-size: 0.8125rem;
  color: var(--c--contextuals--content--semantic--brand--primary);
  text-decoration: underline;
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 2px;
  }
`;

/**
 * Each habit of a good request, in words: discovered in a lesson, acquired
 * in its questions or exercise, mastered once the coach sees it in most of
 * the real requests. A level reached is kept. Folded until opened.
 */
export const SkillsView = ({
  steps,
  onOpenStep,
}: {
  steps: Step[];
  onOpenStep: (lessonId: string, slide: number) => void;
}) => {
  const { t } = useTranslation();
  const levels = useSkillLevels(steps);
  const skillLabels = useSkillLabels();
  const levelLabels = useLevelLabels();
  const readCount = useCoachHistoryStore((state) => state.entries.length);

  return (
    <Disclosure label={t('My skills')} icon="insights">
      <Text $size="xs" $variation="secondary">
        {readCount > 0
          ? t('From the course and from your last requests read by the coach.')
          : t(
              'From the course. Once the coach reads your requests, it adds what it sees.',
            )}
      </Text>
      <Box as="ul" $css="margin: 0; padding: 0; list-style: none;">
        {SHOWN_SKILLS.map((skill, index) => {
          const level = levels[skill] ?? 0;
          const where = level < 2 ? whereTaught(steps, skill) : null;
          return (
            <Box
              as="li"
              key={skill}
              $direction="row"
              $align="center"
              $gap="10px"
              $css={css`
                padding: 9px 0;
                border-bottom: ${
                  index === SHOWN_SKILLS.length - 1
                    ? 'none'
                    : '1px solid var(--c--contextuals--border--surface--primary)'
                };
              `}
            >
              <Box
                $direction="row"
                $align="baseline"
                $gap="8px"
                $css="flex: 1; min-width: 0; flex-wrap: wrap;"
              >
                <Text $size="sm">{skillLabels[skill]}</Text>
                {where && (
                  <Box
                    as="button"
                    type="button"
                    onClick={() =>
                      onOpenStep(where.step.lesson.id, where.slide)
                    }
                    $css={linkCss}
                  >
                    {t('See step {{number}}', { number: where.step.number })}
                  </Box>
                )}
              </Box>
              <Box as="span" $css={levelPillCss(level)}>
                {levelLabels[level]}
              </Box>
            </Box>
          );
        })}
      </Box>
    </Disclosure>
  );
};
