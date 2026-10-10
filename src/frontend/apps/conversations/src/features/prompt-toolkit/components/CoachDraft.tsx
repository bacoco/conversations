import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text, useToast } from '@/components';
import { useResponsiveStore } from '@/stores';

import type { Competency, PromptAnalysis } from '../coach/coachApi';
import { SensitiveKind, detectSensitiveData } from '../coach/sensitiveData';
import { usePromptAnalysis } from '../coach/usePromptAnalysis';
import { GuidedThread, NestorBubble } from '../fill/GuidedThread';
import { useGuidedFill } from '../fill/useGuidedFill';
import { LESSON_FOR_COMPETENCY } from '../learn/lessonForCompetency';
import { useReward } from '../rewards/useReward';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

import { CoachMore } from './CoachMore';
import {
  CoachLink,
  Disclosure,
  FinalRequest,
  RetainTip,
  WorksBox,
} from './CoachParts';
import { CoachStatus } from './CoachStatus';
import { FloatingAnalyzeButton } from './FloatingAnalyzeButton';
import { LivePillars } from './LivePillars';
import { PracticeCheck } from './PracticeCheck';

/** Above this level, the request can go as it is: no questions by default. */
const CLEAR_ENOUGH_SCORE = 80;

/**
 * Sends what is in the message field, exactly as the composer's own button
 * does (attachments included). False when there is no composer.
 */
const submitComposer = () => {
  const textarea = document.querySelector<HTMLTextAreaElement>(
    'textarea[name="inputchat-textarea"]',
  );
  if (!textarea?.form) {
    return false;
  }
  textarea.form.requestSubmit();
  return true;
};

/** One habit per rule, for the rule this request needed most. */
const useTipFor = (result: PromptAnalysis | null) => {
  const { t } = useTranslation();
  return useMemo(() => {
    if (!result) {
      return null;
    }
    const tips: Partial<Record<Competency, string>> = {
      task: t('Say exactly what you expect: write, summarise, list…'),
      context: t(
        'Give the situation and the purpose: the Assistant cannot guess them.',
      ),
      audience: t('Say who it is for: the tone and the level change with it.'),
      format: t('Say the expected form: length, list, table, tone.'),
      sources: t('Give the text or document to rely on.'),
      constraints: t('Say what to avoid, and what must not be made up.'),
    };
    const [weakest] = (Object.keys(tips) as Competency[])
      .map((key) => ({ key, score: result.competencies[key] }))
      .sort((a, b) => a.score - b.score);
    return weakest && weakest.score < 60
      ? {
          key: `rule-${weakest.key}`,
          text: tips[weakest.key] ?? '',
          lesson: LESSON_FOR_COMPETENCY[weakest.key],
        }
      : null;
  }, [result, t]);
};

