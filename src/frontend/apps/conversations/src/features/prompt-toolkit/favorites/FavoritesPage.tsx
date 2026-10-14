import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { Icon } from '@/components';

import { C } from '../chat/ui';

import { useFavorites } from './useFavorites';

// Centred in the panel, never stuck to the top.
const Page = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  gap: 12px;
  min-height: 100%;
  box-sizing: border-box;
  padding: 20px 16px;
  color: ${C.ink};
  & > p {
    margin: 0;
    font-size: 14px;
    line-height: 1.5;
    color: ${C.muted};
  }
`;

const List = styled.ul`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
  & > li {
    display: flex;
    align-items: center;
    gap: 6px;
  }
`;

const Use = styled.button`
  flex: 1;
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid ${C.line};
  border-radius: 12px;
  background: #ffffff;
  font: inherit;
  font-size: 14px;
  text-align: left;
  color: ${C.ink};
  cursor: pointer;
  &:hover {
    border-color: ${C.brandLine};
    background: #f7f6ff;
  }
  &:focus-visible {
    outline: 2px solid ${C.brand};
    outline-offset: 2px;
  }
`;

const Text = styled.span`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
  & > strong {
    font-weight: 700;
  }
  /* The start of the request; the whole of it on hover. */
  & > span {
    color: ${C.muted};
    font-size: 13px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
`;

const Remove = styled.button`
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: transparent;
  color: ${C.brand};
  cursor: pointer;
  &:hover {
    background: ${C.brandSoft};
  }
  &:focus-visible {
    outline: 2px solid ${C.brand};
  }
`;

/** « Mes favoris », a page of Nestor's panel: one click, in the field. */
export const FavoritesPage = () => {
  const { t } = useTranslation();
  const { favorites, use, remove } = useFavorites();

  return (
    <Page>
      {favorites.length === 0 ? (
        <p>
          {t(
            'Star a request in Nestor: it waits for you here, one click away.',
          )}
        </p>
      ) : (
        <>
          <p>{t('One click puts the request in the Assistant’s field.')}</p>
          <List>
            {favorites.map((favorite) => (
              <li key={favorite.key}>
                <Use
                  type="button"
                  title={favorite.prompt}
                  onClick={() => use(favorite)}
                >
                  <Icon
                    iconName="north_west"
                    $size="18px"
                    aria-hidden="true"
                    $theme="brand"
                  />
                  <Text>
                    <strong>{favorite.title}</strong>
                    <span>{favorite.prompt}</span>
                  </Text>
                </Use>
                <Remove
                  type="button"
                  aria-label={t('Remove "{{title}}" from favorites', {
                    title: favorite.title,
                  })}
                  title={t('Remove "{{title}}" from favorites', {
                    title: favorite.title,
                  })}
                  onClick={() => remove(favorite)}
                >
                  <Icon
                    iconName="star"
                    variant="filled"
                    $size="20px"
                    $withThemeInherited
                  />
                </Remove>
              </li>
            ))}
          </List>
        </>
      )}
    </Page>
  );
};
