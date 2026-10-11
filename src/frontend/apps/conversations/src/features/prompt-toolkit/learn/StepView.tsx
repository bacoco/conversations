import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { useAiAvailable } from '../coach/aiAvailability';
import type { Competency } from '../coach/coachApi';
import {
  NESTOR_ANALYSIS_URL,
  NESTOR_COURSE_URL,
} from '../components/PanelHome';
import { useIsSpaceShown, useRoomyPanel } from '../hooks/useRoomyPanel';
import { useCoachHistoryStore } from '../stores/useCoachHistoryStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

import { ChallengeView } from './ChallengeView';
import { CourseFrame, Direction, ScreenActions, enterCss } from './CourseFrame';
import {
  FoxSays,
  ILLUSTRATION_BACKGROUND,
  useCelebration,
  useLevelLabels,
  useSkillLabels,
  useStageLabels,
} from './CourseParts';
import { CardsResult, FlashcardsView } from './FlashcardsView';
import { LessonView } from './LessonView';
import { StepMemo } from './MemoViews';
import { QuizResult, QuizView } from './QuizView';
import {
  SHOWN_SKILLS,
  Stage,
  Step,
  computeSkillLevels,
  isStageDone,
  isStepDone,
  lessonSkills,
  nextStage,
  nextStep,
} from './steps';
import { useLearnProgress, useSkillLevels } from './useLearnProgress';
import { SkillLevel, useLearnProgressStore } from './useLearnProgressStore';

export { useStageLabels };

