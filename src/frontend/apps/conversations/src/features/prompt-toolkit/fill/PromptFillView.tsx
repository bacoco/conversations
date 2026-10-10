import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text, useToast } from '@/components';

import type { FillMode } from '../coach/coachApi';
import { languageName } from '../coach/language';
import { CoachStatus } from '../components/CoachStatus';
import { RefineBar } from '../components/RefineBar';
import { SavePromptButton } from '../library/SavePromptButton';
import { useReward } from '../rewards/useReward';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';
import { usePlacePrompt } from '../tools/usePlacePrompt';

import {
  GuidedThread,
  NestorBubble,
  UserBubble,
  bubbleCss,
} from './GuidedThread';
import { useGuidedFill } from './useGuidedFill';

export { NestorBubble, bubbleCss };

/**
 * Completes a prompt template by asking the user, one question at a time,
 * for what it is missing; ends with a prompt ready to send, no brackets left.
 */
export const PromptFillView = ({
  template,
  title,
  context = '',
  mode = 'template',
}: {
  template: string;
  title: string;
  context?: string;
  mode?: FillMode;
}) => {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const placePrompt = usePlacePrompt();
  const reward = useReward();
  const closeFill = usePromptToolkitStore((state) => state.closeFill);
  const resetCount = usePromptToolkitStore((state) => state.resetCount);
  const fill = useGuidedFill({
    template,
    language: languageName(i18n.language),
    context,
    mode,
    restartKey: resetCount,
  });
  const { exchanges, final, status, adjustments, isAdjusting } = fill;
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ block: 'nearest' });
  }, [final, adjustments]);

  const copy = async (prompt: string) => {
    await navigator.clipboard.writeText(prompt);
    showToast('success', t('Copied to clipboard.'), undefined, 2000);
  };

  return (
    <Box $css="min-height: 100%;">
      <CoachStatus
        isLoading={status === 'loading' || isAdjusting}
        loadingLabel={
          isAdjusting
            ? t('Nestor is changing the prompt…')
            : exchanges.length === 0
              ? t('Nestor is reading the prompt…')
              : t('Nestor is preparing the next step…')
        }
      />
      <Box $gap="14px" $padding={{ all: 'base' }} $css="flex: 1;">
        <Box $direction="row" $align="center" $gap="10px">
          <Button
            size="small"
            color="neutral"
            variant="tertiary"
            onClick={closeFill}
            aria-label={t('Back')}
            icon={<Icon iconName="arrow_back" $size="18px" />}
          />
          <Box $css="min-width: 0;">
            <Text as="h2" $size="md" $weight="700" $margin="0">
              {t('Complete the prompt')}
            </Text>
            <Text $size="xs" $variation="secondary" $ellipsis>
              {title}
            </Text>
          </Box>
        </Box>

        <Text $size="sm" $variation="secondary">
          {mode === 'draft'
            ? t(
                'Nestor asks you two or three questions, then writes a stronger version of your prompt.',
              )
            : t(
                'Nestor asks you a few questions, then writes the complete prompt for you.',
              )}
        </Text>

        {/* The starting request stays in view, at the top of the thread. */}
        <Box $gap="4px" $align="flex-end">
          <Text $size="xs" $weight="600" $variation="secondary">
            {mode === 'draft' ? t('Your request') : t('Starting prompt')}
          </Text>
          <Box
            $css={css`
              ${bubbleCss(true)}
              max-height: 180px;
              overflow-y: auto;
            `}
          >
            {template}
          </Box>
        </Box>

        <GuidedThread fill={fill} />

        {/* Nestor's word on the result comes before any change asked. */}
        {final?.message && <NestorBubble>{final.message}</NestorBubble>}

        {adjustments.length > 0 && (
          <Box
            as="ol"
            $gap="10px"
            $css="margin: 0; padding: 0; list-style: none;"
          >
            {adjustments.map((item, index) => (
              <Box as="li" key={index} $gap="10px">
                <UserBubble>{item.request}</UserBubble>
                <NestorBubble>{item.reply}</NestorBubble>
              </Box>
            ))}
          </Box>
        )}

        {final && (
          <Box
            $gap="10px"
            $css={css`
              padding: 14px;
              border-radius: 12px;
              border: 1px solid
                var(--c--contextuals--border--semantic--success--secondary);
              background: var(
                --c--contextuals--background--semantic--success--tertiary
              );
            `}
          >
            <Box $direction="row" $align="center" $gap="8px">
              <Icon iconName="check_circle" $size="20px" $theme="success" />
              <Text $weight="700">{t('Your prompt is ready')}</Text>
            </Box>
            <Text
              $size="sm"
              $css={css`
                display: block;
                max-height: 320px;
                overflow-y: auto;
                padding: 10px 12px;
                border-radius: 8px;
                white-space: pre-wrap;
                line-height: 1.5;
                background: var(--c--contextuals--background--surface--primary);
              `}
            >
              {final.prompt}
            </Text>
            <Box $direction="row" $gap="8px" $justify="flex-end">
              <Button
                size="small"
                color="neutral"
                variant="tertiary"
                onClick={() => void copy(final.prompt)}
                icon={<Icon iconName="content_copy" $size="16px" />}
              >
                {t('Copy')}
              </Button>
              <SavePromptButton prompt={final.prompt} title={title} />
              <Button
                size="small"
                onClick={() => {
                  placePrompt(final.prompt);
                  reward('fill');
                  closeFill();
                }}
                icon={<Icon iconName="north_west" $size="16px" />}
              >
                {t('Use this prompt')}
              </Button>
            </Box>
            <RefineBar
              onRefine={(request) => void fill.adjust(request)}
              isRefining={isAdjusting}
            />
          </Box>
        )}
        <div ref={bottomRef} />
      </Box>
    </Box>
  );
};
