import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { JobSelect } from '../chat/JobSelect';
import { useAiAvailable, useAiUnavailable } from '../coach/aiAvailability';
import { WeeklyCase } from '../learn/cases/WeeklyCase';
import { useCasesStore } from '../learn/cases/casesProgress';
import { REVIEW_FIRST_FROM } from '../learn/steps';
import { useReviewDue } from '../learn/useLearnProgress';
import { TRANSCRIPTION_URL } from '../speech/transcribe';
import { useRecorderStore } from '../speech/useRecorderStore';
import { useCoachPrefsStore } from '../stores/useCoachPrefsStore';
import { useNestorChatStore } from '../stores/useNestorChatStore';
import { useProfileStore } from '../stores/useProfileStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';
import { startTour } from '../stores/useTourStore';

import { NestorIntroVideo, prefersReducedMotion } from './NestorIntroVideo';

type Tone = 'success' | 'brand' | 'info';

interface HomeCard {
  id: string;
  icon: string;
  tone: Tone;
  title: string;
  description: string;
  image: string;
  onSelect: () => void;
  /** A gentle sign that something waits there, in words for readers. */
  badge?: string;
  /** Where a beginner starts: marked « Commencer ici ». */
  start?: boolean;
}

const cardCss = (tone: Tone) => css`
  width: 100%;
  height: 100%;
  padding: 14px 10px;
  border-radius: 10px;
  cursor: pointer;
  font: inherit;
  color: inherit;
  text-align: left;
  border: 1px solid var(--c--contextuals--border--surface--primary);
  background: var(--c--contextuals--background--surface--primary);
  transition:
    border-color 0.15s ease,
    background-color 0.15s ease;
  &:hover {
    border-color: var(--c--contextuals--border--semantic--${tone}--primary);
    background: var(--c--contextuals--background--semantic--${tone}--tertiary);
  }
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 2px;
  }
`;

/** Home content sits in the middle of the panel height. */
const centeredCss = css`
  min-height: 100%;
  justify-content: center;
`;

/**
 * The welcome is over: the first time, Nestor's guided tour starts; it
 * shows the cards and the coach's buttons on the real screen.
 */
const finishWelcome = () => {
  usePromptToolkitStore.getState().dismissWelcome();
  if (!useProfileStore.getState().hasSeenTour) startTour();
};

/** The cards page keeps room at the bottom for Nestor's round button. */
const homeCss = css`
  ${centeredCss}
  padding-bottom: 72px;
`;

export const NESTOR_IMAGE_URL = '/assets/nestor.webp';
export { NESTOR_AVATAR_URL } from '../chat/avatar';
/** Nestor in each space of the panel, same style as the welcome. */
export const NESTOR_ANALYSIS_URL = '/assets/nestor-analyse.webp';
export const NESTOR_HELP_URL = '/assets/nestor-aide.webp';
export const NESTOR_HOME_URL = '/assets/nestor-accueil.webp';
export const NESTOR_INSTANT_URL = '/assets/nestor-volee.webp';
export const NESTOR_COURSE_URL = '/assets/nestor-cours.webp';
export const NESTOR_TOOLS_URL = '/assets/nestor-outils.webp';
export const NESTOR_FAVORITES_URL = '/assets/nestor-prompts.webp';
export const NESTOR_WRITE_URL = '/assets/nestor-ecrire.webp';
export const NESTOR_SUMMARIZE_URL = '/assets/nestor-resumer.webp';
export const NESTOR_ORGANIZE_URL = '/assets/nestor-organiser.webp';
export const NESTOR_PROMPTS_URL = '/assets/nestor-prompts.webp';
export const NESTOR_LESSONS_URL = '/assets/nestor-lecons.webp';
export const NESTOR_CARDS_URL = '/assets/nestor-fiches.webp';
export const NESTOR_QUIZ_URL = '/assets/nestor-quiz.webp';
export const NESTOR_CHALLENGES_URL = '/assets/nestor-defis.webp';
export const NESTOR_TRANSCRIPTION_URL = '/assets/nestor-transcription.webp';
/** Background of the illustration, so it blends into its card. */
const ILLUSTRATION_BACKGROUND = '#f7f8fd';
// Theme colour: readable in light and dark mode.
const NESTOR_NAVY = 'var(--c--contextuals--content--semantic--brand--primary)';

