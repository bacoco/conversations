import { Button, Loader } from '@gouvfr-lasuite/cunningham-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text, useToast } from '@/components';

import {
  GeneratedPrompt,
  PromptImprovement,
  generatePrompts,
  improvePrompt,
} from '../coach/coachApi';
import { languageName } from '../coach/language';
import { levelColor, wordLevel } from '../coach/levels';
import { SensitiveKind, detectSensitiveData } from '../coach/sensitiveData';
import { useAfterAnswer } from '../coach/useAfterAnswer';
import { useCoachThread } from '../coach/useCoachThread';
import { usePromptAnalysis } from '../coach/usePromptAnalysis';
import { wordDiff } from '../coach/wordDiff';
import { useOfferPrompt } from '../fill/useOfferPrompt';
import { SavePromptButton } from '../library/SavePromptButton';
import { searchLibrary } from '../library/embeddingSearch';
import type { LibraryPrompt } from '../library/types';
import { useReward } from '../rewards/useReward';
import { useCoachHistoryStore } from '../stores/useCoachHistoryStore';
import { useProfileStore } from '../stores/useProfileStore';
import {
  usePromptToolkitStore,
  useSectionReset,
} from '../stores/usePromptToolkitStore';

import { CoachActionBar } from './CoachActionBar';
import { ExplainedComparison, TutorHints } from './CoachExtras';
import { AssistResults, InstantSuggestions } from './CoachModes';
import { CoachStatus } from './CoachStatus';
import { CoachThreadView } from './CoachThreadView';
import { DiffView } from './DiffView';
import { DinumGrid } from './DinumGrid';
import { LivePillars } from './LivePillars';
import { PromptAddOns } from './PromptAddOns';
import { SessionReviewPanel } from './SessionReviewPanel';

const sectionCss = css`
  padding: 16px;
  border-bottom: 1px solid var(--c--contextuals--border--surface--primary);
`;

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

const NESTOR_PEEPHOLE_VIDEO_URL = '/assets/nestor-peephole.mp4';
const NESTOR_PEEPHOLE_POSTER_URL = '/assets/nestor-peephole-poster.webp';

const nestorPeepholeCss = css`
  position: relative;
  flex: none;
  display: block;
  width: 72px;
  height: 72px;
  padding: 0;
  overflow: hidden;
  border: 0;
  border-radius: 50%;
  cursor: pointer;
  background: #f7f8fd;
  background-image: url(${NESTOR_PEEPHOLE_POSTER_URL});
  background-position: center;
  background-size: cover;

  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 3px;
  }
`;

const nestorPeepholeVideoCss = css`
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
  pointer-events: none;
`;

