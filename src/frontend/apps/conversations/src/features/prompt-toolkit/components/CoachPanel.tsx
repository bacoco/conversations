import { Button, Loader } from '@gouvfr-lasuite/cunningham-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text, useToast } from '@/components';

import {
  COMPETENCIES,
  Competency,
  IMPROVEMENT_AXES,
  ImprovementAxis,
  PromptImprovement,
  improvePrompt,
  refinePrompt,
} from '../coach/coachApi';
import { languageName } from '../coach/language';
import { levelColor, levelLabel } from '../coach/levels';
import { SensitiveKind, detectSensitiveData } from '../coach/sensitiveData';
import { usePromptAnalysis } from '../coach/usePromptAnalysis';
import { wordDiff } from '../coach/wordDiff';
import { useAskRobin } from '../fill/useAskRobin';
import { useOfferPrompt } from '../fill/useOfferPrompt';
import { getCourseContent } from '../learn/content';
import {
  LESSON_FOR_COMPETENCY,
  LESSON_HINT_THRESHOLD,
} from '../learn/lessonForCompetency';
import { useLearnProgressStore } from '../learn/useLearnProgressStore';
import { useReward } from '../rewards/useReward';
import { useCoachHistoryStore } from '../stores/useCoachHistoryStore';
import {
  usePromptToolkitStore,
  useSectionReset,
} from '../stores/usePromptToolkitStore';

import { CoachFeedback } from './CoachFeedback';
import { CoachModeSelector } from './CoachModeSelector';
import { CoachStatus } from './CoachStatus';
import { DiffView } from './DiffView';
import { FloatingAnalyzeButton } from './FloatingAnalyzeButton';
import { ImpactView } from './ImpactView';
import { ROBIN_AVATAR_URL } from './PanelHome';
import { RefineBar } from './RefineBar';
import { ScoreGauge } from './ScoreGauge';
import { SessionReviewPanel } from './SessionReviewPanel';

const sectionCss = css`
  padding: 16px;
  border-bottom: 1px solid var(--c--contextuals--border--surface--primary);
`;

