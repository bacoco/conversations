import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text, useToast } from '@/components';

import { useAiAvailable } from '../coach/aiAvailability';
import type { GeneratedPrompt } from '../coach/coachApi';
import { hasPlaceholders } from '../coach/coachApi';
import { useOfferPrompt } from '../fill/useOfferPrompt';
import { PromptActions } from '../library/PromptActions';
import { SavePromptButton } from '../library/SavePromptButton';
import { getPromptLibrary } from '../library/content';
import { searchPhrases } from '../library/embeddingSearch';
import type { LibraryPrompt } from '../library/types';
import type { Phrase } from '../phrases/types';
import {
  CoachMode,
  usePromptToolkitStore,
} from '../stores/usePromptToolkitStore';

/** Pause in typing before searching the library by meaning. */
export const INSTANT_DELAY_MS = 400;

export const optionCss = (isChecked: boolean) => css`
  flex: 1;
  min-width: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  height: 32px;
  padding: 0 6px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font: inherit;
  font-size: 0.8125rem;
  font-weight: ${isChecked ? 600 : 400};
  white-space: nowrap;
  color: ${
    isChecked
      ? 'var(--c--contextuals--content--semantic--brand--primary)'
      : 'var(--c--contextuals--content--semantic--neutral--secondary)'
  };
  background: ${
    isChecked
      ? 'var(--c--contextuals--background--semantic--brand--tertiary)'
      : 'transparent'
  };
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 1px;
  }
`;

/** Always visible at the top of the coach: analyse, help, or as you type. */
export const CoachModeTabs = () => {
  const { t } = useTranslation();
  const coachMode = usePromptToolkitStore((state) => state.coachMode);
  const setCoachMode = usePromptToolkitStore((state) => state.setCoachMode);
  const options: { mode: CoachMode; icon: string; label: string }[] = [
    { mode: 'manual', icon: 'grading', label: t('Analysis') },
    { mode: 'assist', icon: 'auto_awesome', label: t('Prompt help') },
    { mode: 'instant', icon: 'bolt', label: t('As you type') },
    // The review of the whole session takes the full second line.
    { mode: 'session', icon: 'insights', label: t('Session review') },
  ];

  return (
    <Box
      role="radiogroup"
      aria-label={t('Coach mode')}
      $css={css`
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 4px;
        margin: 12px 16px 0;
        padding: 4px;
        border-radius: 8px;
        border: 1px solid var(--c--contextuals--border--surface--primary);
        & > :last-child {
          grid-column: 1 / -1;
        }
      `}
    >
      {options.map((option) => (
        <Box
          key={option.mode}
          as="button"
          type="button"
          role="radio"
          aria-checked={coachMode === option.mode}
          onClick={() => setCoachMode(option.mode)}
          $direction="row"
          $css={optionCss(coachMode === option.mode)}
        >
          <Icon iconName={option.icon} $size="16px" $withThemeInherited />
          {option.label}
        </Box>
      ))}
    </Box>
  );
};

const cardCss = css`
  padding: 12px;
  border-radius: 10px;
  border: 1px solid var(--c--contextuals--border--surface--primary);
`;

const promptTextCss = css`
  display: block;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  line-height: 1.5;
  padding: 10px 12px;
  border-radius: 8px;
  background: var(--c--contextuals--background--surface--secondary);
`;

/** A written variant: the text, why it helps, and what to do with it. */
const VariantCard = ({ variant }: { variant: GeneratedPrompt }) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const offerPrompt = useOfferPrompt();
  return (
    <Box as="li" $gap="8px" $css={cardCss}>
      <Box $gap="2px">
        <Text $size="sm" $weight="700">
          {variant.title}
        </Text>
        {variant.why && (
          <Text $size="xs" $variation="secondary">
            {variant.why}
          </Text>
        )}
      </Box>
      <Text $size="sm" $css={promptTextCss}>
        {variant.prompt}
      </Text>
      <Box
        $direction="row"
        $gap="8px"
        $justify="flex-end"
        $css="flex-wrap: wrap;"
      >
        <SavePromptButton prompt={variant.prompt} title={variant.title} />
        <Button
          size="small"
          color="neutral"
          variant="tertiary"
          onClick={() => {
            void navigator.clipboard.writeText(variant.prompt);
            showToast('success', t('Copied to clipboard.'), undefined, 2000);
          }}
          icon={<Icon iconName="content_copy" $size="16px" />}
        >
          {t('Copy')}
        </Button>
        <Button
          size="small"
          onClick={() => offerPrompt(variant.prompt, variant.title)}
          icon={<Icon iconName="north_west" $size="16px" />}
        >
          {t('Use')}
        </Button>
      </Box>
    </Box>
  );
};

