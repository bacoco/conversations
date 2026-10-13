import { Button } from '@gouvfr-lasuite/cunningham-react';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { Disclosure } from '../components/CoachParts';
import { NESTOR_CARDS_URL, NESTOR_COURSE_URL } from '../components/PanelHome';
import {
  usePromptToolkitStore,
  useSectionReset,
} from '../stores/usePromptToolkitStore';
import { startTraining } from '../stores/useTrainerStore';

import { CourseFrame, ScreenActions } from './CourseFrame';
import { ILLUSTRATION_BACKGROUND, weekStats } from './CourseParts';
import { CardsResult, FlashcardsView } from './FlashcardsView';
import { ManageProgressView } from './ManageProgressView';
import { MyMemo } from './MemoViews';
import { QuizResult, QuizView } from './QuizView';
import { SkillsView } from './SkillsView';
import { StepView, useStageLabels } from './StepView';
import { CaseView } from './cases/CaseView';
import { CasesView } from './cases/CasesView';
import { JourneyView } from './cases/JourneyView';
import { useCasesStore } from './cases/casesProgress';
import { getCourseContent } from './content';
import {
  CHECKPOINTS,
  REVIEW_FIRST_FROM,
  STAGE_ORDER,
  Stage,
  Step,
  cardsToReview,
  checkpointQuestions,
  dueCheckpoint,
  isStepDone,
  isStepStarted,
  lessonSkills,
  nextStage,
  nextStep,
  questionsToReview,
} from './steps';
import type { Flashcard, QuizQuestion } from './types';
import { useCourseSteps, useLearnProgress } from './useLearnProgress';
import { FULL_QUIZ, useLearnProgressStore } from './useLearnProgressStore';

type View =
  | { name: 'path' }
  | { name: 'all' }
  | { name: 'step'; lessonId: string; stage?: Stage }
  | { name: 'review'; cards: Flashcard[]; questions: QuizQuestion[] }
  | { name: 'checkpoint'; id: string }
  | { name: 'placement' }
  | { name: 'quiz' }
  | { name: 'memo' }
  | { name: 'manage' }
  | { name: 'cases' }
  | { name: 'case'; caseId: string }
  | { name: 'journey' };

const rowCss = (isCurrent: boolean) => css`
  width: 100%;
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
  font: inherit;
  color: inherit;
  text-align: left;
  border: 1px solid
    ${
      isCurrent
        ? 'var(--c--contextuals--border--semantic--brand--secondary)'
        : 'transparent'
    };
  background: ${
    isCurrent
      ? 'var(--c--contextuals--background--semantic--brand--tertiary)'
      : 'transparent'
  };
  &:hover {
    background: var(--c--contextuals--background--surface--secondary);
  }
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 2px;
  }
`;

const badgeCss = (state: 'done' | 'current' | 'todo') => css`
  flex: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  box-sizing: border-box;
  font-size: 0.875rem;
  font-weight: 700;
  border: 2px solid
    ${
      state === 'todo'
        ? 'var(--c--contextuals--border--surface--primary)'
        : 'transparent'
    };
  color: ${
    state === 'done'
      ? 'var(--c--contextuals--content--semantic--success--primary)'
      : state === 'current'
        ? 'var(--c--contextuals--content--semantic--brand--on-brand)'
        : 'var(--c--contextuals--content--semantic--neutral--secondary)'
  };
  background: ${
    state === 'done'
      ? 'var(--c--contextuals--background--semantic--success--tertiary)'
      : state === 'current'
        ? 'var(--c--contextuals--background--semantic--brand--primary)'
        : 'var(--c--contextuals--background--surface--primary)'
  };
`;

const linkCss = css`
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  font: inherit;
  font-size: 0.8125rem;
  color: var(--c--contextuals--content--semantic--brand--primary);
  text-decoration: underline;
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 2px;
  }
`;

/**
 * About how long a step takes, in minutes: a screen read, a card turned, a
 * question answered, an exercise. An order of magnitude, shown as such.
 */
