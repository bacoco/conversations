import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import type { PromptPartKind } from './tools';

/** One colour per part, the same everywhere: the four rules of a request. */
const TONES: Record<PromptPartKind, string> = {
  context: 'success',
  instruction: 'info',
  format: 'warning',
  document: 'brand',
};

/** The parts in the order of the request sent, numbered 1 to 4. */
export const PART_ORDER: PromptPartKind[] = [
  'context',
  'instruction',
  'format',
  'document',
];

export const partCss = (kind: PromptPartKind) => css`
  padding: 12px 14px;
  border-radius: 10px;
  border-left: 4px solid
    var(--c--contextuals--border--semantic--${TONES[kind]}--primary);
  background: var(
    --c--contextuals--background--semantic--${TONES[kind]}--tertiary
  );
`;

const numberCss = (kind: PromptPartKind) => css`
  flex: none;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 800;
  color: #fff;
  background: var(--c--contextuals--border--semantic--${TONES[kind]}--primary);
`;

const chipCss = (kind: PromptPartKind) => css`
  flex: none;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--c--contextuals--content--semantic--${TONES[kind]}--primary);
  border: 1px solid
    var(--c--contextuals--border--semantic--${TONES[kind]}--secondary);
  background: var(--c--contextuals--background--surface--primary);
`;

export const usePartLabels = (): Record<
  PromptPartKind,
  { label: string; role: string }
> => {
  const { t } = useTranslation();
  return {
    context: {
      label: t('Context'),
      role: t('The situation, the purpose, who it is for.'),
    },
    instruction: {
      label: t('Precise instruction'),
      role: t('What the AI must do, and what it must not invent.'),
    },
    format: {
      label: t('Expected format'),
      role: t('Length, structure, tone.'),
    },
    document: {
      label: t('Reference document'),
      role: t('Your text, given as it is: the AI works on it.'),
    },
  };
};

/** "② Precise instruction → what it is for", in the colour of the part. */
export const PartHeader = ({
  kind,
  id,
}: {
  kind: PromptPartKind;
  /** Names the block's field, for screen readers. */
  id?: string;
}) => {
  const labels = usePartLabels();
  return (
    <Box $direction="row" $align="center" $gap="6px" $css="flex-wrap: wrap;">
      <Box as="span" $align="center" $justify="center" $css={numberCss(kind)}>
        {PART_ORDER.indexOf(kind) + 1}
      </Box>
      <Box as="span" id={id} $css={chipCss(kind)}>
        {labels[kind].label}
      </Box>
      <Icon iconName="arrow_forward" $size="16px" $variation="secondary" />
      <Text $size="xs" $variation="secondary" $css="flex: 1; min-width: 0;">
        {labels[kind].role}
      </Text>
    </Box>
  );
};