const matchHeaderCss = css`
  width: 100%;
  padding: 10px 12px;
  border: none;
  cursor: pointer;
  font: inherit;
  color: inherit;
  text-align: left;
  background: transparent;
  &:hover {
    background: var(--c--contextuals--background--semantic--brand--tertiary);
  }
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: -2px;
  }
`;

/** A library prompt: one line; a click shows its text and what to do. */
const LibraryMatch = ({
  prompt,
  isFirst = false,
}: {
  prompt: LibraryPrompt;
  /** The best match is open right away. */
  isFirst?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(isFirst);
  return (
    <Box
      as="li"
      $css={css`
        overflow: hidden;
        border-radius: 10px;
        border: 1px solid
          ${
            isOpen
              ? 'var(--c--contextuals--border--semantic--brand--primary)'
              : 'var(--c--contextuals--border--surface--primary)'
          };
      `}
    >
      <Box
        as="button"
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((value) => !value)}
        $direction="row"
        $align="center"
        $gap="10px"
        $css={matchHeaderCss}
      >
        <Icon iconName="menu_book" $size="18px" $theme="brand" />
        <Box $gap="2px" $css="flex: 1; min-width: 0;">
          <Text $size="sm" $weight="700">
            {prompt.title}
          </Text>
          <Text $size="xs" $variation="secondary">
            {prompt.description}
          </Text>
        </Box>
        <Icon
          iconName={isOpen ? 'expand_less' : 'expand_more'}
          $size="20px"
          $variation="secondary"
        />
      </Box>
      {isOpen && (
        <Box $gap="10px" $css="padding: 0 12px 12px;">
          <Text $size="xs" $css={promptTextCss}>
            {prompt.prompt}
          </Text>
          <PromptActions prompt={prompt.prompt} title={prompt.title} />
        </Box>
      )}
    </Box>
  );
};

const listCss = 'margin: 0; padding: 0; list-style: none;';

const Section = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <Box $gap="8px">
    <Text as="h3" $size="sm" $weight="700" $margin="0">
      {title}
    </Text>
    <Box as="ul" $gap="8px" $css={listCss}>
      {children}
    </Box>
  </Box>
);

/** "Prompt help": variants written by the model, then library matches. */
export const AssistResults = ({
  variants,
  matches,
}: {
  variants: GeneratedPrompt[];
  matches: LibraryPrompt[];
}) => {
  const { t } = useTranslation();
  return (
    <Box $gap="16px" $padding={{ all: 'base' }}>
      {variants.length > 0 && (
        <Section title={t('Suggested versions')}>
          {variants.map((variant) => (
            <VariantCard key={variant.prompt} variant={variant} />
          ))}
        </Section>
      )}
      {matches.length > 0 && (
        <Section title={t('Matching prompts in the library')}>
          {matches.map((prompt) => (
            <LibraryMatch key={prompt.id} prompt={prompt} />
          ))}
        </Section>
      )}
    </Box>
  );
};

/** One tone per category, so the tags are told apart at a glance. */
const TAG_TONES = ['brand', 'info', 'success', 'warning', 'error'] as const;

const toneOf = (categoryId: string) =>
  TAG_TONES[
    [...categoryId].reduce((sum, char) => sum + char.charCodeAt(0), 0) %
      TAG_TONES.length
  ];

const phraseRowCss = css`
  width: 100%;
  min-height: 52px;
  padding: 10px 14px;
  border-radius: 12px;
  cursor: pointer;
  font: inherit;
  color: inherit;
  text-align: left;
  border: 1px solid var(--c--contextuals--border--surface--primary);
  background: var(--c--contextuals--background--surface--primary);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease,
    transform 0.15s ease;
  &:hover {
    border-color: var(--c--contextuals--border--semantic--brand--primary);
    box-shadow: 0 4px 12px rgba(0, 0, 145, 0.08);
    transform: translateY(-1px);
  }
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 2px;
  }
  @media (prefers-reduced-motion: reduce) {
    transition: none;
    &:hover {
      transform: none;
    }
  }
`;

const tagCss = (tone: (typeof TAG_TONES)[number]) => css`
  flex: none;
  padding: 2px 10px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 600;
  white-space: nowrap;
  color: var(--c--contextuals--content--semantic--${tone}--primary);
  border: 1px solid var(--c--contextuals--border--semantic--${tone}--secondary);
  background: var(--c--contextuals--background--semantic--${tone}--tertiary);
`;

/** The improved version of a request: another colour, so it stands apart. */
const improvedRowCss = css`
  ${phraseRowCss}
  border-color: var(--c--contextuals--border--semantic--brand--secondary);
  background: var(--c--contextuals--background--semantic--brand--tertiary);
`;

