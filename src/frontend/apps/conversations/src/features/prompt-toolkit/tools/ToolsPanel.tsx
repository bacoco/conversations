import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { PanelTextArea } from '../components/PanelTextArea';
import { useOfferPrompt } from '../fill/useOfferPrompt';
import { LibraryView } from '../library/LibraryView';
import { useSectionReset } from '../stores/usePromptToolkitStore';

import { PromptGenerator } from './PromptGenerator';
import { DailyTool, buildToolPrompt, getDailyTools } from './tools';

const tileCss = css`
  width: 100%;
  height: 100%;
  padding: 10px 12px;
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

const clampCss = css`
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  line-height: 1.35;
`;

const iconBadgeCss = (size: number) => css`
  flex: none;
  width: ${size}px;
  height: ${size}px;
  border-radius: ${size / 3.5}px;
  color: var(--c--contextuals--content--semantic--brand--primary);
  background: var(--c--contextuals--background--semantic--brand--tertiary);
`;

const sectionCardCss = css`
  padding: 14px;
  border-radius: 12px;
  border: 1px solid var(--c--contextuals--border--surface--primary);
  background: var(--c--contextuals--background--surface--primary);
`;

const choiceCss = (isSelected: boolean) => css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 32px;
  padding: 4px 10px;
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
  font-size: 0.8125rem;
  color: ${
    isSelected
      ? 'var(--c--contextuals--content--semantic--brand--primary)'
      : 'var(--c--contextuals--content--semantic--neutral--primary)'
  };
  border: 1px solid
    ${
      isSelected
        ? 'var(--c--contextuals--border--semantic--brand--primary)'
        : 'var(--c--contextuals--border--surface--primary)'
    };
  background: ${
    isSelected
      ? 'var(--c--contextuals--background--semantic--brand--tertiary)'
      : 'transparent'
  };
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 2px;
  }
`;

const ToolForm = ({
  tool,
  onBack,
}: {
  tool: DailyTool;
  onBack: () => void;
}) => {
  const { t } = useTranslation();
  const offerPrompt = useOfferPrompt();
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [source, setSource] = useState('');
  const prompt = buildToolPrompt(tool, selected, source);
  const usePrompt = () => offerPrompt(prompt, tool.title);

  return (
    <Box $css="min-height: 100%;">
      <Box $gap="14px" $padding={{ all: 'base' }} $css="flex: 1;">
        <Box $direction="row" $align="center" $gap="10px">
          <Button
            size="small"
            color="neutral"
            variant="tertiary"
            onClick={onBack}
            aria-label={t('Back to the tools')}
            icon={<Icon iconName="arrow_back" $size="18px" />}
          />
          <Box $align="center" $justify="center" $css={iconBadgeCss(40)}>
            <Icon iconName={tool.icon} $size="22px" $withThemeInherited />
          </Box>
          <Box $css="min-width: 0;">
            <Text as="h2" $size="md" $weight="700" $margin="0">
              {tool.title}
            </Text>
            <Text $size="xs" $variation="secondary">
              {tool.description}
            </Text>
          </Box>
        </Box>

        {tool.options.map((group) => {
          const current = selected[group.id] ?? group.choices[0].id;
          return (
            <Box key={group.id} $gap="8px" $css={sectionCardCss}>
              <Text $size="sm" $weight="700" id={`${tool.id}-${group.id}`}>
                {group.label}
              </Text>
              <Box
                role="radiogroup"
                aria-labelledby={`${tool.id}-${group.id}`}
                $direction="row"
                $gap="6px"
                $css="flex-wrap: wrap;"
              >
                {group.choices.map((choice) => {
                  const isSelected = current === choice.id;
                  return (
                    <Box
                      key={choice.id}
                      as="button"
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      onClick={() =>
                        setSelected((previous) => ({
                          ...previous,
                          [group.id]: choice.id,
                        }))
                      }
                      $direction="row"
                      $css={choiceCss(isSelected)}
                    >
                      {isSelected && (
                        <Icon
                          iconName="check"
                          $size="16px"
                          $withThemeInherited
                        />
                      )}
                      {choice.label}
                    </Box>
                  );
                })}
              </Box>
            </Box>
          );
        })}

        {/* The text to work on takes the room left in the panel. */}
        <Box
          $gap="8px"
          $css={css`
            ${sectionCardCss}
            flex: 1;
          `}
        >
          <Text $size="sm" $weight="700">
            {tool.source.label}
          </Text>
          <PanelTextArea
            fill
            label={tool.source.label}
            minRows={5}
            value={source}
            placeholder={tool.source.placeholder}
            onChange={setSource}
          />
        </Box>

        <Box
          as="details"
          $gap="8px"
          $css={css`
            ${sectionCardCss}
            & > summary {
              cursor: pointer;
              font-size: 0.875rem;
              font-weight: 700;
            }
            & > summary:focus-visible {
              outline: 2px solid
                var(--c--contextuals--border--semantic--brand--primary);
              outline-offset: 2px;
            }
          `}
        >
          <summary>{t('Prompt that will be prepared')}</summary>
          <Text
            $size="xs"
            $css={css`
              max-height: 160px;
              overflow-y: auto;
              white-space: pre-wrap;
              overflow-wrap: anywhere;
              padding: 10px 12px;
              border-radius: 8px;
              background: var(--c--contextuals--background--surface--secondary);
            `}
          >
            {prompt}
          </Text>
        </Box>
      </Box>
      {/* The action stays at hand at the bottom of the panel. */}
      <Box
        $gap="6px"
        $css={css`
          position: sticky;
          bottom: 0;
          padding: 12px 16px;
          border-top: 1px solid var(--c--contextuals--border--surface--primary);
          background: var(--c--contextuals--background--surface--primary);
        `}
      >
        <Button
          fullWidth
          onClick={usePrompt}
          icon={<Icon iconName="arrow_upward" $size="18px" />}
        >
          {t('Prepare in the message field')}
        </Button>
        <Text $size="xs" $variation="secondary" $textAlign="center">
          {t('You can still edit the prompt before sending it.')}
        </Text>
      </Box>
    </Box>
  );
};

