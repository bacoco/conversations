import { Button } from '@gouvfr-lasuite/cunningham-react';
import { ReactNode, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { Competency, PromptAnalysis, analyzePrompt } from '../coach/coachApi';
import { languageName } from '../coach/language';
import { levelColor, wordLevel } from '../coach/levels';
import { CoachStatus } from '../components/CoachStatus';
import { DetailPage } from '../components/DetailPage';
import { ImpactView } from '../components/ImpactView';
import { NESTOR_CHALLENGES_URL } from '../components/PanelHome';
import { PanelTextArea } from '../components/PanelTextArea';
import { useReward } from '../rewards/useReward';

import { CHALLENGE_PASS_GRADE, Challenge } from './challenges';
import { useLearnProgressStore } from './useLearnProgressStore';

const boxCss = css`
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid var(--c--contextuals--border--surface--primary);
  background: var(--c--contextuals--background--surface--secondary);
`;

/**
 * One challenge: fix the weak request, the coach grades the fix. Inside a
 * step (`inStep`) it is the "practise" time, and leads to the step's end.
 */
export const ChallengeView = ({
  challenge,
  onBack,
  inStep,
  allowHints = true,
}: {
  challenge: Challenge;
  onBack: () => void;
  inStep?: { doneLabel: string; onDone: (passed: boolean) => void };
  /** False to do it again without help. */
  allowHints?: boolean;
}) => {
  const { t, i18n } = useTranslation();
  const reward = useReward();
  const completeChallenge = useLearnProgressStore(
    (state) => state.completeChallenge,
  );
  const [draft, setDraft] = useState(challenge.badPrompt);
  const [analysis, setAnalysis] = useState<PromptAnalysis | null>(null);
  const [gradedText, setGradedText] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [showHints, setShowHints] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);

  const competencyLabels: Record<Competency, string> = {
    task: t('Task'),
    context: t('Context'),
    sources: t('Sources'),
    examples: t('Examples'),
    format: t('Format'),
    audience: t('Audience'),
    constraints: t('Constraints'),
    verification: t('Verification'),
  };

  const passed =
    analysis !== null &&
    challenge.targets.every(
      (target) => analysis.competencies[target] >= CHALLENGE_PASS_GRADE,
    );

  const evaluate = async () => {
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;
    setStatus('loading');
    try {
      const result = await analyzePrompt(
        draft.trim(),
        languageName(i18n.language),
        controller.signal,
      );
      setAnalysis(result);
      setGradedText(draft.trim());
      setStatus('idle');
      const isPassed = challenge.targets.every(
        (target) => result.competencies[target] >= CHALLENGE_PASS_GRADE,
      );
      const isNew = !useLearnProgressStore
        .getState()
        .completedChallenges.includes(challenge.id);
      if (isPassed && isNew) {
        completeChallenge(challenge.id);
        reward('challenge');
      }
    } catch {
      if (!controller.signal.aborted) {
        setStatus('error');
      }
    }
  };

  const loading = (
    <CoachStatus
      isLoading={status === 'loading'}
      loadingLabel={t('The coach is grading your fix…')}
    />
  );
  const page = (children: ReactNode) =>
    inStep ? (
      <Box $gap="16px">
        {loading}
        <Box $direction="row" $align="center" $gap="12px">
          <img
            src={NESTOR_CHALLENGES_URL}
            alt=""
            width={56}
            height={56}
            style={{ flex: 'none', borderRadius: '50%', background: '#f7f8fd' }}
          />
          <Box $gap="2px">
            <Text as="h3" $size="md" $weight="700" $margin="0">
              {t('Your turn: fix this request')}
            </Text>
            <Text $size="sm" $variation="secondary">
              {t('The coach reads your version and tells you if it holds.')}
            </Text>
          </Box>
        </Box>
        {children}
      </Box>
    ) : (
      <DetailPage
        onBack={onBack}
        backLabel={t('Back to the course')}
        eyebrow={t('Challenge · level {{level}}', { level: challenge.level })}
        title={challenge.title}
        image={NESTOR_CHALLENGES_URL}
        status={loading}
      >
        {children}
      </DetailPage>
    );

  return page(
    <>
      <Box $gap="6px" $css={boxCss}>
        <Text $size="xs" $weight="700">
          {t('The prompt to fix')}
        </Text>
        <Text $css="font-style: italic; line-height: 1.5;">
          « {challenge.badPrompt} »
        </Text>
        <Text $size="xs" $variation="secondary">
          {challenge.problem}
        </Text>
      </Box>

      <Box $gap="6px">
        <Text $size="sm" $weight="700">
          {t('Your version')}
        </Text>
        <PanelTextArea
          label={t('Your version')}
          value={draft}
          onChange={setDraft}
          minRows={6}
        />
        <Box $direction="row" $justify="space-between" $align="center">
          {allowHints ? (
            <Button
              size="small"
              color="neutral"
              variant="tertiary"
              aria-expanded={showHints}
              onClick={() => setShowHints((value) => !value)}
              icon={<Icon iconName="lightbulb" $size="16px" />}
            >
              {showHints ? t('Hide the hints') : t('Need a hint?')}
            </Button>
          ) : (
            <span />
          )}
          <Button
            size="small"
            disabled={status === 'loading' || !draft.trim()}
            onClick={() => void evaluate()}
            icon={<Icon iconName="grading" $size="16px" />}
          >
            {t('Have it graded')}
          </Button>
        </Box>
        {allowHints && showHints && (
          <Box as="ul" $gap="4px" $css="margin: 0; padding-left: 18px;">
            {challenge.hints.map((hint) => (
              <Text as="li" key={hint} $size="sm" $css="display: list-item;">
                {hint}
              </Text>
            ))}
          </Box>
        )}
      </Box>

      {status === 'error' && (
        <Text $size="sm" role="alert">
          {t('The coach could not grade your fix. Please retry.')}
        </Text>
      )}

      {analysis && (
        <Box
          role="status"
          $gap="10px"
          $css={css`
            padding: 14px;
            border-radius: 12px;
            background: var(
              --c--contextuals--background--semantic--${
                  passed ? 'success' : 'brand'
                }--tertiary
            );
          `}
        >
          <Box $direction="row" $align="center" $gap="8px">
            <Icon
              iconName={passed ? 'emoji_events' : 'trending_up'}
              $size="24px"
              $theme={passed ? 'success' : 'brand'}
            />
            <Text $weight="700">
              {passed
                ? t('Challenge succeeded, well done!')
                : t('Almost there: strengthen the points below.')}
            </Text>
          </Box>
          <Box
            as="ul"
            $gap="6px"
            $css="margin: 0; padding: 0; list-style: none;"
          >
            {challenge.targets.map((target) => {
              const value = analysis.competencies[target];
              const isOk = value >= CHALLENGE_PASS_GRADE;
              return (
                <Box
                  as="li"
                  key={target}
                  $direction="row"
                  $align="center"
                  $gap="8px"
                >
                  <Icon
                    iconName={isOk ? 'check_circle' : 'radio_button_unchecked'}
                    $size="18px"
                    $theme={isOk ? 'success' : 'neutral'}
                  />
                  <Text $size="sm" $css="flex: 1;">
                    {competencyLabels[target]}
                  </Text>
                  <Text
                    $size="sm"
                    $weight="700"
                    $css={`color: ${levelColor(value)};`}
                  >
                    {wordLevel(value, t)}
                  </Text>
                </Box>
              );
            })}
          </Box>
          {analysis.suggestions[0] && !passed && (
            <Text $size="sm">{analysis.suggestions[0]}</Text>
          )}
        </Box>
      )}

      {/* Before / after: the real answers to both prompts, side by side. */}
      {analysis && (
        <ImpactView
          original={challenge.badPrompt}
          improved={gradedText}
          labels={{
            button: t('See the before / after'),
            before: t('With the prompt to fix'),
            after: t('With your version'),
          }}
        />
      )}

      {inStep && (
        <Box $gap="8px">
          <Button
            fullWidth
            color={passed ? 'brand' : 'neutral'}
            variant={passed ? 'primary' : 'secondary'}
            onClick={() => inStep.onDone(passed)}
            iconPosition="right"
            icon={<Icon iconName="arrow_forward" $size="18px" />}
          >
            {passed ? inStep.doneLabel : t('Finish the step without it')}
          </Button>
        </Box>
      )}
    </>,
  );
};