/**
 * One request, a click puts it in the message field. When the library has a
 * full template for it, that template comes right below as a second
 * suggestion, in another colour: the improved version of the first.
 */
const PhraseRow = ({
  phrase,
  showImproved,
  onUse,
}: {
  phrase: Phrase;
  /** False when an earlier request already shows the same template. */
  showImproved: boolean;
  onUse?: (text: string) => void;
}) => {
  const { t, i18n } = useTranslation();
  // Nestor asks for what is missing ([date], [recipient]…) when he can.
  const offerPrompt = useOfferPrompt();
  const isAiAvailable = useAiAvailable();
  const template =
    showImproved && phrase.templateId
      ? getPromptLibrary(i18n.language).prompts.find(
          (prompt) => prompt.id === phrase.templateId,
        )
      : undefined;
  return (
    <>
      <li>
        <Box
          as="button"
          type="button"
          disabled={!onUse}
          onClick={() => onUse?.(phrase.text)}
          $direction="row"
          $align="center"
          $gap="12px"
          $css={phraseRowCss}
        >
          <Box as="span" $css={tagCss(toneOf(phrase.category.id))}>
            {phrase.category.label}
          </Box>
          <Text $weight="600" $css="flex: 1; min-width: 0;">
            {phrase.text}
          </Text>
          <Icon iconName="north_west" $size="18px" $variation="secondary" />
        </Box>
      </li>
      {template && (
        <li>
          <Box
            as="button"
            type="button"
            disabled={!onUse}
            onClick={() => offerPrompt(template.prompt, template.title)}
            $direction="row"
            $align="center"
            $gap="12px"
            $css={improvedRowCss}
          >
            <Box
              as="span"
              $direction="row"
              $align="center"
              $gap="4px"
              $css={tagCss('brand')}
            >
              <Icon iconName="auto_awesome" $size="14px" $withThemeInherited />
              {t('Improved version')}
            </Box>
            <Box $gap="2px" $css="flex: 1; min-width: 0;">
              <Text $weight="600">{template.title}</Text>
              <Text $size="xs" $variation="secondary">
                {template.description}
              </Text>
              {isAiAvailable && hasPlaceholders(template.prompt) && (
                <Text $size="xs" $theme="brand" $weight="600">
                  {t('Nestor will ask you what is missing.')}
                </Text>
              )}
            </Box>
            <Icon iconName="north_west" $size="18px" $theme="brand" />
          </Box>
        </li>
      )}
    </>
  );
};

/** How many phrases are offered at a time. */
const PHRASE_COUNT = 6;

/**
 * "As you type": ready-made, well-phrased requests closest in meaning to
 * what is being typed (embeddings). One click puts it in the message field.
 */
export const InstantSuggestions = ({ text }: { text: string }) => {
  const { t, i18n } = useTranslation();
  const setChatInput = usePromptToolkitStore((state) => state.setChatInput);
  const [phrases, setPhrases] = useState<Phrase[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasError, setHasError] = useState(false);
  const query = text.trim();

  useEffect(() => {
    if (!query) {
      setPhrases([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsSearching(true);
      searchPhrases(query, i18n.language, PHRASE_COUNT, controller.signal)
        .then((found) => {
          setPhrases(found);
          setHasError(false);
        })
        .catch(() => {
          if (!controller.signal.aborted) {
            setHasError(true);
          }
        })
        .finally(() => {
          if (!controller.signal.aborted) {
            setIsSearching(false);
          }
        });
    }, INSTANT_DELAY_MS);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, i18n.language]);

  // Nothing typed yet: the coach shows how this mode works instead.
  if (!query) {
    return null;
  }
  return (
    <Box $gap="14px" $padding={{ all: 'base' }} aria-busy={isSearching}>
      <Box $gap="2px">
        <Text as="h3" $size="md" $weight="700" $margin="0">
          {t('Suggested requests')}
        </Text>
        <Text $size="sm" $variation="secondary">
          {t('Click a request to put it in the message field.')}
        </Text>
      </Box>
      {hasError && (
        <Text $size="sm" $theme="danger">
          {t('The suggestions are unavailable for now.')}
        </Text>
      )}
      <Box
        as="ul"
        $gap="10px"
        $css={css`
          ${listCss}
          opacity: ${isSearching ? 0.6 : 1};
          transition: opacity 0.15s ease;
        `}
      >
        {phrases.map((phrase, index) => (
          <PhraseRow
            key={phrase.id}
            phrase={phrase}
            // The same template shows only once, under the first request.
            showImproved={
              !phrases
                .slice(0, index)
                .some((earlier) => earlier.templateId === phrase.templateId)
            }
            onUse={setChatInput ?? undefined}
          />
        ))}
      </Box>
    </Box>
  );
};
