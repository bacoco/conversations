import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { useAiAvailable } from '../coach/aiAvailability';
import {
  NESTOR_ANALYSIS_URL,
  NESTOR_COURSE_URL,
} from '../components/PanelHome';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

import { ChallengeView } from './ChallengeView';
import { CardsResult, FlashcardsView } from './FlashcardsView';
import { LessonView } from './LessonView';
import { QuizResult, QuizView } from './QuizView';
import {
  Stage,
  Step,
  isStageDone,
  isStepDone,
  nextStage,
  nextStep,
} from './steps';
import { useLearnProgress } from './useLearnProgress';
import { useLearnProgressStore } from './useLearnProgressStore';

const ILLUSTRATION_BACKGROUND = '#f7f8fd';

export const useStageLabels = (): Record<Stage, string> => {
  const { t } = useTranslation();
  return {
    read: t('Read'),
    cards: t('Remember'),
    quiz: t('Check'),
    practice: t('Practise'),
  };
};

const dotCss = (state: 'done' | 'current' | 'todo') => css`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  box-sizing: border-box;
  font-size: 0.8125rem;
  font-weight: 700;
  border: 2px solid
    ${
      state === 'current'
        ? 'var(--c--contextuals--background--semantic--brand--primary)'
        : state === 'done'
          ? 'transparent'
          : 'var(--c--contextuals--border--surface--primary)'
    };
  color: ${
    state === 'current'
      ? 'var(--c--contextuals--content--semantic--brand--on-brand)'
      : state === 'done'
        ? 'var(--c--contextuals--content--semantic--success--primary)'
        : 'var(--c--contextuals--content--semantic--neutral--secondary)'
  };
  background: ${
    state === 'current'
      ? 'var(--c--contextuals--background--semantic--brand--primary)'
      : state === 'done'
        ? 'var(--c--contextuals--background--semantic--success--tertiary)'
        : 'var(--c--contextuals--background--surface--primary)'
  };
`;

const stageButtonCss = css`
  width: 100%;
  padding: 4px 0;
  border: none;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  font: inherit;
  color: inherit;
  &:hover {
    background: var(--c--contextuals--background--surface--secondary);
  }
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 1px;
  }
`;

/** Where the user is in the step: four times, the done ones ticked. */
const StageBar = ({
  step,
  current,
  onSelect,
}: {
  step: Step;
  current: Stage | 'done';
  onSelect: (stage: Stage) => void;
}) => {
  const { t } = useTranslation();
  const labels = useStageLabels();
  const progress = useLearnProgress();
  return (
    <Box
      as="ol"
      aria-label={t('Where you are in the step')}
      $css={css`
        display: grid;
        grid-template-columns: repeat(${step.stages.length}, minmax(0, 1fr));
        gap: 4px;
        margin: 0;
        padding: 0;
        list-style: none;
      `}
    >
      {step.stages.map((stage, index) => {
        const isCurrent = stage === current;
        const isDone = isStageDone(step, stage, progress);
        const state = isCurrent ? 'current' : isDone ? 'done' : 'todo';
        return (
          <li key={stage}>
            <Box
              as="button"
              type="button"
              aria-current={isCurrent ? 'step' : undefined}
              onClick={() => onSelect(stage)}
              $align="center"
              $gap="4px"
              $css={stageButtonCss}
            >
              <Box $align="center" $justify="center" $css={dotCss(state)}>
                {state === 'done' ? (
                  <Icon iconName="check" $size="16px" $withThemeInherited />
                ) : (
                  index + 1
                )}
              </Box>
              <Text
                $size="xs"
                $weight={isCurrent ? '700' : '400'}
                $theme={isCurrent ? 'brand' : undefined}
                $variation={isCurrent ? undefined : 'secondary'}
              >
                {labels[stage]}
                {isDone && !isCurrent && (
                  <span className="sr-only"> {t('done')}</span>
                )}
              </Text>
            </Box>
          </li>
        );
      })}
    </Box>
  );
};

