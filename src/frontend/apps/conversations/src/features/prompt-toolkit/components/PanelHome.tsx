import { Button } from '@gouvfr-lasuite/cunningham-react';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon, Text } from '@/components';

import { useAiAvailable } from '../coach/aiAvailability';
import {
  CoachMode,
  usePromptToolkitStore,
} from '../stores/usePromptToolkitStore';

import { RobinIntroVideo, prefersReducedMotion } from './RobinIntroVideo';

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
  padding: 14px;
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

export const ROBIN_IMAGE_URL = '/assets/robin.webp';
export const ROBIN_AVATAR_URL = '/assets/robin-avatar.webp';
/** Robin in each space of the panel, same style as the welcome. */
export const ROBIN_ANALYSIS_URL = '/assets/robin-analyse.webp';
export const ROBIN_HELP_URL = '/assets/robin-aide.webp';
export const ROBIN_HOME_URL = '/assets/robin-accueil.webp';
export const ROBIN_INSTANT_URL = '/assets/robin-volee.webp';
export const ROBIN_COURSE_URL = '/assets/robin-cours.webp';
export const ROBIN_TOOLS_URL = '/assets/robin-outils.webp';
export const ROBIN_WRITE_URL = '/assets/robin-ecrire.webp';
export const ROBIN_SUMMARIZE_URL = '/assets/robin-resumer.webp';
export const ROBIN_ORGANIZE_URL = '/assets/robin-organiser.webp';
export const ROBIN_PROMPTS_URL = '/assets/robin-prompts.webp';
export const ROBIN_LESSONS_URL = '/assets/robin-lecons.webp';
export const ROBIN_CARDS_URL = '/assets/robin-fiches.webp';
export const ROBIN_QUIZ_URL = '/assets/robin-quiz.webp';
export const ROBIN_CHALLENGES_URL = '/assets/robin-defis.webp';
/** Background of the illustration, so it blends into its card. */
const ILLUSTRATION_BACKGROUND = '#f7f8fd';
// Theme colour: readable in light and dark mode.
const ROBIN_NAVY = 'var(--c--contextuals--content--semantic--brand--primary)';

const valueBadgeCss = (color: string) => css`
  flex: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  color: white;
  background: ${color};
`;

/** Robin's welcome, without motion: who Robin is and what it does. */
const RobinWelcome = ({ onWatch }: { onWatch?: () => void }) => {
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
              color: ${ROBIN_NAVY};
            `}
          >
            Robin
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
          src={ROBIN_IMAGE_URL}
          alt={t(
            'Robin, a robin wearing glasses and headphones, says: a better prompt, more impact!',
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
              <Text $weight="700" $css={`color: ${ROBIN_NAVY};`}>
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
 * Robin's welcome, shown once: the presentation video, or the still welcome
 * when motion is reduced or the video cannot play.
 */
const RobinIntro = () => {
  const dismissWelcome = usePromptToolkitStore((state) => state.dismissWelcome);
  const [isVideoShown, setVideoShown] = useState(() => !prefersReducedMotion());
  const [hasVideoFailed, setVideoFailed] = useState(false);

  if (isVideoShown && !hasVideoFailed) {
    return (
      <RobinIntroVideo
        onDone={dismissWelcome}
        onError={() => setVideoFailed(true)}
      />
    );
  }
  return (
    <RobinWelcome
      onWatch={hasVideoFailed ? undefined : () => setVideoShown(true)}
    />
  );
};

/** Header of the cards page: Robin, large, then the question. */
const RobinHeader = () => {
  const { t } = useTranslation();
  return (
    <Box $align="center" $gap="10px" $css="text-align: center;">
      <img
        src={ROBIN_HOME_URL}
        alt=""
        width={180}
        height={180}
        style={{ borderRadius: '50%', background: ILLUSTRATION_BACKGROUND }}
      />
      <Box $gap="2px">
        <Text as="h2" $size="h4" $weight="700" $margin="0">
          {t('How can I help you write?')}
        </Text>
        <Text $size="sm" $variation="secondary">
          {t('Robin, your prompt copilot')}
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
  const isAiAvailable = useAiAvailable();

  // New modules (prompting course, everyday tools…) add a card here.
  const cards: HomeCard[] = [
    {
      id: 'coach-manual',
      image: ROBIN_ANALYSIS_URL,
      icon: 'touch_app',
      tone: 'brand',
      title: t('Prompt coach'),
      description: t(
        'Analysis, prompt help with versions, or suggestions as you type.',
      ),
      onSelect: coach('manual'),
    },
    {
      id: 'course',
      image: ROBIN_COURSE_URL,
      icon: 'school',
      tone: 'brand',
      title: t('Prompting course'),
      description: t(
        'Short lessons, review cards and quizzes to learn at your own pace.',
      ),
      onSelect: () => openSection('learn'),
    },
    {
      id: 'tools',
      image: ROBIN_TOOLS_URL,
      icon: 'apps',
      tone: 'success',
      title: t('Everyday tools'),
      description: t(
        'Reply to an email, meeting minutes, summary, translation… prepared for you.',
      ),
      onSelect: () => openSection('tools'),
    },
  ];

  if (!hasSeenWelcome) {
    return <RobinIntro />;
  }
  // Without the Albert relay, only what works without AI is offered.
  const shownCards = isAiAvailable
    ? cards
    : cards.filter((card) => card.id !== 'coach-manual');

  return (
    <Box $gap="12px" $padding={{ all: 'base' }} $css={centeredCss}>
      <RobinHeader />
      <Box as="ul" $gap="8px" $css="margin: 0; padding: 0; list-style: none;">
        {shownCards.map((card) => (
          <li key={card.id}>
            <Box
              as="button"
              type="button"
              onClick={card.onSelect}
              $direction="row"
              $align="center"
              $gap="12px"
              $css={cardCss(card.tone)}
            >
              <img
                src={card.image}
                alt=""
                width={56}
                height={56}
                style={{
                  flex: 'none',
                  borderRadius: '50%',
                  objectFit: 'cover',
                  background: ILLUSTRATION_BACKGROUND,
                }}
              />
              <Box $gap="2px" $css="flex: 1; min-width: 0;">
                <Text $weight="700">{card.title}</Text>
                <Text $size="sm" $variation="secondary">
                  {card.description}
                </Text>
              </Box>
              <Icon
                iconName="chevron_right"
                $size="20px"
                $variation="secondary"
              />
            </Box>
          </li>
        ))}
      </Box>
    </Box>
  );
};