const valueBadgeCss = (color: string) => css`
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: white;
  background: ${color};
`;

/** Nestor's welcome, without motion: who Nestor is and what it does. */
const NestorWelcome = ({ onWatch }: { onWatch?: () => void }) => {
  const { t } = useTranslation();
  const values = [
    {
      icon: 'chat',
      color: 'var(--c--globals--colors--info-450)',
      title: t('Clarifies'),
      text: t('your request'),
    },
    {
      icon: 'lightbulb',
      color: 'var(--c--globals--colors--success-450)',
      title: t('Improves'),
      text: t('your requests'),
    },
    {
      icon: 'description',
      color: 'var(--c--globals--colors--brand-450)',
      title: t('Structures'),
      text: t('your ideas'),
    },
  ];

  return (
    <Box $gap="18px" $padding={{ all: 'base' }} $css={centeredCss}>
      <Box $direction="row" $justify="space-between" $align="flex-start">
        <Box $gap="2px">
          <Text
            as="h2"
            $margin="0"
            $weight="800"
            $css={css`
              font-size: 2.5rem;
              line-height: 1;
              letter-spacing: -0.02em;
              color: ${NESTOR_NAVY};
            `}
          >
            Nestor
          </Text>
          <Text $size="md" $variation="secondary" $weight="600">
            {t('Your coach for asking AI well')}
          </Text>
        </Box>
        <Box $gap="6px" $css="text-align: right; max-width: 40%;">
          <Text $size="xs" $variation="secondary">
            {t('Serving the public service')}
          </Text>
          <Box
            aria-hidden="true"
            $css={css`
              align-self: flex-end;
              width: 64px;
              height: 3px;
              border-radius: 2px;
              background: linear-gradient(
                90deg,
                #000091 33%,
                #ffffff 33% 66%,
                #e1000f 66%
              );
            `}
          />
        </Box>
      </Box>

      <Box
        $css={css`
          border-radius: 16px;
          overflow: hidden;
          background: ${ILLUSTRATION_BACKGROUND};
        `}
      >
        <img
          src={NESTOR_IMAGE_URL}
          alt={t(
            'Nestor, a cartoon orange fox with a purple scarf and a golden compass star, waves at you.',
          )}
          style={{ display: 'block', width: '100%', height: 'auto' }}
        />
      </Box>

      <Box
        as="ul"
        $gap="12px"
        $css="margin: 0; padding: 0 8px; list-style: none;"
      >
        {values.map((value) => (
          <Box
            as="li"
            key={value.title}
            $direction="row"
            $align="center"
            $gap="14px"
          >
            <Box
              $align="center"
              $justify="center"
              $css={valueBadgeCss(value.color)}
            >
              <Icon iconName={value.icon} $size="20px" $withThemeInherited />
            </Box>
            <Box>
              <Text $weight="700" $css={`color: ${NESTOR_NAVY};`}>
                {value.title}
              </Text>
              <Text $size="sm" $variation="secondary">
                {value.text}
              </Text>
            </Box>
          </Box>
        ))}
      </Box>

      <Button
        fullWidth
        onClick={finishWelcome}
        iconPosition="right"
        icon={<Icon iconName="arrow_forward" $size="20px" />}
      >
        {t('Get started')}
      </Button>
      {onWatch && (
        <Button
          fullWidth
          color="neutral"
          variant="tertiary"
          onClick={onWatch}
          icon={<Icon iconName="play_circle" $size="20px" />}
        >
          {t('Watch the presentation')}
        </Button>
      )}
    </Box>
  );
};

/**
 * Nestor's welcome, shown once: the presentation video, or the still welcome
 * when motion is reduced or the video cannot play.
 */
const NestorIntro = () => {
  const [isVideoShown, setVideoShown] = useState(() => !prefersReducedMotion());
  const [hasVideoFailed, setVideoFailed] = useState(false);

  if (isVideoShown && !hasVideoFailed) {
    return (
      <NestorIntroVideo
        onDone={finishWelcome}
        onError={() => setVideoFailed(true)}
      />
    );
  }
  return (
    <NestorWelcome
      onWatch={hasVideoFailed ? undefined : () => setVideoShown(true)}
    />
  );
};