export const stepMinutes = (step: Step) =>
  Math.max(
    2,
    Math.round(
      step.lesson.slides.length * 0.7 +
        (step.stages.includes('cards') ? step.cards.length * 0.3 : 0) +
        (step.stages.includes('quiz') ? step.quiz.length * 0.4 : 0) +
        (step.challenge ? 2 : step.practiseWithCoach ? 1 : 0),
    ),
  );

/** The questions of the level test: the flagged ones, else one per step. */
const placementQuestions = (steps: Step[]) => {
  const flagged = steps.flatMap((step) =>
    step.quiz.filter((question) => question.placement),
  );
  return flagged.length > 0
    ? flagged
    : steps
        .map((step) => step.quiz[step.quiz.length - 1])
        .filter((question): question is QuizQuestion => Boolean(question));
};

/**
 * A page of the course in the same frame as a step: its title on top, the
 * way back at the bottom left, its main action at the bottom right.
 */
const CoursePage = ({
  title,
  onBack,
  children,
}: {
  title: string;
  onBack: () => void;
  children: ReactNode;
}) => {
  const { t } = useTranslation();
  return (
    <CourseFrame
      top={
        <Text as="h2" $size="lg" $weight="800" $margin="0">
          {title}
        </Text>
      }
      exit={
        <Button
          color="neutral"
          variant="tertiary"
          onClick={onBack}
          icon={<Icon iconName="arrow_back" $size="18px" />}
        >
          {t('Back to the course')}
        </Button>
      }
    >
      <Box $gap="16px">{children}</Box>
    </CourseFrame>
  );
};

/** The review: the cards due first, then the questions to try again. */
const ReviewView = ({
  cards,
  questions,
  onBack,
}: {
  cards: Flashcard[];
  questions: QuizQuestion[];
  onBack: () => void;
}) => {
  const { t } = useTranslation();
  const [cardsResult, setCardsResult] = useState<CardsResult | null>(
    cards.length === 0 ? { known: 0, toReview: 0 } : null,
  );
  const [quizResult, setQuizResult] = useState<QuizResult | null>(
    questions.length === 0 ? { right: 0, total: 0, missed: [] } : null,
  );

  if (!cardsResult) {
    return (
      <CoursePage title={t('Review in 2 minutes')} onBack={onBack}>
        <FlashcardsView cards={cards} onDone={setCardsResult} />
      </CoursePage>
    );
  }
  if (!quizResult) {
    return (
      <CoursePage title={t('Review in 2 minutes')} onBack={onBack}>
        <Text $size="sm" $variation="secondary">
          {t('Questions you missed or were not sure about.')}
        </Text>
        <QuizView
          title={t('Review')}
          questions={questions}
          onBack={onBack}
          inStep={{ doneLabel: t('See the result'), onDone: setQuizResult }}
        />
      </CoursePage>
    );
  }
  return (
    <CoursePage title={t('Review in 2 minutes')} onBack={onBack}>
      <Box $gap="14px" $align="center" $css="text-align: center;">
        <img
          src={NESTOR_CARDS_URL}
          alt=""
          width={120}
          height={120}
          style={{ borderRadius: '50%', background: ILLUSTRATION_BACKGROUND }}
        />
        <Text $weight="700">{t('Review done')}</Text>
        {cards.length > 0 && (
          <Text $size="sm">
            {t('{{known}} cards known out of {{total}}', {
              known: cardsResult.known,
              total: cards.length,
            })}
          </Text>
        )}
        {questions.length > 0 && (
          <Text $size="sm">
            {t('{{right}} right answers out of {{total}}', {
              right: quizResult.right,
              total: quizResult.total,
            })}
          </Text>
        )}
        <Text $size="xs" $variation="secondary">
          {t('What you know comes back later and later; the rest, soon.')}
        </Text>
        <ScreenActions>
          <Button onClick={onBack}>{t('Finish')}</Button>
        </ScreenActions>
      </Box>
    </CoursePage>
  );
};

