import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { getPromptLibrary } from '../library/content';
import { useProfileStore } from '../stores/useProfileStore';

const selectCss = css`
  flex: 1;
  min-width: 0;
  padding: 6px 8px;
  border-radius: 6px;
  font: inherit;
  font-size: 0.875rem;
  color: inherit;
  border: 1px solid var(--c--contextuals--border--surface--primary);
  background: var(--c--contextuals--background--surface--primary);
`;

/**
 * Two optional settings, kept in this browser: the user's field, so that
 * Robin's examples and the library fit their work, and a beginner mode.
 */
export const ProfileSettings = () => {
  const { t, i18n } = useTranslation();
  const job = useProfileStore((state) => state.job);
  const setJob = useProfileStore((state) => state.setJob);
  const isBeginner = useProfileStore((state) => state.isBeginner);
  const setBeginner = useProfileStore((state) => state.setBeginner);
  const categories = useMemo(
    () => getPromptLibrary(i18n.language).categories,
    [i18n.language],
  );

  return (
    <Box
      role="group"
      aria-label={t('My profile')}
      $gap="8px"
      $css={css`
        padding-top: 12px;
        border-top: 1px solid var(--c--contextuals--border--surface--primary);
      `}
    >
      <Box $direction="row" $align="center" $gap="8px">
        <label htmlFor="robin-job">
          <Text $size="sm" $weight="600">
            {t('My field')}
          </Text>
        </label>
        <Box
          as="select"
          id="robin-job"
          value={job?.id ?? ''}
          onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
            const category = categories.find(
              (item) => item.id === event.target.value,
            );
            setJob(
              category ? { id: category.id, label: category.title } : null,
            );
          }}
          $css={selectCss}
        >
          <option value="">{t('Not specified')}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.title}
            </option>
          ))}
        </Box>
        <Button
          size="small"
          color={isBeginner ? 'brand' : 'neutral'}
          variant={isBeginner ? 'secondary' : 'tertiary'}
          aria-pressed={isBeginner}
          onClick={() => setBeginner(!isBeginner)}
          icon={
            <Icon
              iconName={isBeginner ? 'check' : 'emoji_people'}
              $size="16px"
            />
          }
        >
          {t('I am a beginner')}
        </Button>
      </Box>
      <Text $size="xs" $variation="secondary">
        {isBeginner
          ? t('Beginner mode: fewer details on screen, simpler words.')
          : t('Robin adapts its examples and the library to your field.')}
      </Text>
    </Box>
  );
};
