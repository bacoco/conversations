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
const WAITING = 'nestor-tour-waiting';

/** The flash on the real element Nestor speaks of. */
const FlashStyle = createGlobalStyle`
  @keyframes nestorTourFlash {
    0% { box-shadow: 0 0 0 0 rgba(232, 162, 0, 0.85); }
    100% { box-shadow: 0 0 0 14px rgba(232, 162, 0, 0); }
  }
  .${FLASH} {
    outline: 3px solid #e8a200 !important;
    outline-offset: 3px;
    animation: nestorTourFlash 0.9s ease-out 3;
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
const speak = (text: string) => {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  const voice = new SpeechSynthesisUtterance(text);
  voice.lang = 'fr-FR';
  window.speechSynthesis.speak(voice);
};
const hush = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

const bob = keyframes`
  0%, 100% { transform: translateY(0) rotate(0deg); }
  50% { transform: translateY(-6px) rotate(-2deg); }
`;

/** Over the conversation, left of the panel: Nestor, large, speaking. */
const Stage = styled.div<{ $right: number }>`
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: ${({ $right }) => $right}px;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  pointer-events: none;
`;

const Card = styled.div`
  pointer-events: auto;
  width: min(560px, 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  padding: 24px 28px;
  border-radius: 20px;
  background: #ffffff;
  border: 1px solid ${C.brandLine};
  box-shadow: 0 18px 50px rgba(30, 30, 70, 0.22);
  text-align: center;
`;

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

const Row = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  align-items: center;
  gap: 10px 14px;
  & button {
    font: inherit;
    font-size: 15px;
    font-weight: 700;
    border-radius: 999px;
    padding: 8px 18px;
    cursor: pointer;
    border: 1px solid ${C.brandLine};
    background: #ffffff;
    color: ${C.brandInk};
  }
  & button[data-primary='true'] {
    background: ${C.brand};
    border-color: ${C.brand};
    color: #ffffff;
  }
  & small {
    color: ${C.muted};
    font-size: 13px;
  }
`;

/** How far the panel leaves room on the right of the screen. */
const usePanelRoom = () => {
  const [right, setRight] = useState(0);
  useLayoutEffect(() => {
    const measure = () => {
      const panel = findTarget('panel');
      const left = panel?.getBoundingClientRect().left ?? window.innerWidth;
      // A phone: the panel takes the screen, Nestor speaks over it.
      setRight(left < 360 ? 0 : window.innerWidth - left);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);
  return right;
};

/**
 * The guided tour: Nestor, in the middle, says what each part is for; the
 * real element flashes on the right. Some steps ask for a click on it, and
 * go on once it is done.
 */
export const TourStage = () => {
  const { t } = useTranslation();
  const active = useTourStore((state) => state.active);
  const index = useTourStore((state) => state.index);
  const next = useTourStore((state) => state.next);
  const step = active ? TOUR_STEPS[index] : undefined;
  const [voiceOn, setVoiceOn] = useState(true);
  const right = usePanelRoom();
  const coachOpen = usePromptToolkitStore(
    (state) =>
      state.mode === 'coach' && !state.showHome && !state.showFavorites,
  );
  const demoDone = useDemoStore((state) => state.done);
  const words = step ? t(step.say) : '';

  // The element spoken of flashes; one absent from the screen is passed.
  useEffect(() => {
    if (!step?.target) return;
    const element = findTarget(step.target);
    if (!element) {
      if (step.optional) next();
      return;
    }
    element.classList.add(FLASH);
    if (step.wait) element.classList.add(WAITING);
    element.scrollIntoView?.({ block: 'nearest' });
    return () => element.classList.remove(FLASH, WAITING);
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
    if (words && voiceOn) speak(words);
    return hush;
  }, [words, voiceOn]);

  if (!step) return null;
  return createPortal(
    <>
      <FlashStyle />
      <Stage $right={right}>
        <Card role="dialog" aria-label={t('Tour of Nestor')} aria-live="polite">
          {step.picture?.kind === 'card' && (
            <Picture
              src={step.picture.src}
              alt={t(step.picture.label)}
              $talking={false}
            />
          )}
          {step.picture?.kind === 'button' && (
            <BarButtonPicture action={step.picture.action} />
          )}
          <Speech>
            <SmallFace src={NESTOR_AVATAR_URL} alt="" $talking={voiceOn} />
            <Words>{words}</Words>
          </Speech>
          {step.wait && (
            <Hint>{t('Click on what is flashing, on the right →')}</Hint>
          )}
          <Row>
            {!step.wait && (
              <button type="button" data-primary="true" onClick={next}>
                {index === TOUR_STEPS.length - 1 ? t('Finish') : t('Next')}
              </button>
            )}
            <button type="button" onClick={endTour}>
              {t('Skip the tour')}
            </button>
            <button
              type="button"
              aria-pressed={voiceOn}
              onClick={() => setVoiceOn((on) => !on)}
            >
              {voiceOn ? t('Sound: on') : t('Sound: off')}
            </button>
            <small>
              {t('{{n}} of {{total}}', {
                n: index + 1,
                total: TOUR_STEPS.length,
              })}
            </small>
          </Row>
        </Card>
      </Stage>
    </>,
    document.body,
  );
};
