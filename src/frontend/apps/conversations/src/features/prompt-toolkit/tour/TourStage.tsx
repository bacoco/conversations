import { useEffect, useLayoutEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import styled, { createGlobalStyle, css, keyframes } from 'styled-components';

import { Icon } from '@/components';

import { NESTOR_AVATAR_URL } from '../chat/avatar';
import { barLabel } from '../chat/labels';
import type { BarAction } from '../chat/types';
import { C } from '../chat/ui';
import { startDemo, useDemoStore } from '../stores/useDemoStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';
import { endTour, useTourStore } from '../stores/useTourStore';

import { TOUR_STEPS } from './tourScript';

const FLASH = 'nestor-tour-flash';
/** How long an element is looked for: the page may still be appearing. */
const LOOK_EVERY_MS = 200;
const LOOK_TRIES = 6;
const WAITING = 'nestor-tour-waiting';

/** The flash on the real element Nestor speaks of. */
const FlashStyle = createGlobalStyle`
  /* The whole card lights up, then fades: it flashes, it is seen. */
  @keyframes nestorTourFlash {
    0%, 100% {
      box-shadow: 0 0 0 0 rgba(232, 162, 0, 0),
        inset 0 0 0 999px rgba(255, 196, 0, 0);
    }
    40% {
      box-shadow: 0 0 0 10px rgba(232, 162, 0, 0.45),
        inset 0 0 0 999px rgba(255, 196, 0, 0.35);
    }
  }
  .${FLASH} {
    outline: 3px solid #e8a200 !important;
    outline-offset: 3px;
    animation: nestorTourFlash 0.8s ease-in-out 4;
  }
  .${FLASH}.${WAITING} {
    animation-iteration-count: infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    .${FLASH} { animation: none; }
  }
`;

/** The real element named by a step, on the page. */
const findTarget = (name: string) =>
  name === 'field'
    ? document.querySelector<HTMLElement>('textarea[name="inputchat-textarea"]')
    : document.querySelector<HTMLElement>(`[data-tour="${name}"]`);

/** Nestor's voice, when the browser has one: he reads what he says. */
/**
 * Nestor's own voice, recorded once per step (French only; light MP3 here,
 * their manifest in .media/audio/voice at the repository root).
 */
export const recordedVoiceUrl = (stepId: string, language?: string) =>
  language?.startsWith('fr')
    ? `${import.meta.env.BASE_URL}assets/nestor-voice/${stepId}.mp3`
    : null;

let playing: HTMLAudioElement | null = null;

/** The browser's voice, when there is no recording or it cannot play. */
const speakWithBrowser = (text: string) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const voice = new SpeechSynthesisUtterance(text);
  voice.lang = 'fr-FR';
  window.speechSynthesis.speak(voice);
};

const speak = (text: string, recording: string | null) => {
  hush();
  if (!recording || typeof Audio === 'undefined') {
    speakWithBrowser(text);
    return;
  }
  const audio = new Audio(recording);
  playing = audio;
  audio.play()?.catch(() => {
    if (playing === audio) speakWithBrowser(text);
  });
};

