import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { Icon } from '@/components';

import { C } from '../chat/ui';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

const Round = styled.button`
  width: 52px;
  height: 52px;
  border-radius: 50%;
  border: 1px solid ${C.brandLine};
  background: #ffffff;
  color: ${C.brand};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(30, 30, 46, 0.18);
  &:hover {
    background: ${C.brandSoft};
  }
  &:focus-visible {
    outline: 2px solid ${C.brand};
    outline-offset: 2px;
  }
`;

/**
 * Where the round star shows: every screen but the coach (its bar is at the
 * bottom), the favorites page itself and the welcome video.
 */
export const favoritesCornerShown = ({
  welcomeShown,
  isNestorChat,
  showFavorites,
}: {
  welcomeShown: boolean;
  isNestorChat: boolean;
  showFavorites: boolean;
}) => !welcomeShown && !isNestorChat && !showFavorites;

/** « Mes favoris », a round star at the bottom right of the panel. */
export const FavoritesButton = () => {
  const { t } = useTranslation();
  const openFavorites = usePromptToolkitStore((state) => state.openFavorites);
  return (
    <Round
      type="button"
      aria-label={t('My favorites')}
      title={t('My favorites')}
      onClick={() => openFavorites()}
    >
      <Icon iconName="star" $size="26px" $withThemeInherited />
    </Round>
  );
};
