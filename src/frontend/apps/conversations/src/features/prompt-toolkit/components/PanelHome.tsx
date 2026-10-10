import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { useAiAvailable, useAiUnavailable } from '../coach/aiAvailability';
import { TRANSCRIPTION_URL } from '../speech/transcribe';
import {
  CoachMode,
  usePromptToolkitStore,
} from '../stores/usePromptToolkitStore';

import { NestorIntroVideo, prefersReducedMotion } from './NestorIntroVideo';
import { ProfileSettings } from './ProfileSettings';

type Tone = 'success' | 'brand' | 'info';

interface HomeCard {
  id: string;
  icon: string;
  tone: Tone;
  title: string;
  description: string;
  image: string;
  onSelect: () => void;
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

export const NESTOR_IMAGE_URL = '/assets/nestor.webp';
export const NESTOR_AVATAR_URL = '/assets/nestor-avatar.webp';
/** Nestor in each space of the panel, same style as the welcome. */
export const NESTOR_ANALYSIS_URL = '/assets/nestor-analyse.webp';
export const NESTOR_HELP_URL = '/assets/nestor-aide.webp';
export const NESTOR_HOME_URL = '/assets/nestor-accueil.webp';
export const NESTOR_INSTANT_URL = '/assets/nestor-volee.webp';
export const NESTOR_COURSE_URL = '/assets/nestor-cours.webp';
export const NESTOR_TOOLS_URL = '/assets/nestor-outils.webp';
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
  const dismissWelcome = usePromptToolkitStore((state) => state.dismissWelcome);
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
      text: t('your prompts'),
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
            {t('Your prompt copilot')}
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
            'Nestor, a cartoon orange fox with a purple scarf and a golden compass star, says: a better prompt, more impact!',
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
        onClick={dismissWelcome}
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
  const dismissWelcome = usePromptToolkitStore((state) => state.dismissWelcome);
  const [isVideoShown, setVideoShown] = useState(() => !prefersReducedMotion());
  const [hasVideoFailed, setVideoFailed] = useState(false);

  if (isVideoShown && !hasVideoFailed) {
    return (
      <NestorIntroVideo
        onDone={dismissWelcome}
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
        width={140}
        height={140}
        style={{ borderRadius: '50%', background: ILLUSTRATION_BACKGROUND }}
      />
      <Box $gap="2px">
        <Text as="h2" $size="h4" $weight="700" $margin="0">
          {t('How can I help you write?')}
        </Text>
        <Text $size="sm" $variation="secondary">
          {t('Nestor, your prompt copilot')}
        </Text>
      </Box>
    </Box>
  );
};

/** What the panel offers, as cards: shown on first opening and after a reset. */
export const PanelHome = () => {
  const { t } = useTranslation();
  const startCoach = usePromptToolkitStore((state) => state.startCoach);
  const openSection = usePromptToolkitStore((state) => state.openSection);
  const coach = (mode: CoachMode) => () => startCoach(mode);
  const hasSeenWelcome = usePromptToolkitStore((state) => state.hasSeenWelcome);
  const isAiUnavailable = useAiUnavailable();
  const isAiAvailable = useAiAvailable();
  const openTool = usePromptToolkitStore((state) => state.openTool);

  // New modules (prompting course, everyday tools…) add a card here.
  const cards: HomeCard[] = [
    {
      id: 'coach-manual',
      image: NESTOR_ANALYSIS_URL,
      icon: 'touch_app',
      tone: 'brand',
      title: t('Prompt coach'),
      description: t('Analyses and improves your prompt.'),
      onSelect: coach('manual'),
    },
    {
      id: 'course',
      image: NESTOR_COURSE_URL,
      icon: 'school',
      tone: 'brand',
      title: t('Prompting course'),
      description: t('Lessons, cards and quizzes.'),
      onSelect: () => openSection('learn'),
    },
    {
      id: 'tools',
      image: NESTOR_TOOLS_URL,
      icon: 'apps',
      tone: 'success',
      title: t('Everyday tools'),
      description: t('Emails, summaries, ready-made prompts.'),
      onSelect: () => openSection('tools'),
    },
  ];

  if (!hasSeenWelcome) {
    return <NestorIntro />;
  }
  // Without the Albert relay, only what works without AI is offered.
  const shownCards = isAiUnavailable
    ? cards.filter((card) => card.id !== 'coach-manual')
    : cards;

  return (
    <Box $gap="12px" $padding={{ all: 'base' }} $css={centeredCss}>
      <NestorHeader />
      {/* Speaking instead of typing: the main entry, shown first. */}
      {isAiAvailable && TRANSCRIPTION_URL && (
        <Box
          as="button"
          type="button"
          onClick={() => openTool('minutes')}
          $direction="row"
          $align="center"
          $gap="14px"
          $css={css`
            ${cardCss('brand')}
            height: auto;
            padding: 14px;
            text-align: left;
          `}
        >
          <img
            src={NESTOR_TRANSCRIPTION_URL}
            alt=""
            width={64}
            height={64}
            style={{
              flex: 'none',
              borderRadius: '50%',
              objectFit: 'cover',
              background: ILLUSTRATION_BACKGROUND,
            }}
          />
          <Box $gap="2px" $css="flex: 1; min-width: 0;">
            <Text $weight="700">{t('Record and transcribe')}</Text>
            <Text $size="sm" $variation="secondary">
              {t(
                'A meeting, an idea, a voice note: the text arrives while you speak.',
              )}
            </Text>
          </Box>
          <Icon iconName="chevron_right" $size="20px" $variation="secondary" />
        </Box>
      )}
      <Box
        as="ul"
        $css={css`
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(112px, 1fr));
          gap: 8px;
          margin: 0;
          padding: 0;
          list-style: none;
        `}
      >
        {shownCards.map((card) => (
          <li key={card.id}>
            <Box
              as="button"
              type="button"
              onClick={card.onSelect}
              $align="center"
              $gap="8px"
              $css={css`
                ${cardCss(card.tone)}
                justify-content: flex-start;
                text-align: center;
              `}
            >
              <img
                src={card.image}
                alt=""
                width={64}
                height={64}
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
        ))}
      </Box>
      <ProfileSettings />
    </Box>
  );
};
