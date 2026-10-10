import { useTranslation } from 'react-i18next';

import { useToast } from '@/components';
import { useResponsiveStore } from '@/stores';

import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

/**
 * Puts a prompt in the chat input, for the user to review and send. A text
 * already there is never lost: the user chooses to replace it or add after
 * it, unless the new text is a version of that very draft.
 */
export const usePlacePrompt = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { isDesktop } = useResponsiveStore();
  const setChatInput = usePromptToolkitStore((state) => state.setChatInput);
  const setPendingPlacement = usePromptToolkitStore(
    (state) => state.setPendingPlacement,
  );
  const close = usePromptToolkitStore((state) => state.close);

  return (prompt: string, options: { replaceDraft?: boolean } = {}) => {
    if (!setChatInput) {
      showToast('error', t('Open a conversation to use this prompt.'));
      return;
    }
    const draft = usePromptToolkitStore.getState().chatInput.trim();
    if (!options.replaceDraft && draft && draft !== prompt.trim()) {
      setPendingPlacement(prompt);
      return;
    }
    setChatInput(prompt);
    showToast(
      'success',
      t('Added to the message field: review it, then send it.'),
      undefined,
      4000,
    );
    // On mobile the panel covers the chat: get out of the way.
    if (!isDesktop) {
      close();
    }
  };
};
