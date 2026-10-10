import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text, useToast } from '@/components';

import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

/**
 * The message field already holds a text: replace it, add the request
 * after it, or keep it as it is. Shown on top of the panel until chosen.
 */
export const PlacementChoice = () => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const pending = usePromptToolkitStore((state) => state.pendingPlacement);
  const setPending = usePromptToolkitStore(
    (state) => state.setPendingPlacement,
  );
  const setChatInput = usePromptToolkitStore((state) => state.setChatInput);
  const boxRef = useRef<HTMLDivElement | null>(null);
  // Asked where the user is looking: the panel may be scrolled down.
  useEffect(() => {
    if (pending) {
      boxRef.current?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [pending]);

  if (!pending || !setChatInput) {
    return null;
  }
  const put = (text: string) => {
    setChatInput(text);
    setPending(null);
    showToast(
      'success',
      t('Added to the message field: review it, then send it.'),
      undefined,
      4000,
    );
  };
  const draft = usePromptToolkitStore.getState().chatInput;

  return (
    <Box
      ref={boxRef}
      role="alertdialog"
      aria-labelledby="nestor-placement-title"
      $gap="10px"
      $css={css`
        margin: 12px 16px 0;
        padding: 12px 14px;
        border-radius: 12px;
        border: 1px solid
          var(--c--contextuals--border--semantic--warning--primary);
        background: var(
          --c--contextuals--background--semantic--warning--tertiary
        );
      `}
    >
      <Box $direction="row" $gap="8px" $align="center">
        <Icon iconName="edit_note" $size="20px" $theme="warning" />
        <Text id="nestor-placement-title" $size="sm" $weight="700">
          {t('Your message field already holds a text.')}
        </Text>
      </Box>
      <Box $direction="row" $gap="6px" $css="flex-wrap: wrap;">
        <Button size="small" onClick={() => put(pending)}>
          {t('Replace it')}
        </Button>
        <Button
          size="small"
          color="neutral"
          variant="secondary"
          onClick={() => put(`${draft.trimEnd()}\n\n${pending}`)}
        >
          {t('Add after it')}
        </Button>
        <Button
          size="small"
          color="neutral"
          variant="tertiary"
          onClick={() => setPending(null)}
        >
          {t('Cancel')}
        </Button>
      </Box>
    </Box>
  );
};