/** Header of the cards page: Nestor, large, then the question. */
const NestorHeader = () => {
  const { t } = useTranslation();
  return (
    <Box $align="center" $gap="10px" $css="text-align: center;">
      <img
        src={NESTOR_HOME_URL}
        alt=""
        width={80}
        height={80}
        style={{ borderRadius: '50%', background: ILLUSTRATION_BACKGROUND }}
      />
      <Box $gap="2px">
        <Text as="h2" $size="h4" $weight="700" $margin="0">
          {t('How can I help you write?')}
        </Text>
        <Text $size="sm" $variation="secondary">
          {t('Nestor, your coach for asking AI well')}
        </Text>
      </Box>
    </Box>
  );
};

const resumeCss = css`
  padding: 10px 12px;
  border-radius: 10px;
  text-align: left;
  background: var(--c--contextuals--background--semantic--brand--tertiary);
`;

/**
 * A transcription is waiting (kept across a reload of the page): one line on
 * the home page to get back to it.
 */
const ResumeTranscript = ({ onResume }: { onResume: () => void }) => {
  const { t, i18n } = useTranslation();
  const text = useRecorderStore((state) => state.text);
  const updatedAt = useRecorderStore((state) => state.updatedAt);
  // Only once the text is known to be the signed-in user's.
  const isClaimed = useRecorderStore((state) => state.isClaimed);
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  if (!isClaimed || words === 0) {
    return null;
  }
  const details = [
    updatedAt
      ? t('Transcription from {{time}}', {
          time: new Intl.DateTimeFormat(i18n.language, {
            hour: '2-digit',
            minute: '2-digit',
          }).format(updatedAt),
        })
      : t('Transcription'),
    t('{{count}} words', { count: words }),
  ].join(' · ');
  return (
    <Box
      role="region"
      aria-label={t('Resume')}
      $direction="row"
      $align="center"
      $gap="10px"
      $css={resumeCss}
    >
      <Icon iconName="mic" $size="22px" $theme="brand" />
      <Box $gap="2px" $css="flex: 1; min-width: 0;">
        <Text
          $size="xs"
          $weight="700"
          $theme="brand"
          $css="text-transform: uppercase; letter-spacing: 0.04em;"
        >
          {t('Resume')}
        </Text>
        <Text $size="sm">{details}</Text>
      </Box>
      <Button size="small" onClick={onResume}>
        {t('Resume')}
      </Button>
    </Box>
  );
};

