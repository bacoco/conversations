import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { ROBIN_AVATAR_URL } from '../components/PanelHome';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

import { getPromptLibrary } from './content';
import { useRecommendations } from './useRecommendations';

const chipCss = css`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  border-radius: 999px;
  cursor: pointer;
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  text-align: left;
  color: var(--c--contextuals--content--semantic--brand--primary);
  border: 1px solid var(--c--contextuals--border--semantic--brand--secondary);
  background: var(--c--contextuals--background--surface--primary);
  &:hover {
    background: var(--c--contextuals--background--semantic--brand--tertiary);
  }
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 2px;
  }
`;

/**
 * "Robin suggests": ready-made prompts that fit what the user is typing.
 * A click starts Robin's guided questions, reusing what is already written.
 */
export const RecommendationBar = ({ isActive }: { isActive: boolean }) => {
  const { t, i18n } = useTranslation();
  const library = useMemo(
    () => getPromptLibrary(i18n.language),
    [i18n.language],
  );
  const chatInput = usePromptToolkitStore((state) => state.chatInput);
  const startFill = usePromptToolkitStore((state) => state.startFill);
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const suggestions = useRecommendations(chatInput, library, isActive);

  if (suggestions.length === 0 || dismissedFor === chatInput.trim()) {
    return null;
  }

  return (
    <Box
      role="region"
      aria-label={t('Robin suggests')}
      $gap="8px"
      $css={css`
        margin: 12px 16px 0;
        padding: 10px 12px;
        border-radius: 12px;
        border: 1px solid
          var(--c--contextuals--border--semantic--brand--secondary);
        background: var(
          --c--contextuals--background--semantic--brand--tertiary
        );
      `}
    >
      <Box $direction="row" $align="center" $gap="8px">
        <img
          src={ROBIN_AVATAR_URL}
          alt=""
          width={24}
          height={24}
          style={{ flex: 'none', borderRadius: '50%' }}
        />
        <Text $size="sm" $weight="700" $css="flex: 1;">
          {t('Robin suggests a ready-made prompt')}
        </Text>
        <Box
          as="button"
          type="button"
          aria-label={t('Hide the suggestions')}
          onClick={() => setDismissedFor(chatInput.trim())}
          $css="border: none; background: none; cursor: pointer; padding: 2px; color: inherit;"
        >
          <Icon iconName="close" $size="18px" $variation="secondary" />
        </Box>
      </Box>
      <Box $direction="row" $gap="6px" $css="flex-wrap: wrap;">
        {suggestions.map((prompt) => (
          <Box
            key={prompt.id}
            as="button"
            type="button"
            title={prompt.description}
            onClick={() => startFill(prompt.prompt, prompt.title, chatInput)}
            $direction="row"
            $css={chipCss}
          >
            <Icon iconName="auto_awesome" $size="16px" $withThemeInherited />
            {prompt.title}
          </Box>
        ))}
      </Box>
    </Box>
  );
};
