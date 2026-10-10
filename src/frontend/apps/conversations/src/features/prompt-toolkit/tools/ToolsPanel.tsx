import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { useAiAvailable } from '../coach/aiAvailability';
import { optionCss } from '../components/CoachModes';
import {
  ROBIN_ORGANIZE_URL,
  ROBIN_PROMPTS_URL,
  ROBIN_SUMMARIZE_URL,
  ROBIN_WRITE_URL,
} from '../components/PanelHome';
import { PanelTextArea } from '../components/PanelTextArea';
import { SpaceIntro } from '../components/SpaceIntro';
import { useOfferPrompt } from '../fill/useOfferPrompt';
import { LibraryView } from '../library/LibraryView';
import { RecorderView } from '../speech/RecorderView';
import {
  usePromptToolkitStore,
  useSectionReset,
} from '../stores/usePromptToolkitStore';

import { MyStyleView } from './MyStyleView';
import { PromptGenerator } from './PromptGenerator';
import { FollowUpView, ImproveTextView } from './RobinToolViews';
import { DailyTool, buildToolPrompt, getDailyTools } from './tools';

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

/** Robin's illustration for the family of each tool. */
const TOOL_IMAGES: Record<string, string> = {
  'email-reply': ROBIN_WRITE_URL,
  letter: ROBIN_WRITE_URL,
  rewrite: ROBIN_WRITE_URL,
  translate: ROBIN_WRITE_URL,
  minutes: ROBIN_SUMMARIZE_URL,
  summary: ROBIN_SUMMARIZE_URL,
  actions: ROBIN_SUMMARIZE_URL,
  plan: ROBIN_ORGANIZE_URL,
  brainstorm: ROBIN_ORGANIZE_URL,
};

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
      <Box $css="flex: 1;">
        <Box
          $direction="row"
          $align="center"
          $gap="12px"
          $css="padding: 16px 16px 8px;"
        >
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
              {tool.title}
            </Text>
            <Text $size="xs" $variation="secondary">
              {tool.description}
            </Text>
          </Box>
        </Box>

        {/* The choices sit in the middle of the space, in a calm column. */}
        <Box
          $gap="18px"
          $css={css`
            flex: 1;
            justify-content: center;
            width: 100%;
            max-width: 520px;
            margin-inline: auto;
            padding: 16px 20px 32px;
          `}
        >
          <img
            src={TOOL_IMAGES[tool.id] ?? ROBIN_WRITE_URL}
            alt=""
            width={112}
            height={112}
            style={{
              alignSelf: 'center',
              borderRadius: '50%',
              background: '#f7f8fd',
            }}
          />
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
                background: var(
                  --c--contextuals--background--surface--secondary
                );
              `}
            >
              {prompt}
            </Text>
          </Box>
        </Box>
      </Box>
      {/* The action stays at hand at the bottom of the panel. */}
      <Box
        $gap="6px"
        $css={css`
          position: sticky;
          bottom: 0;
          /* Room on the right for Robin's round button. */
          padding: 12px 84px 12px 16px;
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

interface ToolEntry {
  id: string;
  icon: string;
  title: string;
  description: string;
}

const rowCss = css`
  width: 100%;
  padding: 12px 14px;
  border-radius: 12px;
  cursor: pointer;
  font: inherit;
  color: inherit;
  text-align: left;
  border: 1px solid var(--c--contextuals--border--surface--primary);
  background: var(--c--contextuals--background--surface--primary);
  &:hover {
    border-color: var(--c--contextuals--border--semantic--brand--primary);
    background: var(--c--contextuals--background--semantic--brand--tertiary);
  }
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 2px;
  }
`;

/** Tools that need Robin, hence the Albert relay. */
const AI_TOOLS = ['generator', 'improve', 'follow-up', 'my-style'];