const chipCss = (isSelected: boolean) => css`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 34px;
  padding: 4px 8px;
  border-radius: 8px;
  text-align: center;
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

const prefersReducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

/** `isActive` is false while the panel is hidden: live mode then pauses. */
export const CoachPanel = ({ isActive = true }: { isActive?: boolean }) => {
  const { t, i18n } = useTranslation();
  const { showToast } = useToast();
  const offerPrompt = useOfferPrompt();
  const reward = useReward();
  const askRobin = useAskRobin();
  const openLesson = usePromptToolkitStore((state) => state.openLesson);
  const setSlidePosition = useLearnProgressStore(
    (state) => state.setSlidePosition,
  );
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

  const [axes, setAxes] = useState<ImprovementAxis[]>([]);
  const [improvement, setImprovement] = useState<
    (PromptImprovement & { original: string }) | null
  >(null);
  const [showDiff, setShowDiff] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const improveControllerRef = useRef<AbortController | null>(null);
  const improvementRef = useRef<HTMLDivElement | null>(null);

  // Record the grade when the analysed prompt is sent (the input empties).
  const recordInHistory = useCoachHistoryStore((state) => state.record);
  const lastEntry = useCoachHistoryStore((state) => state.entries[0]);
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
    setAxes([]);
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

  const competencyLabels: Record<Competency, string> = {
    task: t('Task'),
    context: t('Context'),
    format: t('Format'),
    audience: t('Audience'),
    constraints: t('Constraints'),
    verification: t('Verification'),
  };
  const axisLabels: Record<ImprovementAxis, string> = {
    precision: t('More precise'),
    context: t('Add context'),
    format: t('Specify the format'),
    audience: t('Target the audience'),
    concision: t('More concise'),
  };
  const sensitiveLabels: Record<SensitiveKind, string> = {
    email: t('an email address'),
    phone: t('a phone number'),
    nir: t('a social security number'),
    iban: t('an IBAN'),
    card: t('a card number'),
  };

  // Adjusts the suggested version; the diff still compares to the original.
  const runRefinement = async (request: string) => {
    if (!improvement) {
      return;
    }
    improveControllerRef.current?.abort();
    const controller = new AbortController();
    improveControllerRef.current = controller;
    setIsImproving(true);
    try {
      const refined = await refinePrompt(
        improvement.improvedPrompt,
        request,
        language,
        controller.signal,
      );
      setImprovement({ ...refined, original: improvement.original });
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
          axes,
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
  // The weakest competency, and the lesson that teaches it.
  const course = useMemo(
    () => getCourseContent(i18n.language),
    [i18n.language],
  );
  const weakest = result
    ? COMPETENCIES.reduce<Competency | null>((lowest, key) => {
        const value = result.competencies[key];
        return value < LESSON_HINT_THRESHOLD &&
          (lowest === null || value < result.competencies[lowest])
          ? key
          : lowest;
      }, null)
    : null;
  const weakestLesson = (() => {
    if (!weakest) {
      return null;
    }
    const target = LESSON_FOR_COMPETENCY[weakest];
    const index = course.lessons.findIndex((l) => l.id === target.lessonId);
    return index < 0
      ? null
      : {
          lesson: course.lessons[index],
          number: index + 1,
          slide: target.slide,
        };
  })();
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

      {!result && chatInput.trim() === '' && (
        <Box
          role="status"
          $direction="row"
          $align="center"
          $gap="8px"
          $css={css`
            margin: 16px 16px 0;
            padding: 10px 12px;
            border-radius: 8px;
            background: var(--c--contextuals--background--surface--secondary);
          `}
        >
          <Icon iconName="edit" $size="18px" $variation="secondary" />
          <Text $size="sm" $variation="secondary">
            {t(
              'Write your prompt in the message field, then click the round button to analyse it.',
            )}
          </Text>
        </Box>
      )}

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
              {lastEntry && result.score > lastEntry.score && (
                <Text
                  $size="xs"
                  $weight="600"
                  $color="var(--c--contextuals--content--semantic--success--primary)"
                >
                  {t('+{{points}} points since your last prompt, well done!', {
                    points: result.score - lastEntry.score,
                  })}
                </Text>
              )}
              {analysis.isStale &&
                analysis.status !== 'loading' &&
                chatInput.trim() !== '' && (
                  <Text $size="xs" $variation="secondary">
                    {t('Your prompt has changed since this analysis.')}
                  </Text>
                )}
            </Box>
          </Box>

          <Box $css={sectionCss}>
            <Box
              as="ul"
              $css={css`
                display: grid;
                grid-template-columns: repeat(2, minmax(0, 1fr));
                gap: 12px 16px;
                margin: 0;
                padding: 0;
                list-style: none;
              `}
            >
              {COMPETENCIES.map((key) => {
                const value = result.competencies[key];
                return (
                  <Box as="li" key={key} $gap="4px">
                    <Box $direction="row" $justify="space-between">
                      <Text $size="sm">{competencyLabels[key]}</Text>
                      <Text
                        $size="sm"
                        $variation="secondary"
                        $css="font-variant-numeric: tabular-nums;"
                      >
                        {value}
                      </Text>
                    </Box>
                    <Box
                      role="meter"
                      aria-label={competencyLabels[key]}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={value}
                      $css={css`
                        height: 4px;
                        border-radius: 2px;
                        background: var(
                          --c--contextuals--border--surface--primary
                        );
                        overflow: hidden;
                        & > span {
                          display: block;
                          height: 100%;
                          width: ${value}%;
                          background: ${levelColor(value)};
                          transition: width 0.6s ease;
                        }
                      `}
                    >
                      <span />
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>

          {weakest && weakestLesson && (
            <Box
              as="button"
              type="button"
              onClick={() => {
                setSlidePosition(weakestLesson.lesson.id, weakestLesson.slide);
                openLesson(weakestLesson.lesson.id);
              }}
              $direction="row"
              $align="center"
              $gap="10px"
              $css={css`
                margin: 0 16px 16px;
                padding: 10px 12px;
                border-radius: 10px;
                cursor: pointer;
                font: inherit;
                color: inherit;
                text-align: left;
                border: 1px solid
                  var(--c--contextuals--border--semantic--info--secondary);
                background: var(
                  --c--contextuals--background--semantic--info--tertiary
                );
                &:focus-visible {
                  outline: 2px solid
                    var(--c--contextuals--border--semantic--brand--primary);
                  outline-offset: 2px;
                }
              `}
            >
              <Icon iconName="school" $size="22px" $theme="info" />
              <Box $gap="2px" $css="flex: 1; min-width: 0;">
                <Text $size="sm" $weight="700">
                  {t('To make progress in {{competency}}', {
                    competency: competencyLabels[weakest].toLowerCase(),
                  })}
                </Text>
                <Text $size="xs" $variation="secondary">
                  {t('Lesson {{number}}: {{title}} — a 2-minute read', {
                    number: weakestLesson.number,
                    title: weakestLesson.lesson.title,
                  })}
                </Text>
              </Box>
              <Icon
                iconName="chevron_right"
                $size="20px"
                $variation="secondary"
              />
            </Box>
          )}

          {(result.suggestions.length > 0 || result.strengths.length > 0) && (
            <Box $gap="12px" $css={sectionCss}>
              {result.strengths.length > 0 && (
                <Box $gap="8px">
                  <Text as="h3" $size="sm" $weight="700" $margin="0">
                    {t('What works')}
                  </Text>
                  <Box as="ul" $gap="8px" $css="margin: 0; padding: 0;">
                    {result.strengths.map((strength) => (
                      <Box
                        as="li"
                        key={strength}
                        $direction="row"
                        $gap="8px"
                        $css="list-style: none;"
                      >
                        <Icon
                          iconName="check"
                          $size="16px"
                          $theme="success"
                          $css="margin-top: 2px;"
                        />
                        <Text $size="sm">{strength}</Text>
                      </Box>
                    ))}
                  </Box>
                </Box>
              )}
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

          <Box
            $direction="row"
            $justify="flex-end"
            $css={css`
              padding: 8px 16px;
              border-bottom: 1px solid
                var(--c--contextuals--border--surface--primary);
            `}
          >
            <CoachFeedback target="analysis" score={result.score} />
          </Box>

          <Box $gap="12px" $css={sectionCss}>
            <Box $gap="2px">
              <Text as="h3" $size="sm" $weight="700" $margin="0">
                {t('Improve with the coach')}
              </Text>
              <Text $size="xs" $variation="secondary">
                {t('Optional: pick what matters most to you.')}
              </Text>
            </Box>
            <Box
              role="group"
              aria-label={t('Improvement focus')}
              $css={css`
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(132px, 1fr));
                gap: 8px;
              `}
            >
              {IMPROVEMENT_AXES.map((axis) => {
                const isSelected = axes.includes(axis);
                return (
                  <Box
                    key={axis}
                    as="button"
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() =>
                      setAxes((previous) =>
                        isSelected
                          ? previous.filter((item) => item !== axis)
                          : [...previous, axis],
                      )
                    }
                    $direction="row"
                    $css={chipCss(isSelected)}
                  >
                    {isSelected && (
                      <Icon iconName="check" $size="16px" $withThemeInherited />
                    )}
                    {axisLabels[axis]}
                  </Box>
                );
              })}
            </Box>
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
              {axes.length
                ? t('Rewrite on these points')
                : t('Suggest a better version')}
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
                </Box>
                <RefineBar
                  onRefine={(request) => void runRefinement(request)}
                  isRefining={isImproving}
                />
                <ImpactView
                  original={improvement.original}
                  improved={improvement.improvedPrompt}
                />
                <CoachFeedback target="improvement" score={result.score} />
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
          secondary={
            <Button
              size="small"
              color="neutral"
              variant="secondary"
              onClick={askRobin.ask}
              icon={
                <img
                  src={ROBIN_AVATAR_URL}
                  alt=""
                  width={20}
                  height={20}
                  style={{ borderRadius: '50%' }}
                />
              }
            >
              {t('Improve with Robin')}
            </Button>
          }
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