const FeaturedTile = ({
  icon,
  title,
  description,
  onClick,
}: {
  icon: string;
  title: string;
  description: string;
  onClick: () => void;
}) => (
  <Box
    as="button"
    type="button"
    onClick={onClick}
    $direction="row"
    $align="center"
    $gap="12px"
    $css={css`
      ${tileCss}
      height: auto;
      border-color: var(--c--contextuals--border--semantic--brand--secondary);
      background: var(--c--contextuals--background--semantic--brand--tertiary);
    `}
  >
    <Box
      $align="center"
      $justify="center"
      $css={css`
        flex: none;
        width: 40px;
        height: 40px;
        border-radius: 12px;
        color: var(--c--contextuals--content--semantic--brand--on-brand);
        background: var(--c--contextuals--background--semantic--brand--primary);
      `}
    >
      <Icon iconName={icon} $size="22px" $withThemeInherited />
    </Box>
    <Box $gap="2px" $css="flex: 1; min-width: 0;">
      <Text $size="sm" $weight="700">
        {title}
      </Text>
      <Text $size="xs" $variation="secondary">
        {description}
      </Text>
    </Box>
    <Icon iconName="chevron_right" $size="20px" $variation="secondary" />
  </Box>
);

/** Ready-made tasks for everyday work, each turned into a good prompt. */
export const ToolsPanel = () => {
  const { t } = useTranslation();
  const tools = useMemo(() => getDailyTools(t), [t]);
  const [openId, setOpenId] = useState<string | null>(null);
  const openTool = tools.find((tool) => tool.id === openId);
  // The trash button empties the open tool by mounting it afresh.
  const [resetKey, setResetKey] = useState(0);
  useSectionReset('tools', () => setResetKey((key) => key + 1));

  if (openId === 'generator') {
    return <PromptGenerator key={resetKey} onBack={() => setOpenId(null)} />;
  }

  if (openId === 'library') {
    return <LibraryView key={resetKey} onBack={() => setOpenId(null)} />;
  }

  if (openTool) {
    return (
      <ToolForm
        key={`${openTool.id}-${resetKey}`}
        tool={openTool}
        onBack={() => setOpenId(null)}
      />
    );
  }

  return (
    <Box
      $gap="12px"
      $padding={{ all: 'base' }}
      $css="min-height: 100%; justify-content: center;"
    >
      <Box $gap="4px">
        <Text as="h2" $size="md" $weight="700" $margin="0">
          {t('Everyday tools')}
        </Text>
        <Text $size="sm" $variation="secondary">
          {t('Pick a task: the panel prepares a well-built prompt for you.')}
        </Text>
      </Box>
      {/* Featured: start from a ready-made prompt. */}
      <FeaturedTile
        icon="menu_book"
        title={t('Prompt library')}
        description={t('Ready-made prompts for everyday work, with favorites.')}
        onClick={() => setOpenId('library')}
      />
      <Box
        as="ul"
        $css={css`
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          gap: 8px;
          margin: 0;
          padding: 0;
          list-style: none;
        `}
      >
        {[
          ...tools,
          // Last card: when no task fits, start from the need.
          {
            id: 'generator',
            icon: 'auto_fix_high',
            title: t('Prompt generator'),
            description: t('Describe your need, get ready-to-use prompts.'),
          },
        ].map((tool) => (
          <li key={tool.id}>
            <Box
              as="button"
              type="button"
              onClick={() => setOpenId(tool.id)}
              $gap="4px"
              $css={tileCss}
            >
              <Box $direction="row" $align="center" $gap="8px">
                <Box $align="center" $justify="center" $css={iconBadgeCss(28)}>
                  <Icon iconName={tool.icon} $size="16px" $withThemeInherited />
                </Box>
                <Text $size="sm" $weight="700" $css="line-height: 1.2;">
                  {tool.title}
                </Text>
              </Box>
              <Text $size="xs" $variation="secondary" $css={clampCss}>
                {tool.description}
              </Text>
            </Box>
          </li>
        ))}
      </Box>
    </Box>
  );
};
