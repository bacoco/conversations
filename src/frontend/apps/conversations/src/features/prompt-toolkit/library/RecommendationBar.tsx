import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { ROBIN_AVATAR_URL } from '../components/PanelHome';
import { getCourseContent } from '../learn/content';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';
import { getDailyTools } from '../tools/tools';

import { getPromptLibrary } from './content';
import {
  Suggestion,
  libraryToSuggestions,
  useRecommendations,
} from './useRecommendations';

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
  const suggestions = useMemo<Suggestion[]>(() => {
    const tools = getDailyTools(t).map((tool) => ({
      key: `tool-${tool.id}`,
      kind: 'tool' as const,
      id: tool.id,
      title: tool.title,
      summary: `${tool.title} — ${tool.description}`,
    }));
    const lessons = getCourseContent(i18n.language).lessons.map(
      (lesson, index) => ({
        key: lesson.id,
        kind: 'lesson' as const,
        id: lesson.id,
        title: t('Lesson {{number}}: {{title}}', {
          number: index + 1,
          title: lesson.title,
        }),
        summary: `${lesson.title} — ${lesson.slides.map((s) => s.title).join(', ')}`,
      }),
    );
    return [...libraryToSuggestions(library), ...tools, ...lessons];
  }, [library, t, i18n.language]);
  const chatInput = usePromptToolkitStore((state) => state.chatInput);
  const startFill = usePromptToolkitStore((state) => state.startFill);
  const openTool = usePromptToolkitStore((state) => state.openTool);
  const openLesson = usePromptToolkitStore((state) => state.openLesson);
  const [dismissedFor, setDismissedFor] = useState<string | null>(null);
  const found = useRecommendations(chatInput, suggestions, isActive);

  if (found.length === 0 || dismissedFor === chatInput.trim()) {
    return null;
  }

  const choose = (suggestion: Suggestion) => {
    if (suggestion.kind === 'tool') {
      openTool(suggestion.id);
    } else if (suggestion.kind === 'lesson') {
      openLesson(suggestion.id);
    } else {
      const prompt = library.prompts.find((p) => p.id === suggestion.id);
      if (prompt) {
        startFill(prompt.prompt, prompt.title, chatInput);
      }
    }
  };
  const icon = { prompt: 'auto_awesome', tool: 'apps', lesson: 'school' };

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
          {t('Robin suggests')}
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
        {found.map((suggestion) => (
          <Box
            key={suggestion.key}
            as="button"
            type="button"
            onClick={() => choose(suggestion)}
            $direction="row"
            $css={chipCss}
          >
            <Icon
              iconName={icon[suggestion.kind]}
              $size="16px"
              $withThemeInherited
            />
            {suggestion.title}
          </Box>
        ))}
      </Box>
    </Box>
  );
};