const dotCss = (state: 'done' | 'current' | 'todo') => css`
  width: 30px;
  height: 30px;
  border-radius: 50%;
  box-sizing: border-box;
  transition:
    background 0.25s ease,
    color 0.25s ease,
    border-color 0.25s ease;
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
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

/** Where the user is in the step: its times, the done ones ticked. */
const StageBar = ({
  step,
  stages,
  current,
  onSelect,
}: {
  step: Step;
  stages: Stage[];
  current: Stage | null;
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
        grid-template-columns: repeat(${stages.length}, minmax(0, 1fr));
        gap: 4px;
        margin: 0;
        padding: 0;
        list-style: none;
      `}
    >
      {stages.map((stage, index) => {
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
      <Text $size="sm" $variation="secondary">
        {t('The coach will tell you when it sees what this step taught.')}
      </Text>
      <ScreenActions
        start={
          <Button color="neutral" variant="secondary" onClick={onFinish}>
            {t('Finish the step')}
          </Button>
        }
      >
        <Button
          onClick={onOpenCoach}
          icon={<Icon iconName="touch_app" $size="18px" />}
        >
          {t('Open the coach')}
        </Button>
      </ScreenActions>
    </Box>
  );
};

/** The pace, asked once, at the end of a first step: never in the way. */
const GoalQuestion = () => {
  const { t } = useTranslation();
  const goalAsked = useLearnProgressStore((state) => state.goalAsked);
  const setWeeklyGoal = useLearnProgressStore((state) => state.setWeeklyGoal);
  if (goalAsked) {
    return null;
  }
  return (
    <Box
      $gap="8px"
      $align="center"
      $css={css`
        width: 100%;
        padding: 12px;
        border-radius: 12px;
        background: var(
          --c--contextuals--background--semantic--brand--tertiary
        );
      `}
    >
      <Text $size="sm" $weight="700">
        {t('At what pace would you like to learn?')}
      </Text>
      <Box
        $direction="row"
        $gap="6px"
        $justify="center"
        $css="flex-wrap: wrap;"
      >
        {[1, 2, 3].map((goal) => (
          <Button
            key={goal}
            size="small"
            color="neutral"
            variant="secondary"
            onClick={() => setWeeklyGoal(goal)}
          >
            {t('{{count}} a week', { count: goal })}
          </Button>
        ))}
      </Box>
      <Button
        size="small"
        color="neutral"
        variant="tertiary"
        onClick={() => setWeeklyGoal(null)}
      >
        {t('Later')}
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

/** The end of a step: what was done, what was learnt, what next. */
const StepDone = ({
  step,
  steps,
  cards,
  quiz,
  practice,
  levelsAtStart,
  onOpenStep,
  onFullQuiz,
  onRedo,
  onMemo,
  onTryForReal,
}: {
  step: Step;
  steps: Step[];
  cards?: CardsResult;
  quiz?: QuizResult;
  practice?: PracticeResult;
  levelsAtStart: Partial<Record<Competency, SkillLevel>>;
  onOpenStep: (lessonId: string) => void;
  onFullQuiz: () => void;
  onRedo: () => void;
  onMemo: () => void;
  onTryForReal: () => void;
}) => {
  const { t } = useTranslation();
  const progress = useLearnProgress();
  const isAiAvailable = useAiAvailable();
  const skillLabels = useSkillLabels();
  const levelLabels = useLevelLabels();
  const levels = useSkillLevels(steps);
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
  const sessions = useLearnProgressStore((state) => state.sessions.length);
  const celebration = useCelebration()(sessions);
  const takeaway = [...step.lesson.slides]
    .reverse()
    .find((slide) => slide.keyTakeaway)?.keyTakeaway;
  const risen = SHOWN_SKILLS.filter(
    (skill) => (levels[skill] ?? 0) > (levelsAtStart[skill] ?? 0),
  );

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
        {celebration && <FoxSays>{celebration}</FoxSays>}
      </Box>

      {risen.length > 0 && (
        <Box
          $gap="6px"
          $css={css`
            padding: 12px 14px;
            border-radius: 12px;
            background: var(
              --c--contextuals--background--semantic--success--tertiary
            );
          `}
        >
          <Text $size="sm" $weight="700">
            {t('You now know how to')}
          </Text>
          {risen.map((skill) => (
            <Box
              key={skill}
              $direction="row"
              $align="center"
              $gap="8px"
              $justify="space-between"
            >
              <Text $size="sm">{skillLabels[skill]}</Text>
              <Text $size="xs" $weight="700" $theme="success">
                {levelLabels[levels[skill] ?? 0]}
              </Text>
            </Box>
          ))}
        </Box>
      )}

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

      <GoalQuestion />
      {!next && (
        <Text $weight="700" $textAlign="center">
          {t('Path completed, congratulations!')}
        </Text>
      )}
      <ScreenActions
        start={
          isAiAvailable && (
            <Button
              color="neutral"
              variant="secondary"
              onClick={onTryForReal}
              icon={<Icon iconName="send" $size="18px" />}
            >
              {t('Try it on my next request')}
            </Button>
          )
        }
      >
        {next ? (
          <Button
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
          <Button onClick={onFullQuiz}>{t('Take the full quiz')}</Button>
        )}
      </ScreenActions>
      <Box
        $direction="row"
        $gap="8px"
        $justify="center"
        $css="flex-wrap: wrap;"
      >
        <Button
          size="small"
          color="neutral"
          variant="tertiary"
          onClick={onMemo}
          icon={<Icon iconName="sticky_note_2" $size="16px" />}
        >
          {t('The memo of the step')}
        </Button>
        {step.stages.includes('quiz') && (
          <Button
            size="small"
            color="neutral"
            variant="tertiary"
            onClick={onRedo}
            icon={<Icon iconName="replay" $size="16px" />}
          >
            {t('Do it again without help')}
          </Button>
        )}
      </Box>
    </Box>
  );
};

type View =
  | { name: 'stage'; stage: Stage }
  | { name: 'done' }
  | { name: 'memo'; from: View };

/**
 * One step of the path, done in its times in order: read, remember, check,
 * practise, one after the other with no stop in between; "Stop here" keeps
 * the place for later. Any time can be reached from the bar on top. "Do it
 * again without help" replays its questions and exercise, no hints.
 */
export const StepView = ({
  step,
  steps,
  initialStage,
  onBack,
  onOpenStep,
  onFullQuiz,
  lessonLabel,
}: {
  step: Step;
  steps: Step[];
  /** Open on this time (from the coach: read the lesson). */
  initialStage?: Stage;
  onBack: () => void;
  onOpenStep: (lessonId: string) => void;
  onFullQuiz: () => void;
  lessonLabel?: (lessonId: string) => string | undefined;
}) => {
  const { t } = useTranslation();
  const labels = useStageLabels();
  const markStage = useLearnProgressStore((state) => state.markStage);
  const recordSession = useLearnProgressStore((state) => state.recordSession);
  const setCurrentStep = useLearnProgressStore((state) => state.setCurrentStep);
  const setPendingPractice = useLearnProgressStore(
    (state) => state.setPendingPractice,
  );
  const startCoach = usePromptToolkitStore((state) => state.startCoach);
  const id = step.lesson.id;
  const [isRedo, setIsRedo] = useState(false);
  const stages = isRedo
    ? step.stages.filter((stage) => stage === 'quiz' || stage === 'practice')
    : step.stages;
  const [view, setView] = useState<View>(() => {
    const progress = useLearnProgressStore.getState();
    return {
      name: 'stage',
      stage: initialStage ?? nextStage(step, progress) ?? step.stages[0],
    };
  });
  // The levels before this step, to show what it brought at its end.
  const [levelsAtStart] = useState(() => {
    const state = useLearnProgressStore.getState();
    const levels = { ...state.skillLevels };
    const current = computeSkillLevels(
      steps,
      state,
      useCoachHistoryStore.getState().entries,
    );
    for (const skill of SHOWN_SKILLS) {
      levels[skill] = Math.max(
        levels[skill] ?? 0,
        current[skill] ?? 0,
      ) as SkillLevel;
    }
    return levels;
  });
  const [cards, setCards] = useState<CardsResult>();
  const [quiz, setQuiz] = useState<QuizResult>();
  const [practice, setPractice] = useState<PracticeResult>();
  const topRef = useRef<HTMLDivElement | null>(null);
  const [direction, setDirection] = useState<Direction>('forward');
  // Something done in this visit makes it a session, when the user stops.
  const hasWorkedRef = useRef(false);
  const stage = view.name === 'stage' ? view.stage : null;

  // This is the step being done, to resume it from the path.
  useEffect(() => {
    setCurrentStep(id);
  }, [id, setCurrentStep]);
  // A step is an activity: the panel widens while it is on screen.
  useRoomyPanel(useIsSpaceShown('learn'));

  // Each time of the step starts at the top of the panel.
  useEffect(() => {
    topRef.current?.closest('[data-frame]')?.scrollIntoView?.({
      block: 'start',
    });
  }, [view]);

  const slidePosition = useLearnProgressStore(
    (state) => state.slidePositions[id] ?? 0,
  );
  const startSlideRef = useRef(slidePosition);

  const after = (current: Stage) => {
    const position = stages.indexOf(current);
    return stages[position + 1] ?? null;
  };
  const continueLabel = (current: Stage) => {
    const next = after(current);
    return next
      ? t('Continue: {{stage}}', { stage: labels[next].toLocaleLowerCase() })
      : t('Finish the step');
  };
  const goTo = (next: View, way: Direction = 'forward') => {
    setDirection(way);
    setView(next);
  };
  /** A time finished: the next one follows at once, or the step is done. */
  const finish = (current: Stage, isPassed = false) => {
    markStage(id, current);
    if (!isPassed) {
      hasWorkedRef.current = true;
    }
    const next = after(current);
    if (next) {
      goTo({ name: 'stage', stage: next });
      return;
    }
    recordSession();
    goTo({ name: 'done' });
    if (isStepDone(step, useLearnProgressStore.getState())) {
      setCurrentStep(null);
    }
  };
  /** "Stop here": the place is kept, and the time spent counts. */
  const stop = () => {
    if (hasWorkedRef.current || slidePosition !== startSlideRef.current) {
      recordSession();
    }
    onBack();
  };
  /** The coach will look for this step in the next real requests. */
  const tryForReal = () => {
    setPendingPractice({
      lessonId: id,
      skills: lessonSkills(step.lesson),
      since: Date.now(),
    });
    startCoach();
  };
  // Passing a time on purpose: only towards a time that follows, and not
  // on the last screen of the reading, where the main button goes there.
  const isLastScreen =
    stage === 'read' && slidePosition >= step.lesson.slides.length - 1;
  const following = stage && !isLastScreen ? after(stage) : null;

  const tools = (
    <>
      {stage && following && (
        <Button
          size="small"
          color="neutral"
          variant="tertiary"
          onClick={() => finish(stage, true)}
        >
          {t('I already know: go to {{stage}}', {
            stage: labels[following].toLocaleLowerCase(),
          })}
        </Button>
      )}
      {view.name === 'stage' && (
        <Button
          size="small"
          color="neutral"
          variant="tertiary"
          onClick={() => goTo({ name: 'memo', from: view })}
          icon={<Icon iconName="sticky_note_2" $size="18px" />}
        >
          {t('Memo')}
        </Button>
      )}
    </>
  );

  const top = (
    <>
      <Text as="h2" $size="lg" $weight="800" $margin="0">
        {t('Step {{number}} · {{title}}', {
          number: step.number,
          title: step.lesson.title,
        })}
      </Text>
      {view.name === 'stage' && (
        <StageBar
          step={step}
          stages={stages}
          current={view.stage}
          onSelect={(selected) =>
            goTo(
              { name: 'stage', stage: selected },
              stages.indexOf(selected) < stages.indexOf(view.stage)
                ? 'back'
                : 'forward',
            )
          }
        />
      )}
      {isRedo && view.name === 'stage' && (
        <Text $size="sm" $variation="secondary">
          {t('Without help: no hints this time.')}
        </Text>
      )}
    </>
  );

  const exit =
    view.name === 'memo' ? (
      <Button
        color="neutral"
        variant="tertiary"
        onClick={() => goTo(view.from, 'back')}
        icon={<Icon iconName="arrow_back" $size="18px" />}
      >
        {t('Back to the step')}
      </Button>
    ) : view.name === 'done' ? (
      <Button
        color="neutral"
        variant="tertiary"
        onClick={onBack}
        icon={<Icon iconName="arrow_back" $size="18px" />}
      >
        {t('Back to the course')}
      </Button>
    ) : (
      <Button
        color="neutral"
        variant="tertiary"
        onClick={stop}
        icon={<Icon iconName="close" $size="18px" />}
      >
        {t('Stop here, resume later')}
      </Button>
    );

  return (
    <CourseFrame exit={exit} tools={tools} top={top}>
      <Box
        ref={topRef}
        key={view.name === 'stage' ? view.stage : view.name}
        $gap="16px"
        $css={css`
          ${enterCss(direction)}
        `}
      >
        {view.name === 'memo' && <StepMemo step={step} />}

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
            key={`${id}-${isRedo ? 'redo' : 'first'}`}
            title={step.lesson.title}
            scope={id}
            questions={step.quiz}
            onBack={onBack}
            showHints={!isRedo}
            lessonLabel={lessonLabel}
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
            key={`${step.challenge.id}-${isRedo ? 'redo' : 'first'}`}
            challenge={step.challenge}
            onBack={onBack}
            allowHints={!isRedo}
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
              tryForReal();
            }}
            onFinish={() => {
              setPractice('skipped');
              finish('practice');
            }}
          />
        )}

        {view.name === 'done' && (
          <StepDone
            step={step}
            steps={steps}
            cards={cards}
            quiz={quiz}
            practice={practice}
            levelsAtStart={levelsAtStart}
            onOpenStep={onOpenStep}
            onFullQuiz={onFullQuiz}
            onRedo={() => {
              setIsRedo(true);
              setQuiz(undefined);
              setPractice(undefined);
              goTo({ name: 'stage', stage: 'quiz' }, 'back');
            }}
            onMemo={() => goTo({ name: 'memo', from: { name: 'done' } })}
            onTryForReal={tryForReal}
          />
        )}
      </Box>
    </CourseFrame>
  );
};
