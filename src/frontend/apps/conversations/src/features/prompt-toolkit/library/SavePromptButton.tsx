import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useTranslation } from 'react-i18next';

import { Icon, useToast } from '@/components';

import { useMyPromptsStore } from './useMyPromptsStore';

/** "Save": keeps a prompt in "My prompts", in this browser. */
export const SavePromptButton = ({
  prompt,
  title,
}: {
  prompt: string;
  title?: string;
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const isSaved = useMyPromptsStore((state) =>
    state.prompts.some((item) => item.prompt === prompt.trim()),
  );
  const save = useMyPromptsStore((state) => state.save);

  return (
    <Button
      size="small"
      color="neutral"
      variant="tertiary"
      disabled={isSaved}
      onClick={() => {
        if (save(prompt, title)) {
          showToast(
            'success',
            t('Saved in "My prompts", in the library.'),
            undefined,
            3000,
          );
        }
      }}
      icon={
        <Icon
          iconName={isSaved ? 'bookmark_added' : 'bookmark_add'}
          $size="16px"
        />
      }
    >
      {isSaved ? t('Saved') : t('Save')}
    </Button>
  );
};
