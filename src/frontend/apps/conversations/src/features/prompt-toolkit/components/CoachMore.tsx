import { Button, Loader } from '@gouvfr-lasuite/cunningham-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text, useToast } from '@/components';

import { useAiAvailable } from '../coach/aiAvailability';
import {
  GeneratedPrompt,
  PromptAnalysis,
  PromptImprovement,
  annotateRequest,
  generatePrompts,
  hasPlaceholders,
  improvePrompt,
} from '../coach/coachApi';
import { levelColor, wordLevel } from '../coach/levels';
import { wordDiff } from '../coach/wordDiff';
import { AnnotatedRequest } from '../learn/SlideView';
import type { PromptPart } from '../learn/types';
import { SavePromptButton } from '../library/SavePromptButton';
import { searchLibrary } from '../library/embeddingSearch';
import type { LibraryPrompt } from '../library/types';
import { useReward } from '../rewards/useReward';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

import { ExplainedComparison, TutorHints } from './CoachExtras';
import { AssistResults, InstantSuggestions } from './CoachModes';
import { actionsCss, coachTextCss } from './CoachParts';
import { DiffView } from './DiffView';
import { DinumGrid } from './DinumGrid';
import { PromptAddOns } from './PromptAddOns';

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

const SectionTitle = ({ children }: { children: string }) => (
  <Text as="h3" $size="sm" $weight="700" $margin="0">
    {children}
  </Text>
);

/** The reading in detail: level, the State's 4 rules, the next steps. */
const ReadingDetails = ({
  result,
  isBeginner,
}: {
  result: PromptAnalysis;
  isBeginner: boolean;
}) => {
  const { t } = useTranslation();
  // Beginners see the essentials: the level and two next steps.
  const suggestions = result.suggestions.slice(0, isBeginner ? 2 : undefined);
  return (
    <>
      <Box $direction="row" $align="center" $gap="8px">
        <Text $size="sm" $weight="700">
          {t('Level of your request:')}
        </Text>
        <Text
          $size="sm"
          $weight="700"
          $css={css`
            color: ${levelColor(result.score)};
          `}
        >
          {wordLevel(result.score, t)}
        </Text>
      </Box>
      {!isBeginner && <DinumGrid result={result} />}
      {suggestions.length > 0 && (
        <Box $gap="8px">
          <SectionTitle>{t('To go further')}</SectionTitle>
          <Box as="ul" $gap="8px" $css="margin: 0; padding: 0;">
            {suggestions.map((suggestion) => (
              <Box
                as="li"
                key={suggestion}
                $direction="row"
                $gap="8px"
                $css="list-style: none;"
              >
                <Icon
                  iconName="arrow_forward"
                  $size="16px"
                  $theme="brand"
                  $css="margin-top: 2px;"
                />
                <Text $size="sm">{suggestion}</Text>
              </Box>
            ))}
          </Box>
        </Box>
      )}
    </>
  );
};

