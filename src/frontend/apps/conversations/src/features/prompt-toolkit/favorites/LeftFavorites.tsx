import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { Icon, Text } from '@/components';
import { useAuthQuery } from '@/features/auth';

import { C } from '../chat/ui';
import { claimNestorData } from '../stores/accountScope';

import { useFavorites } from './useFavorites';

const Section = styled.section`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 var(--c--globals--spacings--sm);
  margin-top: var(--c--globals--spacings--base);
`;

const Row = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 6px 8px;
  border: 0;
  border-radius: 6px;
  background: transparent;
  font: inherit;
  font-size: 14px;
  text-align: left;
  color: ${C.ink};
  cursor: pointer;
  & > span:last-child {
    flex: 1;
    min-width: 0;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
  &:hover {
    background: var(--c--contextuals--background--semantic--neutral--tertiary);
  }
  &:focus-visible {
    outline: 2px solid ${C.brand};
    outline-offset: -2px;
  }
`;

const Hint = styled.p`
  margin: 0;
  padding: 0 8px 4px;
  font-size: 12px;
  line-height: 1.4;
  color: ${C.muted};
`;

/**
 * « Mes favoris », in the Assistant's left bar: the models the agent
 * starred and the requests they kept, one click from the message field.
 * Kept in this browser, for this account only.
 */
export const LeftFavorites = () => {
  const { t } = useTranslation();
  const { data: user } = useAuthQuery();
  const { favorites: all, use } = useFavorites();
  // Nothing personal is shown before this account's data is claimed.
  const [claimedFor, setClaimedFor] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) {
      return;
    }
    let isCurrent = true;
    void claimNestorData(user.id).then(() => {
      if (isCurrent) {
        setClaimedFor(user.id);
      }
    });
    return () => {
      isCurrent = false;
    };
  }, [user?.id]);

  const favorites = !!user?.id && claimedFor === user.id ? all : [];

  return (
    <Section aria-label={t('My favorites')}>
      <Text
        $size="xs"
        $theme="neutral"
        $textTransform="uppercase"
        $variation="tertiary"
        $padding={{ horizontal: 'xs', bottom: '6px' }}
        $weight="500"
      >
        {t('My favorites')}
      </Text>
      {favorites.length === 0 ? (
        <Hint>
          {t(
            'Star a request in Nestor: it waits for you here, one click away.',
          )}
        </Hint>
      ) : (
        favorites.map((favorite) => (
          <Row
            key={favorite.key}
            type="button"
            title={favorite.title}
            onClick={() => use(favorite)}
          >
            <Icon
              iconName="star"
              $size="16px"
              aria-hidden="true"
              $theme="brand"
            />
            <span>{favorite.title}</span>
          </Row>
        ))
      )}
    </Section>
  );
};