const hush = () => {
  playing?.pause();
  playing = null;
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

const bob = keyframes`
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-6px) rotate(-2deg); }
`;

/** Over the conversation, left of the panel: Nestor, large, speaking. */
/** Between the Assistant's left menu and Nestor's panel: both stay seen. */
const Stage = styled.div`
  position: fixed;
  top: 0;
  bottom: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  background: rgba(20, 20, 40, 0.28);
`;

/** One size for every step: nothing jumps, the buttons never move. */
const Card = styled.div`
  pointer-events: auto;
  width: min(900px, 100%);
  height: min(620px, calc(100vh - 48px));
  display: flex;
  flex-direction: column;
  border-radius: 20px;
  background: #ffffff;
  border: 1px solid ${C.brandLine};
  box-shadow: 0 18px 50px rgba(30, 30, 70, 0.22);
  overflow: hidden;
`;

/** The picture, Nestor's words, the hint: what changes from step to step. */
const Body = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px 28px 12px;
  text-align: center;
`;

/** Always the same height, whatever the picture. */
const Media = styled.div`
  flex: none;
  height: 160px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

/** The same buttons at the same places on every step. */
const Footer = styled.div`
  flex: none;
  display: grid;
  grid-template-columns: auto auto 1fr auto auto;
  align-items: center;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid ${C.grey};
  & button {
    font: inherit;
    font-size: 15px;
    font-weight: 700;
    border-radius: 999px;
    padding: 8px 16px;
    cursor: pointer;
    border: 1px solid ${C.brandLine};
    background: #ffffff;
    color: ${C.brandInk};
    white-space: nowrap;
  }
  & button[data-primary='true'] {
    min-width: 120px;
    background: ${C.brand};
    border-color: ${C.brand};
    color: #ffffff;
  }
  & button:disabled {
    cursor: default;
    opacity: 0.45;
  }
  & small {
    grid-column: 4;
    color: ${C.muted};
    font-size: 13px;
    white-space: nowrap;
  }
  @media (max-width: 520px) {
    grid-template-columns: 1fr 1fr;
    & small {
      grid-column: auto;
    }
  }
`;

const FilmLink = styled.button`
  font: inherit;
  font-size: 15px;
  font-weight: 700;
  color: ${C.brandInk};
  background: none;
  border: none;
  text-decoration: underline;
  cursor: pointer;
`;

const Film = styled.video`
  display: block;
  width: 100%;
  max-height: 100%;
  aspect-ratio: 16 / 9;
  border-radius: 12px;
  background: ${C.soft};
`;

/** The presentation film, under the site's path (/nestor-chat/ on dev). */
export const PRESENTATION_VIDEO_URL = `${import.meta.env.BASE_URL}assets/nestor-presentation-fr.mp4`;
export const PRESENTATION_POSTER_URL = `${import.meta.env.BASE_URL}assets/nestor-presentation-fr.jpg`;

const Face = styled.img<{ $talking: boolean }>`
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: ${C.soft};
  ${({ $talking }) =>
    $talking &&
    css`
      animation: ${bob} 1.1s ease-in-out infinite;
    `}
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

/** The card's own Nestor, as on the home page, large. */
const Picture = styled(Face)`
  width: 150px;
  height: 150px;
  border: 3px solid #e8a200;
`;

/** Nestor speaking: his small face, then his words. */
const Speech = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  text-align: left;
`;

const SmallFace = styled(Face)`
  flex: none;
  width: 44px;
  height: 44px;
`;

const ButtonPicture = styled.span`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 700;
  color: ${C.ink};
  & > span {
    width: 76px;
    height: 76px;
    border-radius: 50%;
    display: grid;
    place-items: center;
    border: 3px solid #e8a200;
    background: #ffffff;
    color: ${C.brand};
  }
  & img {
    width: 76px;
    height: 76px;
    border-radius: 50%;
  }
`;

/** A button of the bar as it looks at the bottom of the coach, large. */
const BarButtonPicture = ({ action }: { action: BarAction }) => {
  const { t } = useTranslation();
  const label = barLabel(t, action);
  return (
    <ButtonPicture role="img" aria-label={label}>
      {action === 'ask' ? (
        <img src={NESTOR_AVATAR_URL} alt="" />
      ) : (
        <span>
          <Icon iconName={BAR_ICONS[action]} $size="38px" $withThemeInherited />
        </span>
      )}
      <span aria-hidden="true" style={{ all: 'unset' }}>
        {label}
      </span>
    </ButtonPicture>
  );
};

const BAR_ICONS: Record<Exclude<BarAction, 'ask'>, string> = {
  analyse: 'search',
  improve: 'auto_awesome',
  review: 'show_chart',
};

const Words = styled.p`
  margin: 0;
  font-size: 19px;
  line-height: 1.5;
  color: ${C.ink};
`;

const Hint = styled.p`
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  color: #8a3a00;
`;

/** How far the panel leaves room on the right of the screen. */
const usePanelRoom = () => {
  const [room, setRoom] = useState({ left: 0, right: 0 });
  useLayoutEffect(() => {
    const measure = () => {
      const panel = findTarget('panel');
      const panelLeft =
        panel?.getBoundingClientRect().left ?? window.innerWidth;
      // The Assistant's left menu, when it is open on a large screen.
      const menuRight =
        document
          .querySelector<HTMLElement>('[data-testid="left-panel-desktop"]')
          ?.getBoundingClientRect().right ?? 0;
      // A phone: the panel takes the screen, Nestor speaks over it.
      const right = panelLeft < 360 ? 0 : window.innerWidth - panelLeft;
      const left = window.innerWidth - right - menuRight >= 480 ? menuRight : 0;
      setRoom({ left, right });
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  return room;
};

/**
 * The guided tour: Nestor, in the middle, says what each part is for; the
 * real element flashes on the right. Some steps ask for a click on it, and
 * go on once it is done.
 */
export const TourStage = () => {
  const { t, i18n } = useTranslation();
  const active = useTourStore((state) => state.active);
  const index = useTourStore((state) => state.index);
  const next = useTourStore((state) => state.next);
  const step = active ? TOUR_STEPS[index] : undefined;
  const [voiceOn, setVoiceOn] = useState(true);
  // The window opens on the film, still; it plays only when asked.
  const film = useTourStore((state) => state.onFilm);
  const takeTour = useTourStore((state) => state.takeTour);
  const showFilm = useTourStore((state) => state.showFilm);
  const [filmFailed, setFilmFailed] = useState(false);
  const room = usePanelRoom();
  const coachOpen = usePromptToolkitStore(
    (state) =>
      state.mode === 'coach' && !state.showHome && !state.showFavorites,
  );
  const demoDone = useDemoStore((state) => state.done);
  const words = step ? t(step.say) : '';

  // The element spoken of flashes. The page may still be appearing (the
  // home page after the coach): it is looked for a moment; a card that
  // never shows is passed.
  useEffect(() => {
    if (!step?.target) return;
    const target = step.target;
    let element: HTMLElement | null = null;
    let tries = 0;
    let timer = 0;
    const flash = () => {
      element = findTarget(target);
      if (element) {
        element.classList.add(FLASH);
        if (step.wait) element.classList.add(WAITING);
        element.scrollIntoView?.({ block: 'nearest' });
        return;
      }
      tries += 1;
      if (tries <= LOOK_TRIES) {
        timer = window.setTimeout(flash, LOOK_EVERY_MS);
      } else if (step.optional) {
        next();
      }
    };
    flash();
    return () => {
      window.clearTimeout(timer);
      element?.classList.remove(FLASH, WAITING);
    };
  }, [step, next]);

  // A click asked for: the tour goes on once it is done.
  useEffect(() => {
    if (step?.wait === 'coach-open' && coachOpen) {
      startDemo();
      next();
    }
    if (
      (step?.wait === 'analyse' || step?.wait === 'improve') &&
      demoDone.includes(step.wait)
    ) {
      next();
    }
  }, [step, coachOpen, demoDone, next]);

  useEffect(() => {
    if (words && voiceOn && !film && step) {
      speak(words, recordedVoiceUrl(step.id, i18n.language));
    }
    return hush;
  }, [words, voiceOn, film, step, i18n.language]);

  if (!step) return null;
  return createPortal(
    <>
      <FlashStyle />
      {/* A click outside the window closes it. */}
      <Stage
        style={{ left: room.left, right: room.right }}
        data-testid="tour-backdrop"
        onClick={(event) => {
          if (event.target === event.currentTarget) endTour();
        }}
      >
        <Card role="dialog" aria-label={t('Tour of Nestor')} aria-live="polite">
          <Body>
            {film ? (
              filmFailed ? (
                <Words>{t('The presentation cannot be played here.')}</Words>
              ) : (
                <Film
                  aria-label={t('Presentation of Nestor')}
                  src={PRESENTATION_VIDEO_URL}
                  poster={PRESENTATION_POSTER_URL}
                  controls
                  playsInline
                  preload="metadata"
                  onError={() => setFilmFailed(true)}
                />
              )
            ) : (
              <>
                <Media>
                  {step.picture?.kind === 'card' ? (
                    <Picture
                      src={step.picture.src}
                      alt={t(step.picture.label)}
                      $talking={false}
                    />
                  ) : step.picture?.kind === 'button' ? (
                    <BarButtonPicture action={step.picture.action} />
                  ) : (
                    <Face src={NESTOR_AVATAR_URL} alt="" $talking={voiceOn} />
                  )}
                </Media>
                <Speech>
                  {step.picture && (
                    <SmallFace
                      src={NESTOR_AVATAR_URL}
                      alt=""
                      $talking={voiceOn}
                    />
                  )}
                  <Words>{words}</Words>
                </Speech>
                {step.wait && (
                  <Hint>{t('Click on what is flashing, on the right →')}</Hint>
                )}
                {index === 0 && (
                  <FilmLink
                    type="button"
                    onClick={() => {
                      hush();
                      setFilmFailed(false);
                      showFilm();
                    }}
                  >
                    {t('Watch the film instead (3 min)')}
                  </FilmLink>
                )}
              </>
            )}
          </Body>
          <Footer>
            <button type="button" onClick={endTour}>
              {film ? t('Close') : t('Skip the tour')}
            </button>
            {film ? (
              <span />
            ) : (
              <button
                type="button"
                aria-pressed={voiceOn}
                onClick={() => setVoiceOn((on) => !on)}
              >
                {voiceOn ? t('Sound: on') : t('Sound: off')}
              </button>
            )}
            <small>
              {film
                ? ''
                : t('{{n}} of {{total}}', {
                    n: index + 1,
                    total: TOUR_STEPS.length,
                  })}
            </small>
            {film ? (
              <button type="button" data-primary="true" onClick={takeTour}>
                {t('Take the tour')}
              </button>
            ) : (
              <button
                type="button"
                data-primary="true"
                // Greyed while Nestor waits for a click on the right.
                disabled={!!step.wait}
                onClick={next}
              >
                {index === TOUR_STEPS.length - 1 ? t('Finish') : t('Next')}
              </button>
            )}
          </Footer>
        </Card>
      </Stage>
    </>,
    document.body,
  );
};