/** A step without a challenge: practise on a real request, with the coach. */
const CoachTry = ({
  onOpenCoach,
  onFinish,
}: {
  onOpenCoach: () => void;
  onFinish: () => void;
}) => {
  const { t } = useTranslation();
  return (
    <Box $gap="16px">
      <Box $direction="row" $align="center" $gap="12px">
        <img
          src={NESTOR_ANALYSIS_URL}
          alt=""
          width={56}
          height={56}
          style={{
            flex: 'none',
            borderRadius: '50%',
            background: ILLUSTRATION_BACKGROUND,
          }}
        />
        <Text as="h3" $size="md" $weight="700" $margin="0">
          {t('Your turn, on a real request')}
        </Text>
      </Box>
      <Text>
        {t(
          'Write a request in the message field, at the bottom of the conversation, then open the coach: “Read my request” tells you what works and what is missing.',
        )}
      </Text>
      <Button
        fullWidth
        onClick={onOpenCoach}
        icon={<Icon iconName="touch_app" $size="18px" />}
      >
        {t('Open the coach')}
      </Button>
      <Button fullWidth color="neutral" variant="secondary" onClick={onFinish}>
        {t('Finish the step')}
      </Button>
    </Box>
  );
};

type PracticeResult = 'passed' | 'coach' | 'skipped';

const okDotCss = (isDone: boolean) => css`
  flex: none;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  color: ${
    isDone
      ? 'var(--c--contextuals--content--semantic--success--primary)'
      : 'var(--c--contextuals--content--semantic--neutral--secondary)'
  };
  background: ${
    isDone
      ? 'var(--c--contextuals--background--semantic--success--tertiary)'
      : 'var(--c--contextuals--background--surface--secondary)'
  };
`;

