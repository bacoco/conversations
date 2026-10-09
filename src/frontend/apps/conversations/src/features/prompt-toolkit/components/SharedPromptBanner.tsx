import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text, useToast } from '@/components';

import { useMyPromptsStore } from '../library/useMyPromptsStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

/** A prompt received through a link: preview, then import or dismiss. */
export const SharedPromptBanner = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const shared = usePromptToolkitStore((state) => state.sharedPrompt);
  const clear = usePromptToolkitStore((state) => state.clearSharedPrompt);
  const save = useMyPromptsStore((state) => state.save);
  if (!shared) {
    return null;
  }
  const importPrompt = () => {
    const isNew = save(shared.prompt, shared.title || undefined);
    showToast(
      'success',
      isNew
        ? t('Added to My prompts, in the prompt library.')
        : t('This prompt is already in My prompts.'),
      undefined,
      4000,
    );
    clear();
  };
  return (
    <Box
      role="region"
      aria-label={t('Shared prompt')}
      $gap="10px"
      $css={css`
        margin: 12px 16px 0;
        padding: 12px 14px;
        border-radius: 12px;
        border: 1px solid
          var(--c--contextuals--border--semantic--brand--secondary);
        background: var(
          --c--contextuals--background--semantic--brand--tertiary
        );
      `}
    >
      <Box $direction="row" $align="center" $gap="8px">
        <Icon iconName="share" $size="20px" $theme="brand" />
        <Text $weight="700">
          {shared.title
            ? t('A colleague shares « {{title}} » with you', {
                title: shared.title,
              })
            : t('A colleague shares a prompt with you')}
        </Text>
      </Box>
      <Text
        $size="xs"
        $css={css`
          display: block;
          max-height: 140px;
          overflow-y: auto;
          white-space: pre-wrap;
          padding: 8px 10px;
          border-radius: 8px;
          background: var(--c--contextuals--background--surface--primary);
        `}
      >
        {shared.prompt}
      </Text>
      <Box $direction="row" $gap="8px" $justify="flex-end">
        <Button size="small" color="neutral" variant="tertiary" onClick={clear}>
          {t('Ignore')}
        </Button>
        <Button
          size="small"
          onClick={importPrompt}
          icon={<Icon iconName="bookmark_add" $size="16px" />}
        >
          {t('Add to My prompts')}
        </Button>
      </Box>
    </Box>
  );
};
