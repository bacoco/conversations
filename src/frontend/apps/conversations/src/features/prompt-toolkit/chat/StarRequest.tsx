import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { Icon } from '@/components';

import { languageName } from '../coach/language';
import { useMyPromptsStore } from '../library/useMyPromptsStore';

import { nameRequest } from './nestorChatApi';
import { C } from './ui';

const Star = styled.button`
  flex: none;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  border: 1px solid ${C.brandLine};
  border-radius: 50%;
  background: #ffffff;
  color: ${C.brand};
  cursor: pointer;
  &[aria-pressed='true'] {
    background: ${C.brandSoft};
  }
  &:focus-visible {
    outline: 2px solid ${C.brand};
    outline-offset: 2px;
  }
`;

/**
 * The star beside a request: kept in « Mes favoris » (the Assistant's left
 * bar), or taken back.
 */
export const StarRequest = ({ text }: { text: string }) => {
  const { t } = useTranslation();
  const kept = useMyPromptsStore((state) =>
    state.prompts.find((item) => item.prompt.trim() === text.trim()),
  );
  const { i18n } = useTranslation();
  const save = useMyPromptsStore((state) => state.save);
  const remove = useMyPromptsStore((state) => state.remove);
  /**
   * Kept at once under its first words; Nestor's short name replaces them
   * when it comes (nothing changes if it does not).
   */
  const keep = () => {
    if (!save(text)) return;
    void nameRequest(text, languageName(i18n.language))
      .then((title) => {
        const saved = useMyPromptsStore
          .getState()
          .prompts.find((item) => item.prompt === text.trim());
        if (title && saved)
          useMyPromptsStore.getState().rename(saved.id, title);
      })
      .catch(() => undefined);
  };
  return (
    <Star
      type="button"
      aria-pressed={!!kept}
      aria-label={
        kept ? t('Remove from my favorites') : t('Keep in my favorites')
      }
      title={kept ? t('Remove from my favorites') : t('Keep in my favorites')}
      onClick={() => (kept ? remove(kept.id) : keep())}
    >
      <Icon
        iconName="star"
        $size="18px"
        $withThemeInherited
        variant={kept ? 'filled' : 'outlined'}
      />
    </Star>
  );
};