/** A version rewritten by Nestor in one go, with what changed and why. */
const Rewrite = ({
  prompt,
  result,
  language,
  isBeginner,
  onPlace,
}: {
  prompt: string;
  result: PromptAnalysis | null;
  language: string;
  isBeginner: boolean;
  onPlace: (text: string) => void;
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const reward = useReward();
  const isAiAvailable = useAiAvailable();
  const startFill = usePromptToolkitStore((state) => state.startFill);
  const [improvement, setImprovement] = useState<
    (PromptImprovement & { original: string }) | null
  >(null);
  const [showDiff, setShowDiff] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const cardRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);
  // Bring a new rewrite into view: it appears below the fold.
  useEffect(() => {
    if (improvement) {
      cardRef.current?.scrollIntoView?.({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  }, [improvement]);

  const diff = useMemo(
    () =>
      improvement
        ? wordDiff(improvement.original, improvement.improvedPrompt)
        : null,
    [improvement],
  );

  const run = async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsImproving(true);
    const original = prompt.trim();
    try {
      setImprovement({
        ...(await improvePrompt(
          original,
          language,
          [],
          controller.signal,
          result?.suggestions,
        )),
        original,
      });
      setShowDiff(false);
    } catch {
      if (!controller.signal.aborted) {
        showToast('error', t('The coach could not rewrite this prompt.'));
      }
    } finally {
      if (controllerRef.current === controller) {
        setIsImproving(false);
      }
    }
  };

  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('success', t('Copied to clipboard.'), undefined, 2000);
    } catch {
      showToast('error', t('Copy refused: select the text instead.'));
    }
  };

  // Blanks left by the rewrite are filled through Nestor's questions.
  const needsAnswers =
    improvement !== null &&
    isAiAvailable &&
    hasPlaceholders(improvement.improvedPrompt);

  const use = () => {
    if (!improvement) {
      return;
    }
    if (needsAnswers) {
      startFill(improvement.improvedPrompt, t('Improved prompt'));
    } else {
      onPlace(improvement.improvedPrompt);
    }
    reward('improvement');
    setImprovement(null);
  };

  return (
    <Box $gap="10px">
      <Button
        fullWidth
        color="neutral"
        variant="secondary"
        disabled={isImproving || !prompt.trim()}
        onClick={() => void run()}
        icon={
          isImproving ? (
            <Loader size="small" />
          ) : (
            <Icon iconName="auto_fix_high" $size="18px" />
          )
        }
      >
        {t('Suggest a better version')}
      </Button>
      {improvement && (
        <Box
          ref={cardRef}
          $gap="12px"
          $css={css`
            scroll-margin-top: 16px;
            padding: 12px;
            border-radius: 8px;
            border: 1px solid
              var(--c--contextuals--border--semantic--brand--secondary);
            background: var(
              --c--contextuals--background--semantic--brand--tertiary
            );
          `}
        >
          <Box
            $direction="row"
            $align="center"
            $justify="space-between"
            $gap="8px"
          >
            <Text as="h4" $size="sm" $weight="700" $margin="0">
              {t('Suggested version')}
            </Text>
            {diff && (
              <Button
                size="nano"
                color="neutral"
                variant="tertiary"
                aria-pressed={showDiff}
                onClick={() => setShowDiff((value) => !value)}
                icon={<Icon iconName="difference" $size="16px" />}
              >
                {showDiff ? t('Show the new version') : t('Show the changes')}
              </Button>
            )}
          </Box>
          {showDiff && diff ? (
            <DiffView parts={diff} />
          ) : (
            <Text $size="sm" $css={coachTextCss}>
              {improvement.improvedPrompt}
            </Text>
          )}
          {improvement.changes.length > 0 && (
            <Box $gap="4px">
              <Text $size="xs" $weight="600">
                {t('What changed')}
              </Text>
              <Box as="ul" $gap="2px" $css="margin: 0; padding-left: 18px;">
                {improvement.changes.map((change) => (
                  <Text
                    as="li"
                    key={change}
                    $size="xs"
                    $css="display: list-item;"
                  >
                    {change}
                  </Text>
                ))}
              </Box>
            </Box>
          )}
          {!isBeginner && (
            <>
              <ExplainedComparison
                original={improvement.original}
                improved={improvement.improvedPrompt}
                language={language}
              />
              <PromptAddOns
                prompt={improvement.improvedPrompt}
                onChange={(improvedPrompt) =>
                  setImprovement({ ...improvement, improvedPrompt })
                }
              />
            </>
          )}
          {needsAnswers && (
            <Text $size="xs" $variation="secondary">
              {t(
                'Some parts are still between brackets: Nestor asks you for them.',
              )}
            </Text>
          )}
          <Box $direction="row" $gap="8px" $css={actionsCss}>
            <Button
              size="small"
              onClick={use}
              icon={
                <Icon
                  iconName={needsAnswers ? 'edit_note' : 'north_west'}
                  $size="16px"
                />
              }
            >
              {needsAnswers
                ? t('Complete with Nestor')
                : t('Put in the message field')}
            </Button>
            <Button
              size="small"
              color="neutral"
              variant="secondary"
              onClick={() => void copy(improvement.improvedPrompt)}
              icon={<Icon iconName="content_copy" $size="16px" />}
            >
              {t('Copy')}
            </Button>
            <SavePromptButton prompt={improvement.improvedPrompt} />
          </Box>
        </Box>
      )}
    </Box>
  );
};

