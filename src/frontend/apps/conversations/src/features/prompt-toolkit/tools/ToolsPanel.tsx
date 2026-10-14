import { Button, Loader } from '@gouvfr-lasuite/cunningham-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text, useToast } from '@/components';
import { useResponsiveStore } from '@/stores';

import { useAiAvailable } from '../coach/aiAvailability';
import { hasPlaceholders, rephrasePart } from '../coach/coachApi';
import { languageName } from '../coach/language';
import {
  NESTOR_ORGANIZE_URL,
  NESTOR_PROMPTS_URL,
  NESTOR_SUMMARIZE_URL,
  NESTOR_WRITE_URL,
} from '../components/PanelHome';
import { PanelTextArea } from '../components/PanelTextArea';
import { useOfferPrompt } from '../fill/useOfferPrompt';
import { LibraryView, normalize } from '../library/LibraryView';
import { RecorderView } from '../speech/RecorderView';
import { TRANSCRIPTION_URL } from '../speech/transcribe';
import { useMainConversationStore } from '../stores/useMainConversationStore';
import {
  TOOLS_LIST,
  usePromptToolkitStore,
  useSectionReset,
} from '../stores/usePromptToolkitStore';

import { MyStyleView } from './MyStyleView';
import { FollowUpView, ImproveTextView } from './NestorToolViews';
import { PromptExplained } from './PromptExplained';
import { PromptGenerator } from './PromptGenerator';
import { PART_ORDER, PartHeader, partCss, usePartLabels } from './promptParts';
import {
  DailyTool,
  IMPROVE_CHOICE,
  PromptPartKind,
  ToolOptionGroup,
  buildToolParts,
  buildToolPrompt,
  getDailyTools,
  joinParts,
} from './tools';
import { TOOL_KEYWORDS, useToolsUsageStore } from './useToolsUsageStore';

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

const searchCss = css`
  width: 100%;
  box-sizing: border-box;
  padding: 10px 12px;
  border-radius: 10px;
  font: inherit;
  font-size: 0.9375rem;
  color: inherit;
  border: 1px solid var(--c--contextuals--border--surface--primary);
  background: var(--c--contextuals--background--surface--primary);
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 1px;
  }
`;

/** A family of tools, as a big card: one click opens it. */
const familyCardCss = css`
  width: 100%;
  height: 100%;
  padding: 20px 12px;
  border-radius: 14px;
  cursor: pointer;
  font: inherit;
  color: inherit;
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
  & img {
    border-radius: 50%;
    background: #f7f8fd;
  }
`;

/** Nestor's illustration for the family of each tool. */
const TOOL_IMAGES: Record<string, string> = {
  'email-reply': NESTOR_WRITE_URL,
  letter: NESTOR_WRITE_URL,
  rewrite: NESTOR_WRITE_URL,
  translate: NESTOR_WRITE_URL,
  minutes: NESTOR_SUMMARIZE_URL,
  summary: NESTOR_SUMMARIZE_URL,
  actions: NESTOR_SUMMARIZE_URL,
  plan: NESTOR_ORGANIZE_URL,
  brainstorm: NESTOR_ORGANIZE_URL,
};

