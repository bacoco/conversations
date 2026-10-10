import { useTranslation } from 'react-i18next';

import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

/** Nestor strengthens what the user is typing, from anywhere in the panel. */
export const useAskNestor = () => {
  const { t } = useTranslation();
  const chatInput = usePromptToolkitStore((state) => state.chatInput);
  const startFill = usePromptToolkitStore((state) => state.startFill);
  const draft = chatInput.trim();

  return {
    canAsk: draft !== '',
    ask: () => startFill(draft, t('Your prompt'), '', 'draft'),
  };
};
