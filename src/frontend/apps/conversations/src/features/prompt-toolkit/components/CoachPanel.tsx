import { Button, Loader } from '@gouvfr-lasuite/cunningham-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text, useToast } from '@/components';

import { PromptImprovement, improvePrompt } from '../coach/coachApi';
import { languageName } from '../coach/language';
import { levelColor, levelLabel } from '../coach/levels';
import { SensitiveKind, detectSensitiveData } from '../coach/sensitiveData';
import { usePromptAnalysis } from '../coach/usePromptAnalysis';
import { wordDiff } from '../coach/wordDiff';
import { useOfferPrompt } from '../fill/useOfferPrompt';
import { SavePromptButton } from '../library/SavePromptButton';
import { useReward } from '../rewards/useReward';
import { useCoachHistoryStore } from '../stores/useCoachHistoryStore';
import {
  usePromptToolkitStore,
  useSectionReset,
} from '../stores/usePromptToolkitStore';

import { CoachIntro } from './CoachIntro';
import { CoachModeSelector } from './CoachModeSelector';
import { CoachStatus } from './CoachStatus';
import { DiffView } from './DiffView';
import { FloatingAnalyzeButton } from './FloatingAnalyzeButton';
import { ScoreGauge } from './ScoreGauge';
import { SessionReviewPanel } from './SessionReviewPanel';