/**
 * The level test: a question per step. A step whose questions are right is
 * marked as known, and the path starts at the first one left.
 */
const PlacementView = ({
  steps,
  onBack,
  onOpenStep,
}: {
  steps: Step[];
  onBack: () => void;
  onOpenStep: (lessonId: string) => void;
}) => {
  const { t } = useTranslation();
  const markStage = useLearnProgressStore((state) => state.markStage);
  const setPlacementDone = useLearnProgressStore(
    (state) => state.setPlacementDone,
  );
  const raiseSkills = useLearnProgressStore((state) => state.raiseSkills);
  const scheduleKnownCards = useLearnProgressStore(
    (state) => state.scheduleKnownCards,
  );
  /** The first step whose question was missed: where the path starts. */
  const [missedStep, setMissedStep] = useState<Step | null>(null);
  const [questions] = useState(() => placementQuestions(steps));
  const [skipped, setSkipped] = useState<Step[] | null>(null);

  if (skipped) {
    const next = steps.find((step) => !skipped.includes(step));
    const left = steps.filter((step) => !skipped.includes(step));
    return (
      <CoursePage title={t('Your level')} onBack={onBack}>
        <Box $gap="12px">
          {skipped.length > 0 ? (
            <Text>
              {t(
                'You already know {{count}} steps: they are marked as done. You can still open them at any time.',
                { count: skipped.length },
              )}
            </Text>
          ) : (
            <Text>
              {t('Starting from the beginning is the best choice for you.')}
            </Text>
          )}
          {missedStep && (
            <Text $size="sm">
              {t(
                'The question of step {{number}} (“{{title}}”) was missed: the path starts there.',
                { number: missedStep.number, title: missedStep.lesson.title },
              )}
            </Text>
          )}
          {left.length > 0 && left.length < steps.length && (
            <Text $size="sm" $variation="secondary">
              {t('{{count}} steps left for you, about {{minutes}} min.', {
                count: left.length,
                minutes: left.reduce((sum, step) => sum + stepMinutes(step), 0),
              })}
            </Text>
          )}
          {next && (
            <Text $size="sm" $variation="secondary">
              {t('Your next step: {{title}}', { title: next.lesson.title })}
            </Text>
          )}
          {next && (
            <ScreenActions>
              <Button
                onClick={() => onOpenStep(next.lesson.id)}
                iconPosition="right"
                icon={<Icon iconName="arrow_forward" $size="18px" />}
              >
                {t('Start at step {{number}}', { number: next.number })}
              </Button>
            </ScreenActions>
          )}
        </Box>
      </CoursePage>
    );
  }

  return (
    <CoursePage title={t('Test my level')} onBack={onBack}>
      <Text $size="sm" $variation="secondary">
        {t(
          '{{count}} questions, about 4 minutes. The steps you already know will be marked as done.',
          { count: questions.length },
        )}
      </Text>
      <QuizView
        title={t('Test my level')}
        questions={questions}
        onBack={onBack}
        showHints={false}
        retryMistakes={false}
        inStep={{
          doneLabel: t('See my level'),
          onDone: (result) => {
            const missed = new Set(result.missed.map((item) => item.lessonId));
            const known = steps.filter(
              (step) =>
                questions.some((q) => q.lessonId === step.lesson.id) &&
                !missed.has(step.lesson.id),
            );
            // Every step whose question is right is marked as known.
            const toSkip = known;
            for (const step of toSkip) {
              for (const stage of STAGE_ORDER) {
                markStage(step.lesson.id, stage);
              }
            }
            // Their cards come back later, not all at once today.
            scheduleKnownCards(
              toSkip.flatMap((step) => step.cards.map((card) => card.id)),
            );
            setMissedStep(
              steps.find((step) => missed.has(step.lesson.id)) ?? null,
            );
            // Proven in the test: what these steps teach is acquired.
            raiseSkills(
              Object.fromEntries(
                toSkip.flatMap((step) =>
                  lessonSkills(step.lesson).map((skill) => [skill, 2]),
                ),
              ),
            );
            setPlacementDone();
            setSkipped(toSkip);
          },
        }}
      />
    </CoursePage>
  );
};