const SensitiveWarning = ({ text }: { text: string }) => {
  const { t } = useTranslation();
  const sensitive = useMemo(() => detectSensitiveData(text), [text]);
  if (sensitive.length === 0) {
    return null;
  }
  const labels: Record<SensitiveKind, string> = {
    email: t('an email address'),
    phone: t('a phone number'),
    nir: t('a social security number'),
    iban: t('an IBAN'),
    card: t('a card number'),
  };
  return (
    <Box
      role="alert"
      $direction="row"
      $gap="8px"
      $css={css`
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
          { items: sensitive.map((kind) => labels[kind]).join(', ') },
        )}
      </Text>
    </Box>
  );
};

/**
 * The coach while a request is in the message field: nothing happens until
 * "Read my request"; then what works, Nestor's questions on what is missing,
 * and the completed request. Sending it as it is stays possible all along.
 */
export const CoachDraft = ({
  draft,
  analysis,
  language,
  isActive,
  isBeginner,
  isPlaced,
  onPlace,
}: {
  draft: string;
  analysis: ReturnType<typeof usePromptAnalysis>;
  language: string;
  /** False while the panel is hidden: nothing runs on typing then. */
  isActive: boolean;
  isBeginner: boolean;
  /** The message field holds what the coach just put there. */
  isPlaced: boolean;
  onPlace: (text: string) => void;
}) => {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const { isDesktop } = useResponsiveStore();
  const closePanel = usePromptToolkitStore((state) => state.close);
  const reward = useReward();
  /** The text Nestor read; null until "Read my request". */
  const [readText, setReadText] = useState<string | null>(null);
  const [wantsQuestions, setWantsQuestions] = useState(false);
  const fill = useGuidedFill({
    template: readText ?? '',
    language,
    mode: 'draft',
    enabled: readText !== null,
  });
  const result = readText !== null ? analysis.analysis : null;
  const tip = useTipFor(result);

  // What the coach put in the message field starts a new reading.
  useEffect(() => {
    if (isPlaced) {
      setReadText(null);
      setWantsQuestions(false);
    }
  }, [isPlaced]);

  const read = () => {
    analysis.analyzeNow();
    setReadText(draft);
    setWantsQuestions(false);
  };

  const place = (text: string) => {
    reward('fill');
    onPlace(text);
  };

  const sendAsIs = () => {
    if (!submitComposer()) {
      showToast('error', t('Open a conversation to use this prompt.'));
      return;
    }
    // On a phone the panel covers the chat: show the answer coming.
    if (!isDesktop) {
      closePanel();
    }
  };

  const isClearEnough =
    result !== null && result.score >= CLEAR_ENOUGH_SCORE && !analysis.isStale;
  const showQuestions = !isClearEnough || wantsQuestions || fill.final !== null;
  const isReading =
    analysis.status === 'loading' ||
    (fill.status === 'loading' && fill.exchanges.length === 0);
  const sendAsIsLink = (
    <CoachLink icon="send" onClick={sendAsIs}>
      {t('Send it as is')}
    </CoachLink>
  );

  return (
    <Box $direction="column" $css="flex: 1 0 auto;">
      <CoachStatus
        isLoading={isReading || fill.status === 'loading' || fill.isAdjusting}
        loadingLabel={
          fill.isAdjusting
            ? t('Nestor is changing the prompt…')
            : isReading
              ? t('Nestor is reading your request…')
              : t('Nestor is preparing the next step…')
        }
      />
      <Box $gap="14px" $padding={{ all: 'base' }}>
        <SensitiveWarning text={draft} />

        {isPlaced && (
          <Box $gap="12px">
            <NestorBubble>
              {t(
                'It is in the message field: read it again, then send it when you are ready.',
              )}
            </NestorBubble>
            <Box $direction="row" $css="padding-left: 36px;">
              {sendAsIsLink}
            </Box>
          </Box>
        )}

        {!isPlaced && readText === null && (
          <Box $align="center" $gap="8px" $css="padding: 16px 8px 4px;">
            {isActive && !isBeginner && (
              <Box $css="align-self: stretch; margin-bottom: 12px;">
                <LivePillars text={draft} />
              </Box>
            )}
            <Icon iconName="grading" $size="40px" $theme="brand" />
            <Text $textAlign="center" $weight="700">
              {t('Your request is ready to be read')}
            </Text>
            <Text $textAlign="center" $size="sm" $variation="secondary">
              {t(
                'Click “Read my request”, at the bottom: I tell you what works and what is missing. Nothing is sent.',
              )}
            </Text>
          </Box>
        )}

        {!isPlaced && readText !== null && (
          <>
            {analysis.isStale && analysis.status !== 'loading' && (
              <Text $size="xs" $variation="secondary">
                {t('Your request has changed since I read it.')}
              </Text>
            )}
            {analysis.status === 'error' && !result && (
              <Box role="alert" $gap="8px" $align="flex-start">
                <Text $size="sm">
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
                $gap="12px"
                aria-busy={analysis.status === 'loading'}
                $css={css`
                  transition: opacity 0.2s ease;
                  opacity: ${analysis.isStale ? 0.6 : 1};
                `}
              >
                <WorksBox items={result.strengths} />
                {result.verdict && (
                  <NestorBubble>{result.verdict}</NestorBubble>
                )}
                <PracticeCheck result={result} />
              </Box>
            )}

            {showQuestions ? (
              <>
                <GuidedThread fill={fill} extraAction={sendAsIsLink} />
                <FinalRequest
                  fill={fill}
                  original={readText}
                  onPlace={place}
                  saveTitle={t('Your request')}
                />
                {fill.final && tip && (
                  <RetainTip tipKey={tip.key} lesson={tip.lesson}>
                    {tip.text}
                  </RetainTip>
                )}
              </>
            ) : (
              <Box
                $direction="row"
                $gap="8px"
                $css="flex-wrap: wrap; padding-left: 36px;"
              >
                <Button
                  size="small"
                  onClick={sendAsIs}
                  icon={<Icon iconName="send" $size="16px" />}
                >
                  {t('Send it as is')}
                </Button>
                <Button
                  size="small"
                  color="neutral"
                  variant="secondary"
                  onClick={() => setWantsQuestions(true)}
                  icon={<Icon iconName="edit_note" $size="16px" />}
                >
                  {t('Strengthen it anyway')}
                </Button>
              </Box>
            )}
          </>
        )}

        <Disclosure label={t('More details')} icon="tune">
          <CoachMore
            prompt={readText ?? draft}
            result={result}
            language={language}
            isBeginner={isBeginner}
            onPlace={onPlace}
          />
        </Disclosure>
      </Box>

      {isActive && (
        <FloatingAnalyzeButton
          label={
            readText === null || isPlaced
              ? t('Read my request')
              : analysis.isStale || !result
                ? t('Read my request again')
                : t('Reading up to date')
          }
          onClick={read}
          isLoading={analysis.status === 'loading'}
          disabled={
            analysis.status === 'loading' ||
            (readText !== null &&
              !isPlaced &&
              result !== null &&
              !analysis.isStale)
          }
        />
      )}
    </Box>
  );
};
