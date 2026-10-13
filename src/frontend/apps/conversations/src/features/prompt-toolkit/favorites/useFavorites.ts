import { useTranslation } from 'react-i18next';

import { useAiAvailable } from '../coach/aiAvailability';
import { hasPlaceholders } from '../coach/coachApi';
import { getPromptLibrary } from '../library/content';
import { templateVars } from '../library/templateVars';
import { useLibraryStore } from '../library/useLibraryStore';
import { useMyPromptsStore } from '../library/useMyPromptsStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';
import { usePlacePrompt } from '../tools/usePlacePrompt';

export interface Favorite {
  key: string;
  title: string;
  prompt: string;
  /** A starred library model, or a request the user kept. */
  kind: 'model' | 'mine';
  id: string;
}

/**
 * « Mes favoris »: the starred library models, then the kept requests.
 * `use` puts one in the Assistant's field; a model with blanks opens
 * Nestor to complete it, and closing that goes back where the user was.
 */
export const useFavorites = () => {
  const { i18n } = useTranslation();
  const favoriteIds = useLibraryStore((state) => state.favorites);
  const toggleFavorite = useLibraryStore((state) => state.toggleFavorite);
  const mine = useMyPromptsStore((state) => state.prompts);
  const removeMine = useMyPromptsStore((state) => state.remove);
  const placePrompt = usePlacePrompt();
  const startFill = usePromptToolkitStore((state) => state.startFill);
  const isAiAvailable = useAiAvailable();

  const favorites: Favorite[] = [
    ...getPromptLibrary(i18n.language)
      .prompts.filter((item) => favoriteIds.includes(item.id))
      .map((item) => ({
        key: `model-${item.id}`,
        title: item.title,
        prompt: item.prompt,
        kind: 'model' as const,
        id: item.id,
      })),
    ...mine.map((item) => ({
      key: `mine-${item.id}`,
      title: item.title,
      prompt: item.prompt,
      kind: 'mine' as const,
      id: item.id,
    })),
  ];

  const use = (favorite: Favorite) => {
    const hasBlanks =
      hasPlaceholders(favorite.prompt) ||
      templateVars(favorite.prompt).length > 0;
    if (hasBlanks && isAiAvailable) {
      usePromptToolkitStore.setState({ isOpen: true });
      startFill(favorite.prompt, favorite.title);
      return;
    }
    placePrompt(favorite.prompt);
  };

  const remove = (favorite: Favorite) =>
    favorite.kind === 'model'
      ? toggleFavorite(favorite.id)
      : removeMine(favorite.id);

  return { favorites, use, remove };
};