/**
 * The prompting course, one thing at a time: what to do now (a review when
 * enough is due, a checkpoint after a few steps, else the next lesson) and
 * one button. The whole course is one click away, never in the way.
 */
export const LearnPanel = () => {
  const { t, i18n } = useTranslation();
  const course = useMemo(
    () => getCourseContent(i18n.language),
    [i18n.language],
  );
  // Practice is graded or guided by the coach: none without the Albert relay.
  const steps = useCourseSteps();
  const progress = useLearnProgress();
  const bestQuizScores = progress.bestQuizScores;
  const setSlidePosition = useLearnProgressStore(
    (state) => state.setSlidePosition,
  );
  const completeCheckpoint = useLearnProgressStore(
    (state) => state.completeCheckpoint,
  );
  const placementDone = useLearnProgressStore((state) => state.placementDone);
  const weeklyGoal = useLearnProgressStore((state) => state.weeklyGoal);
  const sessions = useLearnProgressStore((state) => state.sessions);
  const labels = useStageLabels();
  const [view, setView] = useState<View>({ name: 'path' });
  const back = () => setView({ name: 'path' });
  const openStep = (lessonId: string, stage?: Stage) =>
    setView({ name: 'step', lessonId, stage });
  const openScreen = (lessonId: string, slide: number) => {
    setSlidePosition(lessonId, slide);
    openStep(lessonId, 'read');
  };
  const lessonLabel = (lessonId: string) => {
    const step = steps.find((s) => s.lesson.id === lessonId);
    return step
      ? t('Step {{number}} · {{title}}', {
          number: step.number,
          title: step.lesson.title,
        })
      : undefined;
  };
  // Progress is reset item by item, with a confirmation.
  useSectionReset('learn', () => setView({ name: 'manage' }));

  // A lesson asked from elsewhere in the panel opens its step.
  const lessonRequest = usePromptToolkitStore((state) => state.lessonRequest);
  const clearLessonRequest = usePromptToolkitStore(
    (state) => state.clearLessonRequest,
  );
  useEffect(() => {
    if (lessonRequest) {
      if (lessonRequest.slide !== undefined) {
        setSlidePosition(lessonRequest.lessonId, lessonRequest.slide);
      }
      setView({
        name: 'step',
        lessonId: lessonRequest.lessonId,
        stage: lessonRequest.slide !== undefined ? 'read' : undefined,
      });
      clearLessonRequest();
    }
  }, [lessonRequest, clearLessonRequest, setSlidePosition]);

  // A case asked from the home page ("Le cas de la semaine") opens here.
  const caseRequest = useCasesStore((state) => state.requested);
  const clearCaseRequest = useCasesStore((state) => state.clearRequest);
  useEffect(() => {
    if (caseRequest) {
      setView({ name: 'case', caseId: caseRequest });
      clearCaseRequest();
    }
  }, [caseRequest, clearCaseRequest]);

  if (view.name === 'step') {
    const step = steps.find((s) => s.lesson.id === view.lessonId);
    if (step) {
      return (
        <StepView
          key={step.lesson.id}
          step={step}
          steps={steps}
          initialStage={view.stage}
          onBack={back}
          onOpenStep={(lessonId) => openStep(lessonId)}
          onFullQuiz={() => setView({ name: 'quiz' })}
          lessonLabel={lessonLabel}
        />
      );
    }
  }

  if (view.name === 'quiz') {
    return (
      <QuizView
        scope={FULL_QUIZ}
        title={t('The whole course')}
        questions={course.quiz}
        onBack={back}
        lessonLabel={lessonLabel}
        onOpenLesson={(lessonId) => openStep(lessonId, 'read')}
      />
    );
  }

  if (view.name === 'manage') {
    return <ManageProgressView course={course} onBack={back} />;
  }

  // The practical cases of the user's job, and the journey through them.
  if (view.name === 'cases') {
    return <CasesView onBack={back} onOpen={startTraining} />;
  }
  if (view.name === 'case') {
    return (
      <CaseView
        caseId={view.caseId}
        onBack={() => setView({ name: 'cases' })}
        onDone={() => setView({ name: 'journey' })}
      />
    );
  }
  if (view.name === 'journey') {
    return <JourneyView onBack={back} onOpen={startTraining} />;
  }

  if (view.name === 'review') {
    return (
      <ReviewView cards={view.cards} questions={view.questions} onBack={back} />
    );
  }

  if (view.name === 'placement') {
    return (
      <PlacementView
        steps={steps}
        onBack={back}
        onOpenStep={(lessonId) => openStep(lessonId)}
      />
    );
  }

  if (view.name === 'memo') {
    return (
      <CoursePage title={t('My memo')} onBack={back}>
        <MyMemo steps={steps} onOpenStep={(lessonId) => openStep(lessonId)} />
      </CoursePage>
    );
  }

  if (view.name === 'checkpoint') {
    const checkpoint = CHECKPOINTS.find((item) => item.id === view.id);
    if (checkpoint) {
      return (
        <QuizView
          title={t('Checkpoint {{number}}', { number: checkpoint.number })}
          questions={checkpointQuestions(steps, checkpoint)}
          onBack={back}
          lessonLabel={lessonLabel}
          onOpenLesson={(lessonId) => openStep(lessonId, 'read')}
          onComplete={() => completeCheckpoint(checkpoint.id)}
        />
      );
    }
  }

  const next = nextStep(steps, progress);
  const doneCount = steps.filter((step) => isStepDone(step, progress)).length;
  const cardsDue = cardsToReview(steps, progress);
  const questionsDue = questionsToReview(steps, progress);
  const dueCount = cardsDue.length + questionsDue.length;
  const checkpoint = dueCheckpoint(steps, progress);
  const nextStarted = next !== null && isStepStarted(next, progress);
  const stage = next ? nextStage(next, progress) : null;
  const isFirstVisit =
    !placementDone &&
    steps.every((step) => !isStepStarted(step, progress)) &&
    sessions.length === 0;
  const startReview = () =>
    setView({ name: 'review', cards: cardsDue, questions: questionsDue });
  const week = weeklyGoal ? weekStats(sessions, weeklyGoal, Date.now()) : null;

  if (view.name === 'all') {
    return (
      <CoursePage title={t('The whole course')} onBack={back}>
        <Text $size="xs" $variation="secondary">
          {t('{{done}} of {{total}} steps completed', {
            done: doneCount,
            total: steps.length,
          })}
        </Text>
        <Box
          as="ol"
          aria-label={t('The steps of the course')}
          $gap="2px"
          $css="margin: 0; padding: 0; list-style: none;"
        >
          {steps.map((step) => {
            const isDone = isStepDone(step, progress);
            const isCurrent = !isDone && next?.lesson.id === step.lesson.id;
            const stepStage = nextStage(step, progress);
            const isStarted = isStepStarted(step, progress);
            return (
              <li key={step.lesson.id}>
                <Box
                  as="button"
                  type="button"
                  aria-current={isCurrent ? 'step' : undefined}
                  onClick={() => openStep(step.lesson.id)}
                  $direction="row"
                  $align="center"
                  $gap="12px"
                  $css={rowCss(isCurrent)}
                >
                  <Box
                    $align="center"
                    $justify="center"
                    $css={badgeCss(
                      isDone ? 'done' : isCurrent ? 'current' : 'todo',
                    )}
                  >
                    {isDone ? (
                      <Icon iconName="check" $size="16px" $withThemeInherited />
                    ) : (
                      step.number
                    )}
                  </Box>
                  <Box $gap="2px" $css="flex: 1; min-width: 0;">
                    <Text $size="sm" $weight={isCurrent ? '700' : '600'}>
                      {step.lesson.title}
                    </Text>
                    {(isDone || (isStarted && stepStage)) && (
                      <Text
                        $size="xs"
                        $theme={isDone ? undefined : 'brand'}
                        $variation={isDone ? 'secondary' : undefined}
                      >
                        {isDone
                          ? t('Completed')
                          : t('In progress · {{stage}}', {
                              stage: stepStage ? labels[stepStage] : '',
                            })}
                      </Text>
                    )}
                  </Box>
                  <Icon
                    iconName="chevron_right"
                    $size="20px"
                    $variation="secondary"
                  />
                </Box>
              </li>
            );
          })}
        </Box>

        <SkillsView steps={steps} onOpenStep={openScreen} />

        <Disclosure label={t('More')} icon="more_horiz">
          <Box $gap="4px" $align="flex-start">
            <Button
              size="small"
              color="neutral"
              variant="tertiary"
              onClick={() => setView({ name: 'memo' })}
              icon={<Icon iconName="bookmarks" $size="18px" />}
            >
              {t('My memo')}
            </Button>
            <Button
              size="small"
              color="neutral"
              variant="tertiary"
              onClick={() => setView({ name: 'quiz' })}
              icon={<Icon iconName="emoji_events" $size="18px" />}
            >
              {bestQuizScores[FULL_QUIZ] === undefined
                ? t('The full quiz · {{count}} questions', {
                    count: course.quiz.length,
                  })
                : t('The full quiz · best: {{score}}%', {
                    score: bestQuizScores[FULL_QUIZ],
                  })}
            </Button>
            <Button
              size="small"
              color="neutral"
              variant="tertiary"
              onClick={() => setView({ name: 'placement' })}
              icon={<Icon iconName="speed" $size="18px" />}
            >
              {t('Test my level')}
            </Button>
            <Button
              size="small"
              color="neutral"
              variant="tertiary"
              onClick={() => setView({ name: 'manage' })}
              icon={<Icon iconName="tune" $size="18px" />}
            >
              {t('Manage my progress')}
            </Button>
          </Box>
        </Disclosure>
      </CoursePage>
    );
  }

  // What to do now: one thing, chosen in this order.
  // A step under way comes first: the review waits behind its link.
  const isReviewFirst = dueCount >= REVIEW_FIRST_FROM && !nextStarted;
  let main: {
    eyebrow: string;
    title: string;
    detail: string;
    action: string;
    icon: string;
    onClick: () => void;
  } | null = null;
  if (isReviewFirst) {
    main = {
      eyebrow: t('Today'),
      title: t('Your review'),
      detail: t('{{count}} items to go over · about 2 min', {
        count: dueCount,
      }),
      action: t('Review'),
      icon: 'style',
      onClick: startReview,
    };
  } else if (checkpoint) {
    main = {
      eyebrow: t('Checkpoint {{number}}', { number: checkpoint.number }),
      title: t('Check what stuck'),
      detail: t('{{count}} questions on the last steps · about 3 min', {
        count: checkpointQuestions(steps, checkpoint).length,
      }),
      action: t('Start'),
      icon: 'flag',
      onClick: () => setView({ name: 'checkpoint', id: checkpoint.id }),
    };
  } else if (next) {
    main = {
      eyebrow: nextStarted ? t('To resume') : t('Your next lesson'),
      title: next.lesson.title,
      detail:
        nextStarted && stage
          ? t('About {{count}} min · you are at: {{stage}}', {
              count: stepMinutes(next),
              stage: labels[stage].toLocaleLowerCase(),
            })
          : t('About {{count}} min', { count: stepMinutes(next) }),
      action: nextStarted ? t('Resume') : t('Start'),
      icon: 'play_arrow',
      onClick: () => openStep(next.lesson.id),
    };
  }

  return (
    <Box
      $align="center"
      $gap="16px"
      $css={css`
        min-height: 100%;
        justify-content: center;
        padding: 24px 20px 96px;
        text-align: center;
      `}
    >
      <img
        src={NESTOR_COURSE_URL}
        alt=""
        width={140}
        height={140}
        style={{ borderRadius: '50%', background: ILLUSTRATION_BACKGROUND }}
      />
      {main ? (
        <>
          <Box $gap="6px" $align="center">
            <Text
              $size="xs"
              $weight="700"
              $theme="brand"
              $css="text-transform: uppercase; letter-spacing: 0.06em;"
            >
              {main.eyebrow}
            </Text>
            <Text as="h2" $size="h4" $weight="800" $margin="0">
              {main.title}
            </Text>
            <Text $variation="secondary">{main.detail}</Text>
          </Box>
          <Box $css="width: 100%; max-width: 320px;">
            <Button
              fullWidth
              onClick={main.onClick}
              icon={<Icon iconName={main.icon} $size="20px" />}
            >
              {main.action}
            </Button>
          </Box>
        </>
      ) : (
        <Box $gap="10px" $align="center">
          <Text as="h2" $size="h4" $weight="800" $margin="0">
            {t('Path completed, congratulations!')}
          </Text>
          <Button onClick={() => setView({ name: 'quiz' })}>
            {t('Take the full quiz')}
          </Button>
        </Box>
      )}
      {isFirstVisit && (
        <Box
          as="button"
          type="button"
          onClick={() => setView({ name: 'placement' })}
          $css={linkCss}
        >
          {t('I have already used an AI: test my level')}
        </Box>
      )}

      {/* Where the user is, without a list: one dot per step. */}
      <Box
        role="img"
        aria-label={t('{{done}} of {{total}} steps completed', {
          done: doneCount,
          total: steps.length,
        })}
        $direction="row"
        $gap="6px"
      >
        {steps.map((step) => {
          const isDone = isStepDone(step, progress);
          const isNext = next?.lesson.id === step.lesson.id;
          return (
            <Box
              key={step.lesson.id}
              $css={css`
                width: ${isNext ? 18 : 8}px;
                height: 8px;
                border-radius: 4px;
                background: ${
                  isDone
                    ? 'var(--c--contextuals--background--semantic--success--primary)'
                    : isNext
                      ? 'var(--c--contextuals--background--semantic--brand--primary)'
                      : 'var(--c--contextuals--border--surface--primary)'
                };
              `}
            />
          );
        })}
      </Box>
      {week && weeklyGoal && (
        <Text $size="xs" $variation="secondary">
          {[
            t('This week: {{done}} of {{goal}} sessions', {
              done: Math.min(week.doneThisWeek, weeklyGoal),
              goal: weeklyGoal,
            }),
            week.streak > 1
              ? t('{{count}} weeks in a row', { count: week.streak })
              : '',
          ]
            .filter(Boolean)
            .join(' · ')}
        </Text>
      )}

      <Box
        $direction="row"
        $gap="8px"
        $justify="center"
        $css="flex-wrap: wrap;"
      >
        {!isReviewFirst && dueCount > 0 && (
          <Button
            size="small"
            color="neutral"
            variant="tertiary"
            onClick={startReview}
            icon={<Icon iconName="style" $size="18px" />}
          >
            {t('Review {{count}} items', { count: dueCount })}
          </Button>
        )}
        <Button
          size="small"
          color="neutral"
          variant="tertiary"
          onClick={() => setView({ name: 'cases' })}
          icon={<Icon iconName="work" $size="18px" />}
        >
          {t('Cases of my job')}
        </Button>
        <Button
          size="small"
          color="neutral"
          variant="tertiary"
          onClick={() => setView({ name: 'journey' })}
          icon={<Icon iconName="flag" $size="18px" />}
        >
          {t('My journey')}
        </Button>
        <Button
          size="small"
          color="neutral"
          variant="tertiary"
          onClick={() => setView({ name: 'all' })}
          icon={<Icon iconName="list" $size="18px" />}
        >
          {t('See the whole course')}
        </Button>
      </Box>
    </Box>
  );
};
