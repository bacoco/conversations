import { Button, Modal, ModalSize } from '@gouvfr-lasuite/cunningham-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { PART_ORDER, PartHeader, partCss } from './promptParts';
import type { PromptPart } from './tools';

/**
 * The request as the Assistant will receive it, to look at: the same four
 * blocks and colours as on the screen where it is written. "Help" says
 * what the four parts of a good request are, whatever the tool.
 */
export const PromptExplained = ({
  parts,
  isNestor = false,
  onClose,
  onAsk,
  onPrepare,
}: {
  parts: PromptPart[];
  /** The request goes to Nestor's questions first, not to the Assistant. */
  isNestor?: boolean;
  onClose: () => void;
  onAsk: () => void;
  onPrepare: () => void;
}) => {
  const { t } = useTranslation();
  const [showHelp, setShowHelp] = useState(false);

  return (
    <Modal
      isOpen
      closeOnClickOutside
      size={ModalSize.LARGE}
      onClose={onClose}
      title={t('Your request, explained')}
      rightActions={
        <>
          <Button color="neutral" variant="tertiary" onClick={onPrepare}>
            {t('Put it in the message field')}
          </Button>
          <Button
            onClick={onAsk}
            icon={
              <Icon iconName={isNestor ? 'edit_note' : 'send'} $size="18px" />
            }
          >
            {isNestor ? t('Start with Nestor') : t('Ask the Assistant')}
          </Button>
        </>
      }
    >
      <Box $gap="14px" $css="text-align: left;">
        <Box $direction="row" $align="center" $gap="12px">
          <Text $size="sm" $variation="secondary" $css="flex: 1;">
            {t(
              'This is exactly what the Assistant will receive. Each colour has a role.',
            )}
          </Text>
          <Button
            size="small"
            color="neutral"
            variant="secondary"
            aria-expanded={showHelp}
            onClick={() => setShowHelp((value) => !value)}
            icon={<Icon iconName="help" $size="18px" />}
          >
            {t('Help')}
          </Button>
        </Box>

        {showHelp && (
          <Box
            role="note"
            $gap="8px"
            $css={css`
              padding: 12px 14px;
              border-radius: 10px;
              background: var(--c--contextuals--background--surface--secondary);
            `}
          >
            <Text $size="sm" $weight="700">
              {t('A good request always has these four parts')}
            </Text>
            {PART_ORDER.map((kind) => (
              <PartHeader key={kind} kind={kind} />
            ))}
            <Text $size="xs" $variation="secondary">
              {t(
                'Whatever the tool, the request sent to the Assistant follows this structure.',
              )}
            </Text>
          </Box>
        )}

        <Box
          as="ol"
          $gap="10px"
          $css="margin: 0; padding: 0; list-style: none;"
        >
          {parts.map((part) => (
            <Box as="li" key={part.kind} $gap="6px" $css={partCss(part.kind)}>
              <PartHeader kind={part.kind} />
              <Text
                $size="sm"
                $css={css`
                  white-space: pre-wrap;
                  overflow-wrap: anywhere;
                  ${
                    part.kind === 'document'
                      ? 'max-height: 180px; overflow-y: auto;'
                      : ''
                  }
                `}
              >
                {part.text}
              </Text>
            </Box>
          ))}
        </Box>
      </Box>
    </Modal>
  );
};