/** What the panel offers, as cards: shown on first opening and after a reset. */
export const PanelHome = () => {
  const { t } = useTranslation();
  const startCoach = usePromptToolkitStore((state) => state.startCoach);
  const openSection = usePromptToolkitStore((state) => state.openSection);
  const hasSeenWelcome = usePromptToolkitStore((state) => state.hasSeenWelcome);
  const isAiUnavailable = useAiUnavailable();
  const isAiAvailable = useAiAvailable();
  const openTool = usePromptToolkitStore((state) => state.openTool);
  const isBeginner = useProfileStore((state) => state.isBeginner);
  const job = useProfileStore((state) => state.job);
  const jobLater = useCoachPrefsStore((state) => state.jobLater);
  // Each day of use counts: « Votre semaine » waits for a few.
  const noteDay = useCasesStore((state) => state.noteDay);
  useEffect(() => noteDay(), [noteDay]);
  const hasUsedCoach = useNestorChatStore(
    (state) => Object.keys(state.chats).length > 0,
  );
  const reviewDue = useReviewDue();

  const transcriptionCard: HomeCard = {
    id: 'transcription',
    image: NESTOR_TRANSCRIPTION_URL,
    icon: 'mic',
    tone: 'brand',
    title: t('Record and transcribe'),
    description: t(
      'A meeting, an idea, a voice note: the text arrives while you speak.',
    ),
    onSelect: () => openTool('minutes'),
  };
  // New modules (prompting course, everyday tools…) add a card here.
  const cards: HomeCard[] = [
    {
      id: 'coach-manual',
      image: NESTOR_ANALYSIS_URL,
      icon: 'touch_app',
      tone: 'brand',
      title: t('Coach'),
      description: t('Improves your requests, before and after the answer.'),
      onSelect: () => startCoach(),
      start: isBeginner || !hasUsedCoach,
    },
    {
      id: 'course',
      image: NESTOR_COURSE_URL,
      icon: 'school',
      tone: 'brand',
      title: t('Course'),
      description: t('Learning to ask well: lessons, cards, quizzes.'),
      onSelect: () => openSection('learn'),
      badge:
        reviewDue >= REVIEW_FIRST_FROM
          ? t('{{count}} items to review', { count: reviewDue })
          : undefined,
    },
    {
      id: 'tools',
      image: NESTOR_TOOLS_URL,
      icon: 'apps',
      tone: 'success',
      title: t('Everyday tools'),
      description: t('Emails, summaries, ready-made templates.'),
      onSelect: () => openSection('tools'),
    },
  ];

  if (!hasSeenWelcome) {
    return <NestorIntro />;
  }
  // Without the Albert relay, only what works without AI is offered.
  const shownCards = (
    isAiAvailable && TRANSCRIPTION_URL ? [transcriptionCard, ...cards] : cards
  ).filter((card) => !isAiUnavailable || card.id !== 'coach-manual');

  return (
    <Box $gap="16px" $padding={{ all: 'base' }} $css={homeCss}>
      <NestorHeader />
      {isAiAvailable && TRANSCRIPTION_URL && (
        <ResumeTranscript onResume={() => openTool('minutes')} />
      )}
      <Box
        as="ul"
        $css={css`
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 12px;
          margin: 0;
          padding: 0;
          list-style: none;
        `}
      >
        {shownCards.map((card, index) => {
          // An odd last card takes the whole row, low and wide: no hole in
          // the grid, and everything fits without scrolling.
          const isWide =
            shownCards.length % 2 === 1 && index === shownCards.length - 1;
          return (
            <li
              key={card.id}
              style={isWide ? { gridColumn: '1 / -1' } : undefined}
            >
              <Box
                as="button"
                type="button"
                data-tour={`card-${card.id}`}
                onClick={card.onSelect}
                $direction={isWide ? 'row' : 'column'}
                $align="center"
                $gap={isWide ? '12px' : '4px'}
                $css={css`
                  ${cardCss(card.tone)}
                  position: relative;
                  ${
                    card.start &&
                    css`
                      border: 2px solid
                        var(--c--contextuals--border--semantic--brand--primary);
                    `
                  }
                  justify-content: ${isWide ? 'center' : 'flex-start'};
                  text-align: ${isWide ? 'left' : 'center'};
                  padding: 14px 10px;
                `}
              >
                {card.start && (
                  <Box
                    as="span"
                    $css={css`
                      position: absolute;
                      top: -10px;
                      left: 50%;
                      transform: translateX(-50%);
                      padding: 1px 10px;
                      border-radius: 999px;
                      font-size: 11px;
                      font-weight: 700;
                      white-space: nowrap;
                      color: #ffffff;
                      background: var(
                        --c--contextuals--background--semantic--brand--primary
                      );
                    `}
                  >
                    {t('Start here')}
                  </Box>
                )}
                {card.badge && (
                  <Box
                    as="span"
                    title={card.badge}
                    $css={css`
                      position: absolute;
                      top: 10px;
                      right: 10px;
                      width: 10px;
                      height: 10px;
                      border-radius: 50%;
                      background: var(
                        --c--contextuals--background--semantic--brand--primary
                      );
                    `}
                  >
                    <span className="sr-only">{card.badge}</span>
                  </Box>
                )}
                <img
                  src={card.image}
                  alt=""
                  width={48}
                  height={48}
                  style={{
                    flex: 'none',
                    borderRadius: '50%',
                    objectFit: 'cover',
                    background: ILLUSTRATION_BACKGROUND,
                  }}
                />
                <Box $gap="2px">
                  <Text $weight="700" $size="sm">
                    {card.title}
                  </Text>
                  <Text $size="xs" $variation="secondary">
                    {card.description}
                  </Text>
                </Box>
              </Box>
            </li>
          );
        })}
      </Box>
      {/* Until the job is chosen, the question waits under the cards. */}
      {!job && !jobLater ? (
        <Box
          $gap="8px"
          $align="center"
          $css="text-align: center; padding-top: 4px;"
        >
          <Text $size="sm" $variation="secondary">
            {t('To speak of your own work, I need one thing:')}
          </Text>
          <JobSelect />
        </Box>
      ) : (
        /* After a few days of use: a few actions for the user's job. */
        <WeeklyCase />
      )}
    </Box>
  );
};
