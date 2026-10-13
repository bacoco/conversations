import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

import { useConversationRouteId } from '@/utils';

import { NEW_CHAT_KEY, useNestorChatStore } from '../stores/useNestorChatStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

import { C } from './ui';

const Bar = styled.div`
  flex: none;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 8px 12px;
  padding: 10px 12px;
  background: ${C.soft};
  border-bottom: 1px solid ${C.grey};
  font-size: 14px;
  & button {
    font: inherit;
    font-weight: 600;
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid ${C.brandLine};
    background: #ffffff;
    color: ${C.brandInk};
    cursor: pointer;
  }
`;

/** The coach's bin asks once: « Effacer le fil de Nestor ? Oui / Non ». */
export const EraseThreadBar = () => {
  const { t } = useTranslation();
  const conversationId = useConversationRouteId();
  const asked = usePromptToolkitStore((state) => state.eraseAsked);
  if (!asked) return null;
  const done = () => usePromptToolkitStore.setState({ eraseAsked: false });
  return (
    <Bar
      role="group"
      aria-label={t('Erase Nestor’s thread for this conversation?')}
    >
      <span>{t('Erase Nestor’s thread for this conversation?')}</span>
      <button
        type="button"
        onClick={() => {
          useNestorChatStore.getState().clear(conversationId ?? NEW_CHAT_KEY);
          done();
        }}
      >
        {t('Yes, erase it')}
      </button>
      <button type="button" onClick={done}>
        {t('No, keep it')}
      </button>
    </Bar>
  );
};