const NestorPeephole = () => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const playOnce = () => {
    if (isPlaying) {
      return;
    }

    const video = videoRef.current;
    if (!video) {
      return;
    }

    video.currentTime = 0;
    setIsPlaying(true);
    void video.play().catch(() => setIsPlaying(false));
  };

  const resetToPoster = () => {
    const video = videoRef.current;
    if (video) {
      video.currentTime = 0;
    }
    setIsPlaying(false);
  };

  return (
    <Box
      as="button"
      type="button"
      onClick={playOnce}
      aria-label={t('Watch Nestor look through the peephole')}
      aria-pressed={isPlaying}
      data-playing={isPlaying}
      $css={nestorPeepholeCss}
    >
      <Box
        ref={videoRef}
        as="video"
        aria-hidden="true"
        data-testid="nestor-peephole-video"
        src={NESTOR_PEEPHOLE_VIDEO_URL}
        poster={NESTOR_PEEPHOLE_POSTER_URL}
        preload="metadata"
        muted
        playsInline
        disablePictureInPicture
        onEnded={resetToPoster}
        onError={resetToPoster}
        $css={nestorPeepholeVideoCss}
      />
    </Box>
  );
};

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
  const language = languageName(i18n.language);

  const analysis = usePromptAnalysis(chatInput, language);
  const after = useAfterAnswer(isActive, language);
  const thread = useCoachThread(language);
  // "Advice" shown with exchanges it has not read yet: it reads them now,
  // instead of waiting on nothing.
  const { askNote } = thread;
  useEffect(() => {
    if (
      isActive &&
      coachMode === 'advice' &&
      thread.newExchanges > 0 &&
      thread.status === 'idle'
    ) {
      askNote();
    }
  }, [isActive, coachMode, thread.newExchanges, thread.status, askNote]);
  const sensitive = useMemo(() => detectSensitiveData(chatInput), [chatInput]);

  const [improvement, setImprovement] = useState<
    (PromptImprovement & { original: string }) | null
  >(null);
  const [showDiff, setShowDiff] = useState(false);
  const [assist, setAssist] = useState<{
    variants: GeneratedPrompt[];
    matches: LibraryPrompt[];
  } | null>(null);
  const [isAssisting, setIsAssisting] = useState(false);
  const [assistError, setAssistError] = useState(false);
  const assistControllerRef = useRef<AbortController | null>(null);
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
    assistControllerRef.current?.abort();
    setAssist(null);
    setAssistError(false);
    if (usePromptToolkitStore.getState().coachMode === 'advice') {
      thread.clear();
    }
  });

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
    // Placeholders left by the rewrite are filled through Nestor's questions.
    // "Replace my prompt" says it: the draft gives way to its version.
    offerPrompt(improvement.improvedPrompt, t('Improved prompt'), {
      replaceDraft: true,
    });
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
  // Beginners see the essentials: the level, two next steps, a better version.
  const isBeginner = useProfileStore((state) => state.isBeginner);
  const visibleSuggestions = result
    ? result.suggestions.slice(0, isBeginner ? 2 : undefined)
    : [];

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

  const hasDraft = chatInput.trim() !== '';

  // "Prompt help": versions written by Nestor, plus library matches.
  const runAssist = async () => {
    const draft = chatInput.trim();
    assistControllerRef.current?.abort();
    const controller = new AbortController();
    assistControllerRef.current = controller;
    setIsAssisting(true);
    setAssistError(false);
    // Library prompts closest in meaning, alongside Nestor's versions.
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
        setAssistError(true);
      }
    } finally {
      setIsAssisting(false);
    }
  };

  // The four actions at the bottom: "as you type" is a mode, the others
  // run on the request (or the conversation) when pressed.
  const actions = [
    {
      mode: 'assist' as const,
      icon: 'auto_awesome',
      label: t('Help'),
      title: t('Help me with this prompt'),
      disabled: !hasDraft,
      isLoading: isAssisting,
      onClick: () => {
        setCoachMode('assist');
        if (!isAssisting) {
          void runAssist();
        }
      },
    },
    {
      mode: 'manual' as const,
      icon: 'grading',
      label: t('Analysis'),
      title:
        result && !analysis.isStale
          ? t('Analysis up to date')
          : result
            ? t('Update the analysis')
            : t('Analyse my prompt'),
      disabled: !hasDraft,
      isLoading: analysis.status === 'loading',
      onClick: () => {
        setCoachMode('manual');
        if (!result || analysis.isStale) {
          analysis.analyzeNow();
        }
      },
    },
    {
      mode: 'instant' as const,
      icon: 'bolt',
      label: t('Live'),
      title: t('As you type'),
      onClick: () => setCoachMode('instant'),
    },
    {
      mode: 'advice' as const,
      icon: 'forum',
      label: t('Advice'),
      title: t('Nestor’s view on this exchange'),
      groupStart: true,
      disabled: !after.hasAnswer && thread.entries.length === 0,
      isLoading: thread.status === 'loading',
      // A new answer: Nestor has advice and ways to go on.
      hasNews: coachMode !== 'advice' && thread.newExchanges > 0,
      onClick: () => {
        setCoachMode('advice');
        if (thread.status === 'error') {
          askNote();
        }
      },
    },
  ];
  /** Nothing to show yet in this mode: one line says what to do. */
  const idleHint =
    coachMode === 'instant'
      ? !hasDraft &&
        t('Start writing your request: I suggest close requests as you type.')
      : coachMode === 'manual'
        ? !hasDraft &&
          !result &&
          t('Write your request, then press “Analysis” below.')
        : coachMode === 'assist'
          ? !hasDraft &&
            !assist &&
            t('Write your request, then press “Prompt help” below.')
          : false;

  return (
    <Box
      $direction="column"
      // Fills the panel, so the action bar sits at its bottom.
      $css="flex: 1 0 auto;"
    >
      <CoachStatus
        isLoading={analysis.status === 'loading' || isAssisting}
        loadingLabel={
          isAssisting
            ? t('Nestor is writing versions of your prompt…')
            : undefined
        }
      />
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

      {/* Between the header and the buttons, what the coach shows sits in
          the middle: a short block is never stuck to the top. */}
      <Box $css="flex: 1; justify-content: center;">
        {idleHint && (
          <Box $align="center" $gap="12px" $padding={{ all: 'lg' }}>
            <NestorPeephole />
            <Text $textAlign="center" $size="sm">
              {idleHint}
            </Text>
          </Box>
        )}

        {coachMode === 'advice' && (
          <CoachThreadView
            entries={thread.entries}
            status={thread.status}
            asking={thread.asking}
            hasAnswer={thread.hasAnswer}
            gaps={after.gaps}
            canReview={thread.canReview}
            next={after.next}
            isUpToDate={thread.newExchanges === 0}
            onRetry={askNote}
            onAsk={thread.askMore}
            onReview={() => setCoachMode('session')}
          />
        )}
        {coachMode === 'session' && (
          // Reached from the end of the advice thread, and back to it.
          <SessionReviewPanel
            language={language}
            autoStart
            onBack={() => setCoachMode('advice')}
          />
        )}

        {coachMode === 'assist' && chatInput.trim() !== '' && assist && (
          <AssistResults variants={assist.variants} matches={assist.matches} />
        )}
        {/* A request typed, nothing asked yet: say what happens, ask here. */}
        {coachMode === 'assist' &&
          chatInput.trim() !== '' &&
          !assist &&
          !isAssisting &&
          !assistError && (
            <Box $align="center" $gap="10px" $padding={{ all: 'lg' }}>
              <Icon iconName="auto_awesome" $size="40px" $theme="brand" />
              <Text $textAlign="center" $weight="700">
                {t('Your request is ready')}
              </Text>
              <Text $textAlign="center" $size="sm" $variation="secondary">
                {t(
                  'I write several versions and find matching prompts in the library.',
                )}
              </Text>
              <Button
                onClick={() => void runAssist()}
                icon={<Icon iconName="auto_awesome" $size="18px" />}
              >
                {t('Help me with this prompt')}
              </Button>
            </Box>
          )}
        {coachMode === 'assist' && isAssisting && !assist && (
          <Box
            $align="center"
            $gap="10px"
            $padding={{ all: 'lg' }}
            role="status"
          >
            <Loader size="small" />
            <Text $textAlign="center" $size="sm">
              {t('Nestor is writing versions of your prompt…')}
            </Text>
          </Box>
        )}
        {coachMode === 'assist' && assistError && (
          <Text $size="sm" role="alert" $css="padding: 16px;">
            {t('Nestor could not write versions. Please retry.')}
          </Text>
        )}

        {coachMode === 'instant' && <InstantSuggestions text={chatInput} />}

        {coachMode === 'manual' && (
          <>
            {analysis.isLongEnough && !result && analysis.status === 'idle' && (
              <Box $align="center" $gap="8px" $padding={{ all: 'lg' }}>
                {!isBeginner && (
                  <Box $css="align-self: stretch; margin-bottom: 12px;">
                    <LivePillars text={chatInput} />
                  </Box>
                )}
                <Icon iconName="grading" $size="40px" $theme="brand" />
                <Text $textAlign="center" $weight="700">
                  {t('Your prompt is ready to be analysed')}
                </Text>
                <Text $textAlign="center" $size="sm" $variation="secondary">
                  {t(
                    'Press “Analysis” below when you want the coach to read it.',
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
                <Button
                  size="small"
                  color="neutral"
                  onClick={analysis.analyzeNow}
                >
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
                <Box
                  $direction="row"
                  $gap="16px"
                  $align="center"
                  $css={sectionCss}
                >
                  <Box $direction="column" $gap="4px" $css="min-width: 0;">
                    <Box $direction="row" $gap="8px" $align="center">
                      <Text
                        $size="lg"
                        $weight="700"
                        $css={css`
                          color: ${levelColor(result.score)};
                        `}
                      >
                        {wordLevel(result.score, t)}
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

                {!isBeginner && (
                  <Box $css={sectionCss}>
                    <DinumGrid result={result} />
                  </Box>
                )}

                {result.suggestions.length > 0 && (
                  <Box $gap="12px" $css={sectionCss}>
                    {result.suggestions.length > 0 && (
                      <Box $gap="8px">
                        <Text as="h3" $size="sm" $weight="700" $margin="0">
                          {t('To go further')}
                        </Text>
                        <Box as="ul" $gap="8px" $css="margin: 0; padding: 0;">
                          {visibleSuggestions.map((suggestion) => (
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
                  {/* Learning by oneself: hints instead of a ready version. */}
                  {!improvement && (
                    <TutorHints
                      prompt={analysis.analyzedText ?? chatInput}
                      language={language}
                    />
                  )}

                  {improvement && (
                    <Box
                      ref={improvementRef}
                      $gap="12px"
                      $css={css`
                        scroll-margin-top: 16px;
                        padding: 12px;
                        border-radius: 8px;
                        border: 1px solid
                          var(
                            --c--contextuals--border--semantic--brand--secondary
                          );
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
          </>
        )}
      </Box>

      {isActive && (
        <CoachActionBar
          actions={actions}
          current={coachMode}
          label={t('Coach mode')}
        />
      )}
    </Box>
  );
};
