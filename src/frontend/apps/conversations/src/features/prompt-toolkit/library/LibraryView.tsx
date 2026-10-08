import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled, { css } from 'styled-components';

import { Box, Icon, Text, useToast } from '@/components';

import { hasPlaceholders } from '../coach/coachApi';
import { useOfferPrompt } from '../fill/useOfferPrompt';

import { getPromptLibrary } from './content';
import type { LibraryPrompt } from './types';
import { useLibraryStore } from './useLibraryStore';
import { useMyPromptsStore } from './useMyPromptsStore';

const FAVORITES = 'favorites';
const MINE = 'mine';

/** Lower case, without accents: "Réunion" matches "reunion". */
export const normalize = (text: string) =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

const matches = (prompt: LibraryPrompt, query: string) => {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const haystack = normalize(
    [prompt.title, prompt.description, prompt.keywords.join(' ')].join(' '),
  );
  return words.every((word) => haystack.includes(word));
};

const SearchInput = styled.input`
  width: 100%;
  height: 40px;
  padding: 0 12px 0 38px;
  border-radius: 8px;
  font: inherit;
  font-size: 0.875rem;
  color: inherit;
  border: 1px solid var(--c--contextuals--border--surface--primary);
  background: var(--c--contextuals--background--surface--primary);
  &::placeholder {
    color: var(--c--contextuals--content--semantic--neutral--tertiary);
  }
  &:focus {
    outline: none;
    border-color: var(--c--contextuals--border--semantic--brand--primary);
    box-shadow: 0 0 0 1px
      var(--c--contextuals--border--semantic--brand--primary);
  }
`;

const itemCss = (isOpen: boolean) => css`
  border-radius: 10px;
  border: 1px solid
    ${
      isOpen
        ? 'var(--c--contextuals--border--semantic--brand--secondary)'
        : 'var(--c--contextuals--border--surface--primary)'
    };
  background: var(--c--contextuals--background--surface--primary);
  overflow: hidden;
`;

const itemButtonCss = css`
  flex: 1;
  min-width: 0;
  padding: 10px 12px;
  cursor: pointer;
  font: inherit;
  color: inherit;
  text-align: left;
  border: none;
  background: transparent;
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: -2px;
  }
`;

const CopyButton = ({ text }: { text: string }) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  return (
    <Button
      size="small"
      color="neutral"
      variant="tertiary"
      onClick={() => {
        void navigator.clipboard.writeText(text);
        showToast('success', t('Copied to clipboard.'), undefined, 2000);
      }}
      icon={<Icon iconName="content_copy" $size="16px" />}
    >
      {t('Copy')}
    </Button>
  );
};

const PromptItem = ({
  prompt,
  isOpen,
  onToggle,
  onDelete,
}: {
  prompt: LibraryPrompt;
  isOpen: boolean;
  onToggle: () => void;
  /** For the user's own prompts: a delete button instead of the star. */
  onDelete?: () => void;
}) => {
  const { t } = useTranslation();
  const offerPrompt = useOfferPrompt();
  const isFavorite = useLibraryStore((state) =>
    state.favorites.includes(prompt.id),
  );
  const toggleFavorite = useLibraryStore((state) => state.toggleFavorite);
  const previewId = `library-${prompt.id}`;
  // Nothing left to fill in (often the user's own prompts): use it as is.
  const isComplete = !hasPlaceholders(prompt.prompt);
  const itemRef = useRef<HTMLLIElement | null>(null);

  // An opened prompt low in the list scrolls into view.
  useEffect(() => {
    if (isOpen) {
      itemRef.current?.scrollIntoView?.({ block: 'nearest' });
    }
  }, [isOpen]);

  return (
    <Box as="li" ref={itemRef} $css={itemCss(isOpen)}>
      <Box $direction="row" $align="flex-start">
        <Box
          as="button"
          type="button"
          aria-expanded={isOpen}
          aria-controls={previewId}
          onClick={onToggle}
          $gap="2px"
          $css={itemButtonCss}
        >
          <Text $size="sm" $weight="700">
            {prompt.title}
          </Text>
          <Text $size="xs" $variation="secondary">
            {prompt.description}
          </Text>
        </Box>
        <Box $css="padding: 6px 6px 0 0;">
          {onDelete ? (
            <Button
              size="small"
              color="neutral"
              variant="tertiary"
              aria-label={t('Delete "{{title}}"', { title: prompt.title })}
              onClick={onDelete}
              icon={
                <Icon iconName="delete" $size="20px" $variation="secondary" />
              }
            />
          ) : (
            <Button
              size="small"
              color="neutral"
              variant="tertiary"
              aria-pressed={isFavorite}
              aria-label={
                isFavorite
                  ? t('Remove "{{title}}" from favorites', {
                      title: prompt.title,
                    })
                  : t('Add "{{title}}" to favorites', { title: prompt.title })
              }
              onClick={() => toggleFavorite(prompt.id)}
              icon={
                <Icon
                  iconName="star"
                  variant={isFavorite ? 'filled' : 'outlined'}
                  $size="20px"
                  $css={
                    isFavorite
                      ? 'color: var(--c--globals--colors--warning-450);'
                      : undefined
                  }
                  $variation={isFavorite ? undefined : 'secondary'}
                />
              }
            />
          )}
        </Box>
      </Box>
      {isOpen && (
        <Box id={previewId} $gap="10px" $css="padding: 0 12px 12px;">
          <Text
            $size="xs"
            $css={css`
              display: block;
              max-height: 220px;
              overflow-y: auto;
              padding: 10px 12px;
              border-radius: 8px;
              white-space: pre-wrap;
              line-height: 1.5;
              background: var(--c--contextuals--background--surface--secondary);
            `}
          >
            {prompt.prompt}
          </Text>
          <Box $direction="row" $gap="8px" $justify="flex-end">
            {onDelete && <CopyButton text={prompt.prompt} />}
            <Button
              size="small"
              onClick={() => offerPrompt(prompt.prompt, prompt.title)}
              icon={
                <Icon
                  iconName={isComplete ? 'north_west' : 'auto_awesome'}
                  $size="16px"
                />
              }
            >
              {isComplete ? t('Use this prompt') : t('Complete with Robin')}
            </Button>
          </Box>
          {!isComplete && (
            <Text $size="xs" $variation="secondary">
              {t(
                'Robin asks you what is missing, then writes the complete prompt.',
              )}
            </Text>
          )}
        </Box>
      )}
    </Box>
  );
};