/** The end of a step: what was done, one thing to remember, what next. */
const StepDone = ({
  step,
  steps,
  cards,
  quiz,
  practice,
  onOpenStep,
  onFullQuiz,
  onBack,
}: {
  step: Step;
  steps: Step[];
  cards?: CardsResult;
  quiz?: QuizResult;
  practice?: PracticeResult;
  onOpenStep: (lessonId: string) => void;
  onFullQuiz: () => void;
  onBack: () => void;
}) => {
  const { t } = useTranslation();
  const progress = useLearnProgress();
  const isAiAvailable = useAiAvailable();
  const startCoach = usePromptToolkitStore((state) => state.startCoach);
  const id = step.lesson.id;
  const next = nextStep(steps, progress);
  const best = progress.bestQuizScores[id];
  const quizResult =
    quiz ??
    (best !== undefined
      ? {
          right: Math.round((best / 100) * step.quiz.length),
          total: step.quiz.length,
        }
      : undefined);
  const takeaway = [...step.lesson.slides]
    .reverse()
    .find((slide) => slide.keyTakeaway)?.keyTakeaway;

  const lines: { stage: Stage; text: string; isDone: boolean }[] = [];
  lines.push({
    stage: 'read',
    isDone: progress.completedLessons.includes(id),
    text: progress.completedLessons.includes(id)
      ? t('{{count}} screens read', { count: step.lesson.slides.length })
      : t('Reading passed'),
  });
  const allCardsKnown = step.cards.every((card) =>
    progress.knownCards.includes(card.id),
  );
  if (step.stages.includes('cards')) {
    lines.push({
      stage: 'cards',
      isDone: Boolean(cards) || allCardsKnown,
      text: cards
        ? [
            t('{{known}} cards known out of {{total}}', {
              known: cards.known,
              total: step.cards.length,
            }),
            cards.toReview
              ? t('{{count}} to review later', { count: cards.toReview })
              : '',
          ]
            .filter(Boolean)
            .join(' · ')
        : allCardsKnown
          ? t('{{known}} cards known out of {{total}}', {
              known: step.cards.length,
              total: step.cards.length,
            })
          : t('Cards passed'),
    });
  }
  if (step.stages.includes('quiz')) {
    lines.push({
      stage: 'quiz',
      isDone: Boolean(quizResult),
      text: quizResult
        ? t('{{right}} right answers out of {{total}}', {
            right: quizResult.right,
            total: quizResult.total,
          })
        : t('Questions passed'),
    });
  }
  if (step.stages.includes('practice')) {
    const isSucceeded =
      practice === 'passed' ||
      (step.challenge !== undefined &&
        progress.completedChallenges.includes(step.challenge.id));
    const isTried =
      practice === 'coach' ||
      (!step.challenge &&
        practice === undefined &&
        isStageDone(step, 'practice', progress));
    lines.push({
      stage: 'practice',
      isDone: isSucceeded || isTried,
      text: isSucceeded
        ? t('Exercise succeeded')
        : isTried
          ? t('Tried with the coach')
          : t('Exercise passed'),
    });
  }

  return (
    <Box $gap="18px">
      <Box $align="center" $gap="8px" $css="text-align: center;">
        <img
          src={NESTOR_COURSE_URL}
          alt=""
          width={140}
          height={140}
          style={{ borderRadius: '50%', background: ILLUSTRATION_BACKGROUND }}
        />
        <Text as="h2" $size="h4" $weight="800" $margin="0">
          {t('Step {{number}} completed', { number: step.number })}
        </Text>
        <Text $variation="secondary">{step.lesson.title}</Text>
      </Box>

      <Box
        as="ul"
        $css={css`
          margin: 0;
          padding: 4px 14px;
          list-style: none;
          border-radius: 14px;
          border: 1px solid var(--c--contextuals--border--surface--primary);
        `}
      >
        {lines.map((line, index) => (
          <Box
            as="li"
            key={line.stage}
            $direction="row"
            $align="center"
            $gap="10px"
            $css={css`
              padding: 10px 0;
              border-bottom: ${
                index === lines.length - 1
                  ? 'none'
                  : '1px solid var(--c--contextuals--border--surface--primary)'
              };
            `}
          >
            <Box $align="center" $justify="center" $css={okDotCss(line.isDone)}>
              <Icon
                iconName={line.isDone ? 'check' : 'remove'}
                $size="14px"
                $withThemeInherited
              />
            </Box>
            <Text $size="sm">{line.text}</Text>
          </Box>
        ))}
      </Box>

      {takeaway && (
        <Box
          $direction="row"
          $gap="10px"
          $css={css`
            padding: 12px 14px;
            border-radius: 12px;
            background: var(
              --c--contextuals--background--semantic--brand--tertiary
            );
          `}
        >
          <Icon iconName="lightbulb" $size="20px" $theme="brand" />
          <Box $gap="2px">
            <Text $size="sm" $weight="700">
              {t('To remember')}
            </Text>
            <Text $size="sm">{takeaway}</Text>
          </Box>
        </Box>
      )}

      {next ? (
        <Button
          fullWidth
          onClick={() => onOpenStep(next.lesson.id)}
          iconPosition="right"
          icon={<Icon iconName="arrow_forward" $size="18px" />}
        >
          {t('Next step: {{number}} · {{title}}', {
            number: next.number,
            title: next.lesson.title,
          })}
        </Button>
      ) : (
        <Box $gap="8px">
          <Text $weight="700" $textAlign="center">
            {t('Path completed, congratulations!')}
          </Text>
          <Button fullWidth onClick={onFullQuiz}>
            {t('Take the full quiz')}
          </Button>
        </Box>
      )}
      {isAiAvailable && (
        <Button
          fullWidth
          color="neutral"
          variant="secondary"
          onClick={startCoach}
          icon={<Icon iconName="send" $size="18px" />}
        >
          {t('Try it on my next request')}
        </Button>
      )}
      <Button size="small" color="neutral" variant="tertiary" onClick={onBack}>
        {t('Back to the course')}
      </Button>
    </Box>
  );
};

/**
 * One step of the path, done in its times in order: read, remember, check,
 * practise. Each time leads to the next; any can be reached from the bar.
 */