/** "Other": what the user says in their words, rewritten into the block. */
const OtherChoice = ({
  kind,
  task,
  isOpen,
  onToggle,
  onText,
}: {
  kind: 'context' | 'instruction' | 'format';
  task: string;
  isOpen: boolean;
  onToggle: () => void;
  onText: (text: string) => void;
}) => {
  const { t, i18n } = useTranslation();
  const isAiAvailable = useAiAvailable();
  const [said, setSaid] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const placeholders = {
    context: t('For example: it is for a member of the public who is angry'),
    instruction: t('For example: thank them and say the file is complete'),
    format: t('For example: very short, with a list of the documents'),
  };
  const rephrase = async () => {
    if (!isAiAvailable) {
      onText(said.trim());
      return;
    }
    setStatus('loading');
    try {
      onText(
        await rephrasePart(
          said.trim(),
          kind,
          task,
          languageName(i18n.language),
        ),
      );
      setStatus('idle');
      setSaid('');
    } catch {
      setStatus('error');
    }
  };
  return (
    <Box $gap="8px">
      <Box $direction="row">
        <Box
          as="button"
          type="button"
          aria-pressed={isOpen}
          onClick={onToggle}
          $direction="row"
          $css={choiceCss(isOpen)}
        >
          <Icon iconName="mic" $size="16px" $withThemeInherited />
          {t('Other')}
        </Box>
      </Box>
      {isOpen && (
        <Box $gap="8px">
          <PanelTextArea
            label={t('Say it in your words')}
            minRows={2}
            value={said}
            placeholder={placeholders[kind]}
            onChange={setSaid}
          />
          <Box $direction="row" $gap="8px" $align="center">
            <Button
              size="small"
              disabled={!said.trim() || status === 'loading'}
              onClick={() => void rephrase()}
              icon={
                status === 'loading' ? (
                  <Loader size="small" />
                ) : (
                  <Icon iconName="auto_fix_high" $size="16px" />
                )
              }
            >
              {isAiAvailable ? t('Nestor rewrites it') : t('Use this text')}
            </Button>
            {status === 'error' && (
              <Text $size="xs" role="alert">
                {t('Nestor did not answer. Try again.')}
              </Text>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
};

const ToolForm = ({
  tool,
  onBack,
}: {
  tool: DailyTool;
  onBack: () => void;
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { isDesktop } = useResponsiveStore();
  const isAiAvailable = useAiAvailable();
  const offerPrompt = useOfferPrompt();
  const startFill = usePromptToolkitStore((state) => state.startFill);
  const sendQuestion = useMainConversationStore((state) => state.sendQuestion);
  const closePanel = usePromptToolkitStore((state) => state.close);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [source, setSource] = useState('');
  const [isExplained, setIsExplained] = useState(false);
  /** The blocks the user rewrote, in place of the text proposed. */
  const [edits, setEdits] = useState<Partial<Record<PromptPartKind, string>>>(
    {},
  );
  /** The blocks where the user says what they want in their words. */
  const [others, setOthers] = useState<Partial<Record<PromptPartKind, true>>>(
    {},
  );
  /** A tool written part by part: its request is written in four blocks. */
  const isExplainable = Boolean(tool.parts);
  const parts = buildToolParts(tool, selected, source, edits);
  const prompt = isExplainable
    ? joinParts(parts)
    : buildToolPrompt(tool, selected, source);
  // Without the Albert relay, Nestor cannot improve the text.
  const options = tool.options.map((group) => ({
    ...group,
    choices: group.choices.filter(
      (choice) => isAiAvailable || choice.id !== IMPROVE_CHOICE,
    ),
  }));
  // "Improve with Nestor": Nestor asks his questions, then writes it.
  const isNestor =
    isAiAvailable &&
    tool.options.some((group) => selected[group.id] === IMPROVE_CHOICE);
  const prepare = () => offerPrompt(prompt, tool.title);
  /**
   * One click to the answer. Blanks to fill go through Nestor's questions
   * first; without an open conversation, the request is prepared instead.
   */
  const askNow = () => {
    if (isNestor) {
      startFill(prompt, tool.title, '', 'draft');
      return;
    }
    if ((isAiAvailable && hasPlaceholders(prompt)) || !sendQuestion) {
      prepare();
      return;
    }
    sendQuestion(prompt);
    usePromptToolkitStore.getState().setOfferAnswerHelp(true);
    usePromptToolkitStore.getState().setFollowAnswer(true);
    showToast(
      'success',
      t('Sent: the answer arrives in the conversation.'),
      undefined,
      4000,
    );
    // On a phone the panel covers the chat: show the answer coming.
    if (!isDesktop) {
      closePanel();
    }
  };
  const askLabel = isNestor ? t('Start with Nestor') : t('Ask the Assistant');

  /**
   * The buttons of one choice. In a block, a choice rewrites the block:
   * what the user typed there gives way to the new proposal.
   */
  const choiceGroup = (group: ToolOptionGroup, kind?: PromptPartKind) => {
    // Text of one's own in the block: none of its choices is in it.
    const current =
      kind && edits[kind] !== undefined
        ? null
        : (selected[group.id] ?? group.choices[0].id);
    const labelId = `${tool.id}-${group.id}`;
    return (
      <Box key={group.id} $gap="8px" $css={kind ? undefined : sectionCardCss}>
        <Text $size="sm" $weight="700" id={labelId}>
          {group.label}
        </Text>
        <Box
          role="radiogroup"
          aria-labelledby={labelId}
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
                onClick={() => {
                  setSelected((previous) => ({
                    ...previous,
                    [group.id]: choice.id,
                  }));
                  if (kind) {
                    setEdits((previous) => ({
                      ...previous,
                      [kind]: undefined,
                    }));
                  }
                }}
                $direction="row"
                $css={choiceCss(isSelected)}
              >
                {isSelected && (
                  <Icon iconName="check" $size="16px" $withThemeInherited />
                )}
                {choice.label}
              </Box>
            );
          })}
        </Box>
      </Box>
    );
  };
  const partLabels = usePartLabels();

  const textBox = (
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
        minRows={isExplainable ? 7 : 5}
        value={source}
        placeholder={tool.source.placeholder}
        onChange={setSource}
      />
    </Box>
  );

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
          {!isExplainable && (
            <img
              src={TOOL_IMAGES[tool.id] ?? NESTOR_WRITE_URL}
              alt=""
              width={112}
              height={112}
              style={{
                alignSelf: 'center',
                borderRadius: '50%',
                background: '#f7f8fd',
              }}
            />
          )}
          {isExplainable &&
            PART_ORDER.map((kind) => {
              const part = parts.find((item) => item.kind === kind);
              if (!part) {
                return null;
              }
              const groups = options.filter(
                (group) => (group.part ?? 'instruction') === kind,
              );
              const fieldId = `${tool.id}-part-${kind}`;
              return (
                <Box
                  key={kind}
                  role="group"
                  aria-labelledby={fieldId}
                  $gap="8px"
                  $css={partCss(kind)}
                >
                  <PartHeader kind={kind} id={fieldId} />
                  {kind === 'document' ? (
                    <PanelTextArea
                      label={tool.source.label}
                      minRows={6}
                      value={source}
                      placeholder={tool.source.placeholder}
                      onChange={setSource}
                    />
                  ) : (
                    <PanelTextArea
                      label={partLabels[kind].label}
                      minRows={2}
                      dictation={false}
                      value={part.text}
                      onChange={(text) =>
                        setEdits((previous) => ({ ...previous, [kind]: text }))
                      }
                    />
                  )}
                  {groups.map((group) => choiceGroup(group, kind))}
                  {kind !== 'document' && (
                    <OtherChoice
                      kind={kind}
                      task={tool.title}
                      isOpen={Boolean(others[kind])}
                      onToggle={() =>
                        setOthers((previous) => ({
                          ...previous,
                          [kind]: previous[kind] ? undefined : true,
                        }))
                      }
                      onText={(text) => {
                        setEdits((previous) => ({ ...previous, [kind]: text }));
                        setOthers((previous) => ({
                          ...previous,
                          [kind]: undefined,
                        }));
                      }}
                    />
                  )}
                  {edits[kind] !== undefined && (
                    <Box $direction="row">
                      <Button
                        size="nano"
                        color="neutral"
                        variant="tertiary"
                        onClick={() =>
                          setEdits((previous) => ({
                            ...previous,
                            [kind]: undefined,
                          }))
                        }
                        icon={<Icon iconName="undo" $size="16px" />}
                      >
                        {t('Back to the proposed text')}
                      </Button>
                    </Box>
                  )}
                </Box>
              );
            })}
          {!isExplainable && options.map((group) => choiceGroup(group))}

          {/* The text to work on takes the room left in the panel. */}
          {!isExplainable && textBox}

          {!isExplainable && (
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
          )}
        </Box>
      </Box>
      {/* The action stays at hand at the bottom of the panel. */}
      <Box
        $gap="6px"
        $css={css`
          position: sticky;
          bottom: 0;
          /* Room on the right for Nestor's round button. */
          padding: 12px 84px 12px 16px;
          border-top: 1px solid var(--c--contextuals--border--surface--primary);
          background: var(--c--contextuals--background--surface--primary);
        `}
      >
        {isExplainable ? (
          <Box $direction="row" $gap="8px" $css="flex-wrap: wrap;">
            <Button
              color="neutral"
              variant="secondary"
              onClick={() => setIsExplained(true)}
              icon={<Icon iconName="palette" $size="18px" />}
            >
              {t('See my request')}
            </Button>
            <Box $css="flex: 1; min-width: 160px;">
              <Button
                fullWidth
                onClick={askNow}
                icon={
                  <Icon
                    iconName={isNestor ? 'edit_note' : 'send'}
                    $size="18px"
                  />
                }
              >
                {askLabel}
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            <Button
              fullWidth
              onClick={askNow}
              icon={<Icon iconName="send" $size="18px" />}
            >
              {askLabel}
            </Button>
            <Button
              fullWidth
              size="small"
              color="neutral"
              variant="tertiary"
              onClick={prepare}
            >
              {t('Prepare without sending, to read it first')}
            </Button>
          </>
        )}
      </Box>
      {isExplained && (
        <PromptExplained
          parts={parts}
          isNestor={isNestor}
          onClose={() => setIsExplained(false)}
          onAsk={() => {
            setIsExplained(false);
            askNow();
          }}
          onPrepare={() => {
            setIsExplained(false);
            prepare();
          }}
        />
      )}
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

/** Tools that need Nestor, hence the Albert relay. */
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
  const openTool = tools.find((tool) => tool.id === openId);
  // The trash button empties the open tool by mounting it afresh.
  const [resetKey, setResetKey] = useState(0);
  const [query, setQuery] = useState('');
  /** The family card opened: its tools, one level down. */
  const [familyId, setFamilyId] = useState<string | null>(null);
  useEffect(() => {
    if (toolRequest === TOOLS_LIST) {
      // From the home page's card: the list, the family closed.
      setOpenId(null);
      setFamilyId(null);
      clearToolRequest();
    } else if (toolRequest) {
      setOpenId(toolRequest);
      clearToolRequest();
    }
  }, [toolRequest, clearToolRequest]);
  useSectionReset('tools', () => {
    setResetKey((key) => key + 1);
    setQuery('');
    setFamilyId(null);
  });
  const favorites = useToolsUsageStore((state) => state.favorites);
  const markUsed = useToolsUsageStore((state) => state.markUsed);
  const toggleFavorite = useToolsUsageStore((state) => state.toggleFavorite);
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
      description: t('Nestor strengthens what you wrote, in a few questions.'),
    },
    'my-style': {
      id: 'my-style',
      icon: 'draw',
      title: t('My writing style'),
      description: t(
        'Nestor describes your style from your texts, to reuse in your prompts.',
      ),
    },
    'follow-up': {
      id: 'follow-up',
      icon: 'replay',
      title: t('Follow up on an answer'),
      description: t(
        'The answer does not suit you? Nestor writes a better follow-up.',
      ),
    },
  };
  // What an AI can do, by family: shown at once, to discover it.
  const categories = [
    {
      id: 'write',
      image: NESTOR_WRITE_URL,
      description: t('Emails, letters, rewriting, translation.'),
      icon: 'edit',
      label: t('Write'),
      // "Improve my text" is in "Rework"; "My writing style" in examples.
      tools: ['email-reply', 'letter', 'rewrite', 'translate'],
    },
    {
      id: 'summarize',
      image: NESTOR_SUMMARIZE_URL,
      description: t('Minutes, summary notes, actions to take.'),
      icon: 'summarize',
      label: t('Summarise'),
      tools: ['minutes', 'summary', 'actions'],
    },
    {
      id: 'organize',
      image: NESTOR_ORGANIZE_URL,
      description: t('Action plans, ideas, agendas.'),
      icon: 'checklist',
      label: t('Organise'),
      tools: ['plan', 'brainstorm'],
    },
    {
      id: 'prompts',
      image: NESTOR_PROMPTS_URL,
      description: t('Ready-made examples, a better follow-up.'),
      icon: 'auto_awesome',
      label: t('Prompts'),
      tools: ['library', 'generator', 'follow-up', 'my-style'],
    },
  ];

  const open = (toolId: string) => {
    markUsed(toolId);
    setOpenId(toolId);
  };
  const back = () => {
    setOpenId(null);
    setQuery('');
  };

  if (openId === 'generator') {
    return <PromptGenerator key={resetKey} onBack={back} initialNeed={query} />;
  }

  if (openId === 'improve') {
    return <ImproveTextView key={resetKey} onBack={back} />;
  }

  if (openId === 'follow-up') {
    return <FollowUpView key={resetKey} onBack={back} />;
  }

  if (openId === 'my-style') {
    return <MyStyleView key={resetKey} onBack={back} />;
  }

  if (openId === 'minutes') {
    return <RecorderView key={resetKey} onBack={back} />;
  }

  if (openId === 'library') {
    return <LibraryView key={resetKey} onBack={back} initialQuery={query} />;
  }

  if (openTool) {
    return (
      <ToolForm
        key={`${openTool.id}-${resetKey}`}
        tool={openTool}
        onBack={back}
      />
    );
  }

  const toEntry = (id: string) =>
    extraTools[id] ?? tools.find((tool) => tool.id === id);
  const isOffered = (id: string) =>
    (isAiAvailable || !AI_TOOLS.includes(id)) &&
    (id !== 'minutes' || (isAiAvailable && Boolean(TRANSCRIPTION_URL)));
  const offered = (ids: string[]) =>
    ids
      .filter(isOffered)
      .map(toEntry)
      .filter((tool): tool is ToolEntry => Boolean(tool));
  const allIds = categories.flatMap((item) => item.tools);

  const words = normalize(query).split(/\s+/).filter(Boolean);
  const found = words.length
    ? offered(allIds).filter((tool) => {
        const haystack = normalize(
          [
            tool.title,
            tool.description,
            ...(TOOL_KEYWORDS[tool.id] ?? []),
          ].join(' '),
        );
        return words.some((word) => word.length > 2 && haystack.includes(word));
      })
    : [];

  const toolRow = (tool: ToolEntry) => {
    const isFavorite = favorites.includes(tool.id);
    return (
      <Box as="li" key={tool.id} $direction="row" $align="center" $gap="4px">
        <Box
          as="button"
          type="button"
          onClick={() => open(tool.id)}
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
        </Box>
        <Button
          size="small"
          color={isFavorite ? 'brand' : 'neutral'}
          variant="tertiary"
          aria-pressed={isFavorite}
          aria-label={
            isFavorite
              ? t('Remove {{title}} from my tools', { title: tool.title })
              : t('Pin {{title}} to my tools', { title: tool.title })
          }
          title={isFavorite ? t('Pinned') : t('Pin to my tools')}
          onClick={() => toggleFavorite(tool.id)}
          icon={
            <Icon
              iconName="star"
              variant={isFavorite ? 'filled' : 'outlined'}
              $size="20px"
              $withThemeInherited
            />
          }
        />
      </Box>
    );
  };
  const list = (items: ToolEntry[], label: string) => (
    <Box
      as="ul"
      aria-label={label}
      $gap="8px"
      $css="margin: 0; padding: 0; list-style: none;"
    >
      {items.map(toolRow)}
    </Box>
  );

  // The writing tools, on their cards, by what you do: one verb each.
  const cardTitles: Record<string, string> = {
    'email-reply': t('Reply'),
    letter: t('Draft'),
    rewrite: t('Rework'),
    translate: t('Translate'),
  };
  const toolCards = (items: ToolEntry[], label: string) => (
    // Centred in the free height of the panel, never stuck to the top.
    <Box $css="flex: 1; justify-content: center; padding: 8px 0 24px;">
      <Box
        as="ul"
        aria-label={label}
        $css={css`
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          grid-auto-rows: minmax(170px, auto);
          gap: 14px;
          margin: 0;
          padding: 0;
          list-style: none;
        `}
      >
        {items.map((tool) => (
          <Box as="li" key={tool.id} $css="display: flex;">
            <Box
              as="button"
              type="button"
              onClick={() => open(tool.id)}
              $align="center"
              $justify="center"
              $gap="10px"
              $css={familyCardCss}
            >
              {/* Nestor doing what the tool does. */}
              <img
                src={`${import.meta.env.BASE_URL}assets/nestor-tool-${tool.id}.webp`}
                alt=""
                width={88}
                height={88}
              />
              <Text $size="lg" $weight="800" $textAlign="center">
                {cardTitles[tool.id] ?? tool.title}
              </Text>
              <Text $size="sm" $variation="secondary" $textAlign="center">
                {tool.description}
              </Text>
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );

  const family = categories.find((item) => item.id === familyId);
  if (family && !query) {
    return (
      <Box $gap="16px" $padding={{ all: 'base' }} $css="min-height: 100%;">
        <Box $direction="row">
          <Button
            size="small"
            color="neutral"
            variant="tertiary"
            onClick={() => setFamilyId(null)}
            icon={<Icon iconName="arrow_back" $size="18px" />}
          >
            {t('What AI can do for you')}
          </Button>
        </Box>
        <Box $direction="row" $align="center" $gap="12px">
          <img
            src={family.image}
            alt=""
            width={64}
            height={64}
            style={{ flex: 'none', borderRadius: '50%', background: '#f7f8fd' }}
          />
          <Box $gap="2px">
            <Text as="h2" $size="lg" $weight="800" $margin="0">
              {family.label}
            </Text>
            <Text $size="sm" $variation="secondary">
              {family.description}
            </Text>
          </Box>
        </Box>
        {toolCards(offered(family.tools), family.label)}
      </Box>
    );
  }

  return (
    // The whole height of the panel: the cards fill it, the search at the end.
    <Box $gap="16px" $padding={{ all: 'base' }} $css="min-height: 100%;">
      <Box $direction="row" $align="center" $gap="12px">
        <img
          src={NESTOR_WRITE_URL}
          alt=""
          width={56}
          height={56}
          style={{ flex: 'none', borderRadius: '50%', background: '#f7f8fd' }}
        />
        <Box $gap="2px">
          <Text as="h2" $size="lg" $weight="800" $margin="0">
            {t('What AI can do for you')}
          </Text>
          <Text $size="sm" $variation="secondary">
            {t('Pick what you want to do: Nestor prepares the request.')}
          </Text>
        </Box>
      </Box>

      {words.length > 0 ? (
        <Box $gap="10px" aria-live="polite">
          {found.length > 0 ? (
            <>
              <Text as="h3" $size="sm" $weight="700" $margin="0">
                {t('Recommended for your need')}
              </Text>
              {list(found.slice(0, 1), t('Tools for your need'))}
              {found.length > 1 && (
                <Text as="h3" $size="sm" $weight="700" $margin="0">
                  {t('Other tools')}
                </Text>
              )}
              {found.length > 1 && list(found.slice(1), t('Other tools'))}
              <Text as="h3" $size="xs" $variation="secondary" $margin="0">
                {t('Other possibilities')}
              </Text>
            </>
          ) : (
            <Text $size="sm" $variation="secondary">
              {t('No tool has this name. Nestor can still help:')}
            </Text>
          )}
          <Box $gap="4px" $align="flex-start">
            <Button
              size="small"
              color="neutral"
              variant="tertiary"
              onClick={() => open('library')}
              icon={<Icon iconName="menu_book" $size="18px" />}
            >
              {t('Search the templates for this need')}
            </Button>
            {isAiAvailable && (
              <Button
                size="small"
                color="neutral"
                variant="tertiary"
                onClick={() => open('generator')}
                icon={<Icon iconName="auto_fix_high" $size="18px" />}
              >
                {t('Nestor writes the request for this need')}
              </Button>
            )}
          </Box>
        </Box>
      ) : (
        // Centred in the free height of the panel, never stuck to the top.
        <Box $css="flex: 1; justify-content: center; padding: 16px 0;">
          <Box
            as="ul"
            aria-label={t('What AI can do for you')}
            $css={css`
              display: grid;
              grid-template-columns: repeat(2, minmax(0, 1fr));
              grid-auto-rows: minmax(190px, auto);
              gap: 14px;
              margin: 0;
              padding: 0;
              list-style: none;
            `}
          >
            {categories.map((item) => (
              <Box as="li" key={item.id} $css="display: flex;">
                <Box
                  as="button"
                  type="button"
                  onClick={() => setFamilyId(item.id)}
                  $align="center"
                  $justify="center"
                  $gap="10px"
                  $css={familyCardCss}
                >
                  <img src={item.image} alt="" width={88} height={88} />
                  <Text $size="lg" $weight="800">
                    {item.label}
                  </Text>
                  <Text $size="sm" $variation="secondary" $textAlign="center">
                    {item.description}
                  </Text>
                </Box>
              </Box>
            ))}
          </Box>
        </Box>
      )}
      <Box $gap="4px" $css="margin-top: auto;">
        <label htmlFor="nestor-tools-search">
          <Text $size="sm" $variation="secondary">
            {t('Looking for something else? Say it in your words.')}
          </Text>
        </label>
        <Box
          as="input"
          id="nestor-tools-search"
          type="search"
          value={query}
          onChange={(event: React.ChangeEvent<HTMLInputElement>) =>
            setQuery(event.target.value)
          }
          placeholder={t(
            'For example: reply to an unhappy member of the public',
          )}
          $css={searchCss}
        />
      </Box>
    </Box>
  );
};