export const ToolsPanel = () => {
  const { t } = useTranslation();
  const isAiAvailable = useAiAvailable();
  const tools = useMemo(() => getDailyTools(t), [t]);
  const [openId, setOpenId] = useState<string | null>(null);
  // A tool asked from a suggestion opens directly.
  const toolRequest = usePromptToolkitStore((state) => state.toolRequest);
  const clearToolRequest = usePromptToolkitStore(
    (state) => state.clearToolRequest,
  );
  useEffect(() => {
    if (toolRequest) {
      setOpenId(toolRequest);
      clearToolRequest();
    }
  }, [toolRequest, clearToolRequest]);
  const openTool = tools.find((tool) => tool.id === openId);
  // The trash button empties the open tool by mounting it afresh.
  const [resetKey, setResetKey] = useState(0);
  useSectionReset('tools', () => setResetKey((key) => key + 1));
  const [categoryId, setCategoryId] = useState('write');
  // Tools that open their own view rather than a form.
  const extraTools: Record<string, ToolEntry> = {
    // Replaces the meeting minutes form: record, import or paste, then choose.
    minutes: {
      id: 'minutes',
      icon: 'mic',
      title: t('Record and transcribe'),
      description: t(
        'A meeting, an idea, a voice note or a pasted text: minutes, decisions, actions.',
      ),
    },
    library: {
      id: 'library',
      icon: 'menu_book',
      title: t('Prompt library'),
      description: t('Ready-made prompts for everyday work, with favorites.'),
    },
    generator: {
      id: 'generator',
      icon: 'auto_fix_high',
      title: t('Prompt generator'),
      description: t('Describe your need, get ready-to-use prompts.'),
    },
    improve: {
      id: 'improve',
      icon: 'edit_note',
      title: t('Improve my text'),
      description: t('Robin strengthens what you wrote, in a few questions.'),
    },
    'my-style': {
      id: 'my-style',
      icon: 'draw',
      title: t('My writing style'),
      description: t(
        'Robin describes your style from your texts, to reuse in your prompts.',
      ),
    },
    'follow-up': {
      id: 'follow-up',
      icon: 'replay',
      title: t('Follow up on an answer'),
      description: t(
        'The answer does not suit you? Robin writes a better follow-up.',
      ),
    },
  };
  const finish = t(
    'The prompt goes into the message field: complete it, then send it.',
  );
  const categories = [
    {
      id: 'write',
      icon: 'edit',
      label: t('Write'),
      image: ROBIN_WRITE_URL,
      text: t(
        'Reply to an email, write a letter, rewrite or translate a text.',
      ),
      tools: [
        'email-reply',
        'letter',
        'rewrite',
        'translate',
        'improve',
        'my-style',
      ],
      steps: [
        t('Choose what you want to write below.'),
        t('Answer a few simple choices: tone, length, recipient.'),
        finish,
      ],
    },
    {
      id: 'summarize',
      icon: 'summarize',
      label: t('Summarise'),
      image: ROBIN_SUMMARIZE_URL,
      text: t('Turn notes or a long document into something short and clear.'),
      tools: ['minutes', 'summary', 'actions'],
      steps: [
        t('Choose the kind of summary below.'),
        t('Paste your notes or attach the document when asked.'),
        finish,
      ],
    },
    {
      id: 'organize',
      icon: 'checklist',
      label: t('Organise'),
      image: ROBIN_ORGANIZE_URL,
      text: t('Plan a project or find ideas on a subject.'),
      tools: ['plan', 'brainstorm'],
      steps: [
        t('Choose a plan or a brainstorming session below.'),
        t('Describe your project or your subject in a few words.'),
        finish,
      ],
    },
    {
      id: 'prompts',
      icon: 'auto_awesome',
      label: t('Prompts'),
      image: ROBIN_PROMPTS_URL,
      text: isAiAvailable
        ? t('Start from a ready-made prompt, or have one written for you.')
        : t('Start from a ready-made prompt.'),
      tools: ['library', 'generator', 'follow-up'],
      steps: isAiAvailable
        ? [
            t('The library: prompts ready to use, sorted by theme.'),
            t('The generator: describe your need, get prompts.'),
            t('Follow up: improve an answer that does not suit you.'),
          ]
        : [
            t('Open the library: prompts ready to use, sorted by theme.'),
            t('Pick a prompt and put it in the message field.'),
            t('Replace the parts in brackets with your own information.'),
          ],
    },
  ];

  if (openId === 'generator') {
    return <PromptGenerator key={resetKey} onBack={() => setOpenId(null)} />;
  }

  if (openId === 'improve') {
    return <ImproveTextView key={resetKey} onBack={() => setOpenId(null)} />;
  }

  if (openId === 'follow-up') {
    return <FollowUpView key={resetKey} onBack={() => setOpenId(null)} />;
  }

  if (openId === 'my-style') {
    return <MyStyleView key={resetKey} onBack={() => setOpenId(null)} />;
  }

  if (openId === 'minutes') {
    return <RecorderView key={resetKey} onBack={() => setOpenId(null)} />;
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

  const category =
    categories.find((item) => item.id === categoryId) ?? categories[0];
  const entries = category.tools
    .filter((id) => isAiAvailable || !AI_TOOLS.includes(id))
    .map((id) => extraTools[id] ?? tools.find((tool) => tool.id === id))
    .filter((tool): tool is ToolEntry => Boolean(tool));

  return (
    <Box $gap="16px" $padding={{ all: 'base' }}>
      {/* Like the coach: families on top, then the steps and the tools. */}
      <Box
        role="radiogroup"
        aria-label={t('Everyday tools')}
        $css={css`
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 4px;
          padding: 4px;
          border-radius: 8px;
          border: 1px solid var(--c--contextuals--border--surface--primary);
        `}
      >
        {categories.map((item) => (
          <Box
            key={item.id}
            as="button"
            type="button"
            role="radio"
            aria-checked={item.id === category.id}
            onClick={() => setCategoryId(item.id)}
            $direction="row"
            $css={optionCss(item.id === category.id)}
          >
            <Icon iconName={item.icon} $size="16px" $withThemeInherited />
            {item.label}
          </Box>
        ))}
      </Box>
      <SpaceIntro
        key={category.id}
        image={category.image}
        title={category.label}
        text={category.text}
        steps={category.steps}
      />
      <Box as="ul" $gap="8px" $css="margin: 0; padding: 0; list-style: none;">
        {entries.map((tool) => (
          <li key={tool.id}>
            <Box
              as="button"
              type="button"
              onClick={() => setOpenId(tool.id)}
              $direction="row"
              $align="center"
              $gap="12px"
              $css={rowCss}
            >
              <Box $align="center" $justify="center" $css={iconBadgeCss(36)}>
                <Icon iconName={tool.icon} $size="20px" $withThemeInherited />
              </Box>
              <Box $gap="2px" $css="flex: 1; min-width: 0;">
                <Text $weight="700">{tool.title}</Text>
                <Text $size="sm" $variation="secondary">
                  {tool.description}
                </Text>
              </Box>
              <Icon
                iconName="chevron_right"
                $size="20px"
                $variation="secondary"
              />
            </Box>
          </li>
        ))}
      </Box>
    </Box>
  );
};
