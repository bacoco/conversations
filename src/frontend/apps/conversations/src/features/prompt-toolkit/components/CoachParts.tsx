import { Button } from '@gouvfr-lasuite/cunningham-react';
import { ReactNode, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text, useToast } from '@/components';

import { wordDiff } from '../coach/wordDiff';
import { NestorBubble, UserBubble } from '../fill/GuidedThread';
import type { GuidedFill } from '../fill/useGuidedFill';
import { SavePromptButton } from '../library/SavePromptButton';
import { useCoachTipsStore } from '../stores/useCoachTipsStore';

import { DiffView } from './DiffView';
import { RefineBar } from './RefineBar';

/* Pieces shared by the moments of the coach's single screen. */

export const coachTextCss = css`
  display: block;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.5;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--c--contextuals--background--surface--primary);
`;

const toneCss = (tone: 'success' | 'brand') => css`
  padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--c--contextuals--border--semantic--${tone}--secondary);
  background: var(--c--contextuals--background--semantic--${tone}--tertiary);
`;

/** "What works": what the request already does well, before anything else. */
export const WorksBox = ({ items }: { items: string[] }) => {
  const { t } = useTranslation();
  if (items.length === 0) {
    return null;
  }
  return (
    <Box $direction="row" $gap="10px" $css={toneCss('success')}>
      <Icon iconName="check_circle" $size="20px" $theme="success" />
      <Box $gap="4px" $css="flex: 1; min-width: 0;">
        <Text $size="sm" $weight="700">
          {t('What already works')}
        </Text>
        {items.map((item) => (
          <Text key={item} $size="sm">
            {item}
          </Text>
        ))}
      </Box>
    </Box>
  );
};

/** A tip seen this many times is learnt: it is no longer shown. */
export const TIP_MAX_SHOWS = 3;

/** "To remember": one short habit, shown three times at most. */
export const RetainTip = ({
  tipKey,
  children,
}: {
  tipKey: string;
  children: string;
}) => {
  const { t } = useTranslation();
  const markShown = useCoachTipsStore((state) => state.markShown);
  // Decided once per appearance, so the tip does not vanish while read.
  const [isShown] = useState(
    () => (useCoachTipsStore.getState().shown[tipKey] ?? 0) < TIP_MAX_SHOWS,
  );
  const countedRef = useRef(false);
  useEffect(() => {
    if (isShown && !countedRef.current) {
      countedRef.current = true;
      markShown(tipKey);
    }
  }, [isShown, markShown, tipKey]);

  if (!isShown) {
    return null;
  }
  return (
    <Box
      $direction="row"
      $gap="10px"
      $css={css`
        padding: 12px 14px;
        border-radius: 12px;
        background: var(--c--contextuals--background--semantic--info--tertiary);
      `}
    >
      <Icon iconName="lightbulb" $size="20px" $theme="info" />
      <Box $gap="2px" $css="flex: 1; min-width: 0;">
        <Text $size="sm" $weight="700">
          {t('To remember')}
        </Text>
        <Text $size="sm">{children}</Text>
      </Box>
    </Box>
  );
};

/** A box that holds what the coach prepared: a request, a correction. */
export const ReadyBox = ({
  icon,
  title,
  tone = 'success',
  children,
}: {
  icon: string;
  title: string;
  tone?: 'success' | 'brand';
  children: ReactNode;
}) => (
  <Box $gap="10px" $css={toneCss(tone)}>
    <Box $direction="row" $align="center" $gap="8px">
      <Icon iconName={icon} $size="20px" $theme={tone} />
      <Text $weight="700">{title}</Text>
    </Box>
    {children}
  </Box>
);

export const actionsCss = 'flex-wrap: wrap;';

/**
 * The end of Nestor's questions: the complete request, what changed from
 * the user's own words, and how to use it.
 */