const cardCss = css`
  width: 100%;
  height: 100%;
  padding: 12px;
  border-radius: 10px;
  cursor: pointer;
  font: inherit;
  color: inherit;
  text-align: left;
  border: 1px solid var(--c--contextuals--border--surface--primary);
  background: var(--c--contextuals--background--surface--primary);
  transition:
    border-color 0.15s ease,
    box-shadow 0.15s ease;
  &:hover {
    border-color: var(--c--contextuals--border--semantic--brand--primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
  }
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 2px;
  }
`;

const badgeCss = (isFavorite: boolean) => css`
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: 9px;
  color: ${
    isFavorite
      ? 'var(--c--globals--colors--warning-450)'
      : 'var(--c--contextuals--content--semantic--brand--primary)'
  };
  background: ${
    isFavorite
      ? 'var(--c--contextuals--background--semantic--warning--tertiary)'
      : 'var(--c--contextuals--background--semantic--brand--tertiary)'
  };
`;

/** Ready-to-use prompts, by kind of work, with search and favorites. */
export const LibraryView = ({ onBack }: { onBack: () => void }) => {
  const { t, i18n } = useTranslation();
  const library = useMemo(
    () => getPromptLibrary(i18n.language),
    [i18n.language],
  );
  const favorites = useLibraryStore((state) => state.favorites);
  const myPrompts = useMyPromptsStore((state) => state.prompts);
  const removeMine = useMyPromptsStore((state) => state.remove);
  // The user's own prompts, shown like library prompts.
  const mine = useMemo<LibraryPrompt[]>(
    () =>
      myPrompts.map((item) => ({
        id: `${MINE}-${item.id}`,
        category: MINE,
        title: item.title,
        description: t('Saved on {{date}}', {
          date: new Date(item.savedAt).toLocaleDateString(i18n.language),
        }),
        prompt: item.prompt,
        keywords: [],
      })),
    [myPrompts, t, i18n.language],
  );
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const category =
    categoryId === MINE
      ? { id: MINE, icon: 'bookmark', title: t('My prompts') }
      : categoryId === FAVORITES
        ? { id: FAVORITES, icon: 'star', title: t('My favorites') }
        : library.categories.find((c) => c.id === categoryId);
  const inCategory = (prompt: LibraryPrompt) =>
    categoryId === FAVORITES
      ? favorites.includes(prompt.id)
      : prompt.category === categoryId;
  const isSearching = query.trim() !== '';
  const searchMine = (prompt: LibraryPrompt) =>
    normalize(`${prompt.title} ${prompt.prompt}`).includes(
      normalize(query.trim()),
    );
  const listed =
    categoryId === MINE
      ? mine
      : category
        ? library.prompts.filter(inCategory)
        : [
            ...mine.filter(searchMine),
            ...library.prompts.filter((prompt) => matches(prompt, query)),
          ];

  const cards = [
    ...(mine.length > 0
      ? [{ id: MINE, icon: 'bookmark', title: t('My prompts') }]
      : []),
    ...(favorites.length > 0
      ? [{ id: FAVORITES, icon: 'star', title: t('My favorites') }]
      : []),
    ...library.categories,
  ];
  const promptCount = (count: number) =>
    count === 1 ? t('1 prompt') : t('{{count}} prompts', { count });
  const countOf = (id: string) =>
    id === MINE
      ? mine.length
      : id === FAVORITES
        ? favorites.length
        : library.prompts.filter((prompt) => prompt.category === id).length;

  const header = category ? (
    <Box $direction="row" $align="center" $gap="10px">
      <Button
        size="small"
        color="neutral"
        variant="tertiary"
        onClick={() => {
          setCategoryId(null);
          setOpenId(null);
        }}
        aria-label={t('Back to the categories')}
        icon={<Icon iconName="arrow_back" $size="18px" />}
      />
      <Box
        $align="center"
        $justify="center"
        $css={badgeCss(category.id === FAVORITES)}
      >
        <Icon
          iconName={category.icon}
          variant={category.id === FAVORITES ? 'filled' : 'outlined'}
          $size="18px"
          $withThemeInherited
        />
      </Box>
      <Box $css="min-width: 0;">
        <Text as="h2" $size="md" $weight="700" $margin="0">
          {category.title}
        </Text>
        <Text $size="xs" $variation="secondary">
          {promptCount(listed.length)}
        </Text>
      </Box>
    </Box>
  ) : (
    <Box $direction="row" $align="center" $gap="10px">
      <Button
        size="small"
        color="neutral"
        variant="tertiary"
        onClick={onBack}
        aria-label={t('Back to the tools')}
        icon={<Icon iconName="arrow_back" $size="18px" />}
      />
      <Box $css="min-width: 0;">
        <Text as="h2" $size="md" $weight="700" $margin="0">
          {t('Prompt library')}
        </Text>
        <Text $size="xs" $variation="secondary">
          {t('{{count}} ready-to-use prompts, by kind of work.', {
            count: library.prompts.length,
          })}
        </Text>
      </Box>
    </Box>
  );

  const list =
    listed.length === 0 ? (
      <Box $align="center" $gap="6px" $padding={{ vertical: 'lg' }}>
        <Icon
          iconName={categoryId === FAVORITES ? 'star' : 'search_off'}
          $size="32px"
          $variation="secondary"
        />
        <Text $size="sm" $variation="secondary" $textAlign="center">
          {categoryId === FAVORITES
            ? t('Star a prompt to find it here.')
            : t(
                'No prompt matches. Try another word, or the prompt generator.',
              )}
        </Text>
      </Box>
    ) : (
      <Box as="ul" $gap="6px" $css="margin: 0; padding: 0; list-style: none;">
        {listed.map((prompt) => (
          <PromptItem
            key={prompt.id}
            prompt={prompt}
            onDelete={
              prompt.category === MINE
                ? () => removeMine(prompt.id.slice(MINE.length + 1))
                : undefined
            }
            isOpen={openId === prompt.id}
            onToggle={() =>
              setOpenId((current) => (current === prompt.id ? null : prompt.id))
            }
          />
        ))}
      </Box>
    );

  return (
    <Box
      $gap="14px"
      $padding={{ all: 'base' }}
      // The categories sit in the middle of the panel; lists start at the top.
      $css={
        category || isSearching
          ? 'min-height: 100%;'
          : 'min-height: 100%; justify-content: center;'
      }
    >
      {header}

      {!category && (
        <Box $css="position: relative;">
          <Icon
            iconName="search"
            $size="20px"
            $variation="secondary"
            $css="position: absolute; left: 10px; top: 10px; pointer-events: none;"
          />
          <SearchInput
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setOpenId(null);
            }}
            placeholder={t('Search: meeting, email, plain language…')}
            aria-label={t('Search the library')}
          />
        </Box>
      )}

      {category || isSearching ? (
        list
      ) : (
        <Box
          as="ul"
          aria-label={t('Categories')}
          $css={css`
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
            gap: 8px;
            margin: 0;
            padding: 0;
            list-style: none;
          `}
        >
          {cards.map((card) => (
            <li key={card.id}>
              <Box
                as="button"
                type="button"
                onClick={() => setCategoryId(card.id)}
                $gap="8px"
                $css={cardCss}
              >
                <Box
                  $align="center"
                  $justify="center"
                  $css={badgeCss(card.id === FAVORITES)}
                >
                  <Icon
                    iconName={card.icon}
                    variant={card.id === FAVORITES ? 'filled' : 'outlined'}
                    $size="18px"
                    $withThemeInherited
                  />
                </Box>
                <Box $gap="2px">
                  <Text $size="sm" $weight="700" $css="line-height: 1.25;">
                    {card.title}
                  </Text>
                  <Text $size="xs" $variation="secondary">
                    {promptCount(countOf(card.id))}
                  </Text>
                </Box>
              </Box>
            </li>
          ))}
        </Box>
      )}
    </Box>
  );
};