export const StepView = ({
  step,
  steps,
  onBack,
  onOpenStep,
  onFullQuiz,
}: {
  step: Step;
  steps: Step[];
  onBack: () => void;
  onOpenStep: (lessonId: string) => void;
  onFullQuiz: () => void;
}) => {
  const { t } = useTranslation();
  const labels = useStageLabels();
  const markStage = useLearnProgressStore((state) => state.markStage);
  const setCurrentStep = useLearnProgressStore((state) => state.setCurrentStep);
  const startCoach = usePromptToolkitStore((state) => state.startCoach);
  const id = step.lesson.id;
  const [stage, setStage] = useState<Stage | 'done'>(() => {
    const progress = useLearnProgressStore.getState();
    return nextStage(step, progress) ?? step.stages[0];
  });
  const [cards, setCards] = useState<CardsResult>();
  const [quiz, setQuiz] = useState<QuizResult>();
  const [practice, setPractice] = useState<PracticeResult>();
  const topRef = useRef<HTMLDivElement | null>(null);

  // This is the step being done, to resume it from the path.
  useEffect(() => {
    setCurrentStep(id);
  }, [id, setCurrentStep]);

  // Each time of the step starts at the top.
  useEffect(() => {
    topRef.current?.scrollIntoView?.({ block: 'start' });
  }, [stage]);

  const after = (current: Stage) => {
    const position = step.stages.indexOf(current);
    return step.stages[position + 1] ?? null;
  };
  const continueLabel = (current: Stage) => {
    const next = after(current);
    return next
      ? t('Continue: {{stage}}', { stage: labels[next].toLocaleLowerCase() })
      : t('Finish the step');
  };
  const finish = (current: Stage) => {
    markStage(id, current);
    const next = after(current);
    if (next) {
      setStage(next);
      return;
    }
    setStage('done');
    if (isStepDone(step, useLearnProgressStore.getState())) {
      setCurrentStep(null);
    }
  };
  // Passing a time on purpose: only towards a time that follows.
  const following = stage === 'done' ? null : after(stage);

  return (
    <Box
      ref={topRef}
      $gap="16px"
      $css="padding: 12px 16px 96px; scroll-margin-top: 0;"
    >
      <Box $direction="row">
        <Button
          size="small"
          color="neutral"
          variant="tertiary"
          onClick={onBack}
          icon={<Icon iconName="arrow_back" $size="18px" />}
        >
          {t('Back to the course')}
        </Button>
      </Box>
      <Text as="h2" $size="lg" $weight="800" $margin="0">
        {t('Step {{number}} · {{title}}', {
          number: step.number,
          title: step.lesson.title,
        })}
      </Text>
      {stage !== 'done' && (
        <StageBar step={step} current={stage} onSelect={setStage} />
      )}

      {stage === 'read' && (
        <LessonView
          lesson={step.lesson}
          doneLabel={continueLabel('read')}
          onDone={() => finish('read')}
        />
      )}
      {stage === 'cards' && (
        <FlashcardsView
          cards={step.cards}
          onDone={(result) => {
            setCards(result);
            finish('cards');
          }}
        />
      )}
      {stage === 'quiz' && (
        <QuizView
          key={id}
          title={step.lesson.title}
          scope={id}
          questions={step.quiz}
          onBack={onBack}
          inStep={{
            doneLabel: continueLabel('quiz'),
            onDone: (result) => {
              setQuiz(result);
              finish('quiz');
            },
          }}
        />
      )}
      {stage === 'practice' && step.challenge && (
        <ChallengeView
          key={step.challenge.id}
          challenge={step.challenge}
          onBack={onBack}
          inStep={{
            doneLabel: t('Finish the step'),
            onDone: (passed) => {
              setPractice(passed ? 'passed' : 'skipped');
              finish('practice');
            },
          }}
        />
      )}
      {stage === 'practice' && !step.challenge && (
        <CoachTry
          onOpenCoach={() => {
            setPractice('coach');
            finish('practice');
            startCoach();
          }}
          onFinish={() => {
            setPractice('skipped');
            finish('practice');
          }}
        />
      )}
      {following && stage !== 'done' && (
        <Button
          size="small"
          color="neutral"
          variant="tertiary"
          onClick={() => finish(stage)}
        >
          {t('I already know: go to {{stage}}', {
            stage: labels[following].toLocaleLowerCase(),
          })}
        </Button>
      )}

      {stage === 'done' && (
        <StepDone
          step={step}
          steps={steps}
          cards={cards}
          quiz={quiz}
          practice={practice}
          onOpenStep={onOpenStep}
          onFullQuiz={onFullQuiz}
          onBack={onBack}
        />
      )}
    </Box>
  );
};