/** Several versions written by Nestor, and the closest library prompts. */
const Versions = ({
  prompt,
  language,
}: {
  prompt: string;
  language: string;
}) => {
  const { t, i18n } = useTranslation();
  const [assist, setAssist] = useState<{
    variants: GeneratedPrompt[];
    matches: LibraryPrompt[];
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  useEffect(() => () => controllerRef.current?.abort(), []);

  const run = async () => {
    const draft = prompt.trim();
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setIsLoading(true);
    setHasError(false);
    const matchesPromise = searchLibrary(
      draft,
      i18n.language,
      3,
      controller.signal,
    ).catch(() => []);
    try {
      const [variants, matches] = await Promise.all([
        generatePrompts(draft, language, 'detailed', controller.signal),
        matchesPromise,
      ]);
      setAssist({ variants, matches });
    } catch {
      if (!controller.signal.aborted) {
        // The library matches are still worth showing.
        setAssist({ variants: [], matches: await matchesPromise });
        setHasError(true);
      }
    } finally {
      if (controllerRef.current === controller) {
        setIsLoading(false);
      }
    }
  };

  return (
    <Box $gap="10px">
      <Button
        fullWidth
        color="neutral"
        variant="secondary"
        disabled={isLoading || !prompt.trim()}
        onClick={() => void run()}
        icon={
          isLoading ? (
            <Loader size="small" />
          ) : (
            <Icon iconName="auto_awesome" $size="18px" />
          )
        }
      >
        {t('Suggest several versions')}
      </Button>
      {isLoading && (
        <Text $size="sm" $variation="secondary" role="status">
          {t('Nestor is writing versions of your prompt…')}
        </Text>
      )}
      {hasError && (
        <Text $size="sm" role="alert">
          {t('Nestor could not write versions. Please retry.')}
        </Text>
      )}
      {assist && (
        <Box $css="margin: 0 -16px;">
          <AssistResults variants={assist.variants} matches={assist.matches} />
        </Box>
      )}
    </Box>
  );
};

/** Requests close in meaning, already well written: no model, as you type. */
/** The user's own request, each brick in its colour, as in the course. */
const ColouredRequest = ({
  prompt,
  language,
}: {
  prompt: string;
  language: string;
}) => {
  const { t } = useTranslation();
  const [state, setState] = useState<
    | { status: 'idle' | 'loading' | 'error' }
    | { status: 'done'; parts: PromptPart[]; text: string }
  >({ status: 'idle' });
  const controllerRef = useRef<AbortController | null>(null);
  useEffect(() => () => controllerRef.current?.abort(), []);
  const labels = [
    t('Task'),
    t('Context'),
    t('Audience'),
    t('Format'),
    t('Constraints'),
    t('Source'),
    t('Example'),
    t('Verification'),
  ];
  const run = async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setState({ status: 'loading' });
    try {
      const parts = await annotateRequest(
        prompt,
        labels,
        language,
        controller.signal,
      );
      setState({ status: 'done', parts, text: prompt });
    } catch {
      if (!controller.signal.aborted) {
        setState({ status: 'error' });
      }
    }
  };
  if (!prompt.trim()) {
    return null;
  }
  if (state.status === 'done' && state.text === prompt) {
    return (
      <Box $gap="6px">
        <Text $size="sm" $weight="700">
          {t('Your request, brick by brick')}
        </Text>
        <AnnotatedRequest parts={state.parts} />
      </Box>
    );
  }
  return (
    <Box $gap="4px" $align="flex-start">
      <Button
        size="small"
        color="neutral"
        variant="tertiary"
        disabled={state.status === 'loading'}
        onClick={() => void run()}
        icon={
          state.status === 'loading' ? (
            <Loader size="small" />
          ) : (
            <Icon iconName="palette" $size="16px" />
          )
        }
      >
        {t('See my request in colour')}
      </Button>
      {state.status === 'error' && (
        <Text $size="xs" role="alert">
          {t('Nestor could not cut your request. Please retry.')}
        </Text>
      )}
    </Box>
  );
};

/** Close requests are looked for as one types: never while hidden. */
const CloseRequests = ({
  text,
  isActive,
}: {
  text: string;
  isActive: boolean;
}) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  if (!isOpen) {
    return (
      <Button
        fullWidth
        color="neutral"
        variant="secondary"
        onClick={() => setIsOpen(true)}
        icon={<Icon iconName="bolt" $size="18px" />}
      >
        {t('Show close requests, already well written')}
      </Button>
    );
  }
  if (!isActive) {
    return null;
  }
  return (
    <Box $css="margin: 0 -16px;">
      <InstantSuggestions text={text} />
    </Box>
  );
};

/**
 * "More details": everything beyond the essentials, folded by default.
 * Beginners keep every way to get help, without the expert grids.
 */
export const CoachMore = ({
  prompt,
  result,
  language,
  isBeginner,
  onPlace,
  isActive = true,
}: {
  prompt: string;
  /** The reading, once the user asked for it. */
  result: PromptAnalysis | null;
  language: string;
  isBeginner: boolean;
  onPlace: (text: string) => void;
  /** False while the panel is hidden: nothing runs on typing then. */
  isActive?: boolean;
}) => {
  const { t } = useTranslation();
  return (
    <>
      {result && <ReadingDetails result={result} isBeginner={isBeginner} />}
      <Box $gap="10px">
        <SectionTitle>{t('Other ways to help you')}</SectionTitle>
        <Rewrite
          prompt={prompt}
          result={result}
          language={language}
          isBeginner={isBeginner}
          onPlace={onPlace}
        />
        <ColouredRequest prompt={prompt} language={language} />
        {/* Learning by oneself: hints instead of a ready version. */}
        <TutorHints prompt={prompt} language={language} />
        <Versions prompt={prompt} language={language} />
        <CloseRequests text={prompt} isActive={isActive} />
      </Box>
    </>
  );
};