const sectionCss = css`
  padding: 16px;
  border-bottom: 1px solid var(--c--contextuals--border--surface--primary);
`;

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** `isActive` is false while the panel is hidden: live mode then pauses. */
export const CoachPanel = ({ isActive = true }: { isActive?: boolean }) => {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const offerPrompt = useOfferPrompt();
  const reward = useReward();
  const chatInput = usePromptToolkitStore((state) => state.chatInput);
  const setChatInput = usePromptToolkitStore((state) => state.setChatInput);
  const coachMode = usePromptToolkitStore((state) => state.coachMode);
  const setCoachMode = usePromptToolkitStore((state) => state.setCoachMode);
  const isOptionsOpen = usePromptToolkitStore(
    (state) => state.isCoachOptionsOpen,
  );
  const setOptionsOpen = usePromptToolkitStore(
    (state) => state.setCoachOptionsOpen,
  );
  const language = languageName(i18n.language);

  const analysis = usePromptAnalysis(chatInput, language);
  const sensitive = useMemo(() => detectSensitiveData(chatInput), [chatInput]);

  const [improvement, setImprovement] = useState<
    (PromptImprovement & { original: string }) | null
  >(null);
  const [showDiff, setShowDiff] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const improveControllerRef = useRef<AbortController | null>(null);
  const improvementRef = useRef<HTMLDivElement | null>(null);

  // Record the grade when the analysed prompt is sent (the input empties).
  const recordInHistory = useCoachHistoryStore((state) => state.record);
  const previousInputRef = useRef(chatInput);
  useEffect(() => {
    const previous = previousInputRef.current.trim();
    previousInputRef.current = chatInput;
    const sent = analysis.analysis;
    if (chatInput.trim() === '' && sent && previous === analysis.analyzedText) {
      recordInHistory(previous, sent.score, sent.competencies);
    }
  }, [chatInput, analysis.analysis, analysis.analyzedText, recordInHistory]);

  // A rewrite only makes sense for the text it was computed on.
  useEffect(() => {
    setImprovement(null);
  }, [analysis.analyzedText]);

  // Bring a new rewrite into view: it appears below the fold.
  useEffect(() => {
    if (improvement) {
      improvementRef.current?.scrollIntoView?.({
        behavior: prefersReducedMotion() ? 'auto' : 'smooth',
        block: 'start',
      });
    }
  }, [improvement]);

  // The trash button in the panel header clears the analysis.
  useSectionReset('coach', () => {
    improveControllerRef.current?.abort();
    setIsImproving(false);
    setImprovement(null);
    analysis.reset();
  });

  // The mode options fold away as soon as the user types.
  const typedRef = useRef(chatInput);
  useEffect(() => {
    if (chatInput !== typedRef.current) {
      typedRef.current = chatInput;
      setOptionsOpen(false);
    }
  }, [chatInput, setOptionsOpen]);
  useEffect(() => () => improveControllerRef.current?.abort(), []);

  const sensitiveLabels: Record<SensitiveKind, string> = {
    email: t('an email address'),
    phone: t('a phone number'),
    nir: t('a social security number'),
    iban: t('an IBAN'),
    card: t('a card number'),
  };

  const runImprovement = async () => {
    improveControllerRef.current?.abort();
    const controller = new AbortController();
    improveControllerRef.current = controller;
    setIsImproving(true);
    const original = chatInput.trim();
    try {
      setImprovement({
        ...(await improvePrompt(
          original,
          language,
          [],
          controller.signal,
          analysis.analysis?.suggestions,
        )),
        original,
      });
      setShowDiff(false);
    } catch {
      if (!controller.signal.aborted) {
        showToast('error', t('The coach could not rewrite this prompt.'));
      }
    } finally {
      if (improveControllerRef.current === controller) {
        setIsImproving(false);
      }
    }
  };

  const applyImprovement = () => {
    if (!improvement) {
      return;
    }
    // Placeholders left by the rewrite are filled through Robin's questions.
    offerPrompt(improvement.improvedPrompt, t('Improved prompt'));
    reward('improvement');
    setImprovement(null);
  };

  const copyImprovement = async () => {
    if (!improvement) {
      return;
    }
    await navigator.clipboard.writeText(improvement.improvedPrompt);
    showToast('success', t('Copied to clipboard.'), undefined, 2000);
  };

  const result = analysis.analysis;

  const improvementDiff = useMemo(
    () =>
      improvement
        ? wordDiff(improvement.original, improvement.improvedPrompt)
        : null,
    [improvement],
  );

  // Each new grade earns points; a great one, a bit more.
  const rewardedRef = useRef<typeof result>(null);
  useEffect(() => {
    if (!result || rewardedRef.current === result) {
      return;
    }
    rewardedRef.current = result;
    reward('analysis');
    if (result.score >= 80) {
      reward('great-prompt');
    }
    // `reward` is a fresh function each render; only new grades matter.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [result]);

  const modeDescriptions = {
    off: t('Nothing you type is sent to the coach.'),
    manual: t('The coach reads your prompt only when you ask for it.'),
    live: t('The coach reads your prompt at each pause in typing.'),
    session: t('The coach reviews the whole conversation when you ask.'),
  };

  const modeRow = isOptionsOpen && (
    <Box
      id="coach-options"
      $gap="6px"
      $css={css`
        padding: 12px 16px;
        border-bottom: 1px solid var(--c--contextuals--border--surface--primary);
        background: var(--c--contextuals--background--surface--secondary);
      `}
    >
      <CoachModeSelector value={coachMode} onChange={setCoachMode} />
      <Text $size="xs" $variation="secondary">
        {modeDescriptions[coachMode]}
      </Text>
    </Box>
  );

  if (coachMode === 'session') {
    return (
      <Box $direction="column">
        {modeRow}
        <SessionReviewPanel language={language} />
      </Box>
    );
  }

  if (coachMode === 'off') {
    return (
      <Box $direction="column">
        {modeRow}
        <Box $align="center" $gap="8px" $padding={{ all: 'lg' }}>
          <Icon iconName="pause_circle" $size="40px" $variation="secondary" />
          <Text $textAlign="center" $weight="700">
            {t('The coach is off')}
          </Text>
          <Text $textAlign="center" $size="sm" $variation="secondary">
            {t('Choose "On demand" or "Live" to get a grade and advice.')}
          </Text>
          {!isOptionsOpen && (
            <Button
              size="small"
              color="neutral"
              variant="secondary"
              onClick={() => setOptionsOpen(true)}
            >
              {t('Change mode')}
            </Button>
          )}
        </Box>
      </Box>
    );
  }

  const showAnalyzeButton = isActive && chatInput.trim() !== '';

  return (
    <Box
      $direction="column"
      // Fills the panel, so the analyse bar sits at its bottom.
      $css="flex: 1 0 auto;"
    >
      {modeRow}
      <CoachStatus isLoading={analysis.status === 'loading'} />
      {sensitive.length > 0 && (
        <Box
          role="alert"
          $direction="row"
          $gap="8px"
          $css={css`
            margin: 16px 16px 0;
            padding: 12px;
            border-radius: 8px;
            color: var(--c--contextuals--content--semantic--warning--primary);
            background: var(
              --c--contextuals--background--semantic--warning--tertiary
            );
          `}
        >
          <Icon iconName="shield" $size="20px" $theme="warning" />
          <Text $size="sm">
            {t(
              'Your prompt seems to contain {{items}}. Remove personal data that the task does not need before sending.',
              {
                items: sensitive
                  .map((kind) => sensitiveLabels[kind])
                  .join(', '),
              },
            )}
          </Text>
        </Box>
      )}

      {!result && chatInput.trim() === '' && <CoachIntro />}

      {analysis.isLongEnough && !result && analysis.status === 'idle' && (
        <Box $align="center" $gap="8px" $padding={{ all: 'lg' }}>
          <Icon iconName="grading" $size="40px" $theme="brand" />
          <Text $textAlign="center" $weight="700">
            {t('Your prompt is ready to be analysed')}
          </Text>
          <Text $textAlign="center" $size="sm" $variation="secondary">
            {t(
              'Click the round button at the bottom of the panel when you want the coach to read it.',
            )}
          </Text>
        </Box>
      )}

      {analysis.status === 'error' && !result && (
        <Box $align="center" $gap="8px" $padding={{ all: 'lg' }}>
          <Text $textAlign="center" $size="sm">
            {analysis.errorStatus === 429
              ? t('Too many requests: wait a minute, then retry.')
              : t('The coach could not grade this prompt.')}
          </Text>
          <Button size="small" color="neutral" onClick={analysis.analyzeNow}>
            {t('Retry')}
          </Button>
        </Box>
      )}

      {result && (
        <Box
          $direction="column"
          aria-busy={analysis.status === 'loading'}
          $css={css`
            transition: opacity 0.2s ease;
            opacity: ${analysis.isStale ? 0.6 : 1};
          `}
        >
          <Box $direction="row" $gap="16px" $align="center" $css={sectionCss}>
            <ScoreGauge score={result.score} />
            <Box $direction="column" $gap="4px" $css="min-width: 0;">
              <Box $direction="row" $gap="8px" $align="center">
                <Text
                  $weight="700"
                  $css={css`
                    color: ${levelColor(result.score)};
                  `}
                >
                  {levelLabel(result.score, t)}
                </Text>
                {analysis.status === 'loading' && <Loader size="small" />}
              </Box>
              {result.verdict && <Text $size="sm">{result.verdict}</Text>}
              {analysis.isStale &&
                analysis.status !== 'loading' &&
                chatInput.trim() !== '' && (
                  <Text $size="xs" $variation="secondary">
                    {t('Your prompt has changed since this analysis.')}
                  </Text>
                )}
            </Box>
          </Box>

          {result.suggestions.length > 0 && (
            <Box $gap="12px" $css={sectionCss}>
              {result.suggestions.length > 0 && (
                <Box $gap="8px">
                  <Text as="h3" $size="sm" $weight="700" $margin="0">
                    {t('To go further')}
                  </Text>
                  <Box as="ul" $gap="8px" $css="margin: 0; padding: 0;">
                    {result.suggestions.map((suggestion) => (
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
            </Box>
          )}

          <Box $gap="12px" $css={sectionCss}>
            <Button
              fullWidth
              disabled={isImproving}
              onClick={() => void runImprovement()}
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
                ref={improvementRef}
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
                  {improvementDiff && (
                    <Button
                      size="nano"
                      color="neutral"
                      variant="tertiary"
                      aria-pressed={showDiff}
                      onClick={() => setShowDiff((value) => !value)}
                      icon={<Icon iconName="difference" $size="16px" />}
                    >
                      {showDiff
                        ? t('Show the new version')
                        : t('Show the changes')}
                    </Button>
                  )}
                </Box>
                {showDiff && improvementDiff ? (
                  <DiffView parts={improvementDiff} />
                ) : (
                  <Text
                    $size="sm"
                    $css={css`
                      white-space: pre-wrap;
                      overflow-wrap: anywhere;
                      padding: 10px 12px;
                      border-radius: 6px;
                      background: var(
                        --c--contextuals--background--surface--primary
                      );
                    `}
                  >
                    {improvement.improvedPrompt}
                  </Text>
                )}
                {improvement.changes.length > 0 && (
                  <Box $gap="4px">
                    <Text $size="xs" $weight="600">
                      {t('What changed')}
                    </Text>
                    <Box
                      as="ul"
                      $gap="2px"
                      $css="margin: 0; padding-left: 18px;"
                    >
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
                <Box $direction="row" $gap="8px" $css="flex-wrap: wrap;">
                  <Button
                    size="small"
                    disabled={!setChatInput}
                    onClick={applyImprovement}
                    icon={<Icon iconName="check" $size="16px" />}
                  >
                    {t('Replace my prompt')}
                  </Button>
                  <Button
                    size="small"
                    color="neutral"
                    variant="secondary"
                    onClick={() => void copyImprovement()}
                    icon={<Icon iconName="content_copy" $size="16px" />}
                  >
                    {t('Copy')}
                  </Button>
                  <SavePromptButton prompt={improvement.improvedPrompt} />
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      )}
      {/* Only useful once the user has started typing. */}
      {showAnalyzeButton && (
        <FloatingAnalyzeButton
          label={
            result && !analysis.isStale
              ? t('Analysis up to date')
              : result
                ? t('Update the analysis')
                : t('Analyse my prompt')
          }
          onClick={analysis.analyzeNow}
          isLoading={analysis.status === 'loading'}
          // The button is only shown with text, even a short one.
          disabled={
            analysis.status === 'loading' ||
            (result !== null && !analysis.isStale)
          }
        />
      )}
    </Box>
  );
};