export const FinalRequest = ({
  fill,
  original,
  onPlace,
  saveTitle,
}: {
  fill: GuidedFill;
  /** The user's own words, to show what Nestor added. */
  original?: string;
  onPlace: (prompt: string) => void;
  saveTitle: string;
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [showDiff, setShowDiff] = useState(false);
  const { final, adjustments, isAdjusting } = fill;
  const diff = useMemo(
    () => (final && original ? wordDiff(original, final.prompt) : null),
    [final, original],
  );

  if (!final) {
    return null;
  }

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(final.prompt);
      showToast('success', t('Copied to clipboard.'), undefined, 2000);
    } catch {
      showToast('error', t('Copy refused: select the text instead.'));
    }
  };

  return (
    <>
      {/* Nestor's word on the result comes before any change asked. */}
      {final.message && <NestorBubble>{final.message}</NestorBubble>}
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
      <ReadyBox icon="check_circle" title={t('Your request is ready')}>
        {showDiff && diff ? (
          <DiffView parts={diff} />
        ) : (
          <Text $size="sm" $css={coachTextCss}>
            {final.prompt}
          </Text>
        )}
        <Box $direction="row" $gap="8px" $css={actionsCss}>
          {diff && (
            <Button
              size="small"
              color="neutral"
              variant="tertiary"
              aria-pressed={showDiff}
              onClick={() => setShowDiff((value) => !value)}
              icon={<Icon iconName="difference" $size="16px" />}
            >
              {showDiff ? t('Show the new version') : t('Show what changes')}
            </Button>
          )}
          <Button
            size="small"
            color="neutral"
            variant="tertiary"
            disabled={isAdjusting}
            onClick={() => void copy()}
            icon={<Icon iconName="content_copy" $size="16px" />}
          >
            {t('Copy')}
          </Button>
          <SavePromptButton prompt={final.prompt} title={saveTitle} />
          <Button
            size="small"
            disabled={isAdjusting}
            onClick={() => onPlace(final.prompt)}
            icon={<Icon iconName="north_west" $size="16px" />}
          >
            {t('Put in the message field')}
          </Button>
        </Box>
        <RefineBar
          onRefine={(request) => void fill.adjust(request)}
          isRefining={isAdjusting}
        />
      </ReadyBox>
    </>
  );
};

/**
 * A section folded by default; its content is only mounted when open, so
 * nothing inside runs while it is closed.
 */
export const Disclosure = ({
  label,
  icon,
  children,
}: {
  label: string;
  icon: string;
  children: ReactNode;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const id = useId();
  return (
    <Box $gap="12px">
      <Box
        as="button"
        type="button"
        aria-expanded={isOpen}
        aria-controls={id}
        onClick={() => setIsOpen((value) => !value)}
        $direction="row"
        $align="center"
        $gap="8px"
        $css={css`
          width: 100%;
          padding: 10px 12px;
          border-radius: 10px;
          cursor: pointer;
          font: inherit;
          font-size: 0.875rem;
          font-weight: 600;
          text-align: left;
          color: var(--c--contextuals--content--semantic--neutral--primary);
          border: 1px solid var(--c--contextuals--border--surface--primary);
          background: var(--c--contextuals--background--surface--primary);
          &:hover {
            background: var(
              --c--contextuals--background--semantic--brand--tertiary
            );
          }
          &:focus-visible {
            outline: 2px solid
              var(--c--contextuals--border--semantic--brand--primary);
            outline-offset: 2px;
          }
        `}
      >
        <Icon iconName={icon} $size="18px" $theme="brand" />
        <Box as="span" $css="flex: 1;">
          {label}
        </Box>
        <Icon
          iconName={isOpen ? 'expand_less' : 'expand_more'}
          $size="20px"
          $variation="secondary"
        />
      </Box>
      {isOpen && (
        <Box id={id} $gap="16px">
          {children}
        </Box>
      )}
    </Box>
  );
};

/** A quiet link-like action under Nestor's words. */
export const CoachLink = ({
  icon,
  children,
  onClick,
  disabled,
}: {
  icon: string;
  children: string;
  onClick: () => void;
  disabled?: boolean;
}) => (
  <Button
    size="small"
    color="brand"
    variant="tertiary"
    disabled={disabled}
    onClick={onClick}
    icon={<Icon iconName={icon} $size="16px" />}
  >
    {children}
  </Button>
);
