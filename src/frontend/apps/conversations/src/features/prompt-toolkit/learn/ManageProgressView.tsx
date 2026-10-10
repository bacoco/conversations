import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text, useToast } from '@/components';

import { DetailPage } from '../components/DetailPage';
import { NESTOR_COURSE_URL } from '../components/PanelHome';

import type { CourseContent } from './types';
import { FULL_QUIZ, useLearnProgressStore } from './useLearnProgressStore';

const FULL_QUIZ_ITEM = 'full-quiz';
const CARDS_ITEM = 'cards';

const rowCss = (isChecked: boolean) => css`
  width: 100%;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
  color: inherit;
  text-align: left;
  border: 1px solid
    ${
      isChecked
        ? 'var(--c--contextuals--border--semantic--error--secondary)'
        : 'var(--c--contextuals--border--surface--primary)'
    };
  background: ${
    isChecked
      ? 'var(--c--contextuals--background--semantic--error--tertiary)'
      : 'var(--c--contextuals--background--surface--primary)'
  };
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 2px;
  }
`;

const boxCss = (isChecked: boolean) => css`
  flex: none;
  width: 20px;
  height: 20px;
  border-radius: 5px;
  color: white;
  border: 2px solid
    ${
      isChecked
        ? 'var(--c--contextuals--background--semantic--error--primary)'
        : 'var(--c--contextuals--border--surface--primary)'
    };
  background: ${
    isChecked
      ? 'var(--c--contextuals--background--semantic--error--primary)'
      : 'transparent'
  };
`;

/**
 * Choose what to forget: one or more lessons (with their quiz), the full
 * quiz, the review cards. Everything is kept unless the user asks.
 */
export const ManageProgressView = ({
  course,
  onBack,
}: {
  course: CourseContent;
  onBack: () => void;
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const {
    completedLessons,
    bestQuizScores,
    knownCards,
    resetLesson,
    resetFullQuiz,
    resetCards,
  } = useLearnProgressStore();
  const [selected, setSelected] = useState<string[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);

  const items = [
    ...course.lessons.map((lesson, index) => {
      const done = completedLessons.includes(lesson.id);
      const score = bestQuizScores[lesson.id];
      return {
        id: lesson.id,
        title: `${index + 1}. ${lesson.title}`,
        detail: [
          done ? t('completed') : t('not completed'),
          score !== undefined ? t('quiz: {{score}}%', { score }) : null,
        ]
          .filter(Boolean)
          .join(' · '),
        hasProgress: done || score !== undefined,
      };
    }),
    {
      id: FULL_QUIZ_ITEM,
      title: t('Full quiz'),
      detail:
        bestQuizScores[FULL_QUIZ] !== undefined
          ? t('best: {{score}}%', { score: bestQuizScores[FULL_QUIZ] })
          : t('not taken'),
      hasProgress: bestQuizScores[FULL_QUIZ] !== undefined,
    },
    {
      id: CARDS_ITEM,
      title: t('Review cards'),
      detail: t('{{known}}/{{total}} known', {
        known: knownCards.length,
        total: course.flashcards.length,
      }),
      hasProgress: knownCards.length > 0,
    },
  ];
  const allIds = items.map((item) => item.id);
  const isAllSelected = selected.length === allIds.length;

  const toggle = (id: string) => {
    setIsConfirming(false);
    setSelected((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id],
    );
  };

  const apply = () => {
    for (const id of selected) {
      if (id === FULL_QUIZ_ITEM) {
        resetFullQuiz();
      } else if (id === CARDS_ITEM) {
        resetCards();
      } else {
        resetLesson(id);
      }
    }
    showToast('success', t('Your progress has been updated.'), undefined, 3000);
    setSelected([]);
    setIsConfirming(false);
    onBack();
  };

  return (
    <DetailPage
      onBack={onBack}
      backLabel={t('Back to the lessons')}
      title={t('Manage my progress')}
      subtitle={t(
        'Your progress is kept in this browser. Tick what you want to start over.',
      )}
      image={NESTOR_COURSE_URL}
    >
      <Box $direction="row" $justify="flex-end">
        <Button
          size="small"
          color="neutral"
          variant="tertiary"
          onClick={() => {
            setIsConfirming(false);
            setSelected(isAllSelected ? [] : allIds);
          }}
        >
          {isAllSelected ? t('Select none') : t('Select all')}
        </Button>
      </Box>

      <Box as="ul" $gap="6px" $css="margin: 0; padding: 0; list-style: none;">
        {items.map((item) => {
          const isChecked = selected.includes(item.id);
          return (
            <li key={item.id}>
              <Box
                as="button"
                type="button"
                role="checkbox"
                aria-checked={isChecked}
                onClick={() => toggle(item.id)}
                $direction="row"
                $align="center"
                $gap="12px"
                $css={rowCss(isChecked)}
              >
                <Box $align="center" $justify="center" $css={boxCss(isChecked)}>
                  {isChecked && (
                    <Icon iconName="check" $size="14px" $withThemeInherited />
                  )}
                </Box>
                <Box $gap="2px" $css="flex: 1; min-width: 0;">
                  <Text $size="sm" $weight="600">
                    {item.title}
                  </Text>
                  <Text $size="xs" $variation="secondary">
                    {item.detail}
                  </Text>
                </Box>
              </Box>
            </li>
          );
        })}
      </Box>

      {isConfirming ? (
        <Box
          role="alert"
          $gap="10px"
          $css={css`
            padding: 12px 14px;
            border-radius: 10px;
            background: var(
              --c--contextuals--background--semantic--error--tertiary
            );
          `}
        >
          <Text $size="sm" $weight="600">
            {t('Start over on {{count}} item(s)? This cannot be undone.', {
              count: selected.length,
            })}
          </Text>
          <Box $direction="row" $gap="8px" $justify="flex-end">
            <Button
              size="small"
              color="neutral"
              variant="secondary"
              onClick={() => setIsConfirming(false)}
            >
              {t('Cancel')}
            </Button>
            <Button size="small" color="error" onClick={apply}>
              {t('Yes, start over')}
            </Button>
          </Box>
        </Box>
      ) : (
        <Button
          fullWidth
          color="error"
          variant="secondary"
          disabled={selected.length === 0}
          onClick={() => setIsConfirming(true)}
          icon={<Icon iconName="restart_alt" $size="18px" />}
        >
          {t('Start over on the selection')}
        </Button>
      )}
    </DetailPage>
  );
};
