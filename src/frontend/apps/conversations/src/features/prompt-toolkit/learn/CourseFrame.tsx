import {
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';
import { createPortal } from 'react-dom';
import { css, keyframes } from 'styled-components';

import { Box } from '@/components';

import { useIsSpaceShown } from '../hooks/useRoomyPanel';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

/** The bar of the frame once mounted; being in a frame is known at once. */
const FrameBar = createContext<{ inFrame: boolean; bar: HTMLElement | null }>({
  inFrame: false,
  bar: null,
});

export type Direction = 'forward' | 'back';

const enter = (from: number) => keyframes`
  from {
    opacity: 0;
    transform: translateX(${from}px);
  }
  to {
    opacity: 1;
    transform: none;
  }
`;

/** A screen coming in: from the right going on, from the left going back. */
export const enterCss = (direction: Direction = 'forward') => css`
  animation: ${enter(direction === 'back' ? -32 : 32)} 0.24s ease-out both;
  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const rise = keyframes`
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: none;
  }
`;

/** Wide enough to compare two requests, short enough to read a line. */
const COLUMN_CSS = css`
  width: 100%;
  max-width: 760px;
  margin-inline: auto;
  box-sizing: border-box;
`;

export type BarTone = 'neutral' | 'success' | 'warning';

const barCss = (tone: BarTone) => css`
  padding: 12px 24px;
  border-top: 1px solid
    ${
      tone === 'neutral'
        ? 'var(--c--contextuals--border--surface--primary)'
        : `var(--c--contextuals--border--semantic--${tone}--primary)`
    };
  background: ${
    tone === 'neutral'
      ? 'var(--c--contextuals--background--surface--primary)'
      : `var(--c--contextuals--background--semantic--${tone}--tertiary)`
  };
  transition:
    background 0.2s ease,
    border-color 0.2s ease;
  @media (max-width: 480px) {
    padding-inline: 16px;
  }
  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

/**
 * The actions of a screen. In a course frame they go to the bar at the
 * bottom of the panel: going back or the other choice on the left, going on
 * on the right, always at the same place; the correction of an answer shows
 * in the bar, right above the button that goes on. Elsewhere, in the flow.
 */
export const ScreenActions = ({
  start,
  feedback,
  tone = 'neutral',
  children,
}: {
  /** On the left: going back, or the other choice. */
  start?: ReactNode;
  /** The correction of an answer, above the buttons. */
  feedback?: ReactNode;
  tone?: BarTone;
  /** On the right: what goes on (the main button last). */
  children?: ReactNode;
}) => {
  const { inFrame, bar } = useContext(FrameBar);
  const content = (
    <Box $gap="10px" $css={COLUMN_CSS}>
      {feedback && (
        <Box
          $gap="6px"
          $css={css`
            animation: ${rise} 0.22s ease-out both;
            @media (prefers-reduced-motion: reduce) {
              animation: none;
            }
          `}
        >
          {feedback}
        </Box>
      )}
      <Box
        $direction="row"
        $align="center"
        $gap="8px"
        $css="flex-wrap: wrap; min-height: 40px;"
      >
        <Box $direction="row" $align="center" $gap="8px">
          {start}
        </Box>
        <Box
          $direction="row"
          $align="center"
          $gap="8px"
          $css={css`
            margin-left: auto;
            /* The button that goes on keeps its width from screen to screen. */
            & > button:last-child {
              min-width: min(220px, 45vw);
              justify-content: center;
            }
          `}
        >
          {children}
        </Box>
      </Box>
    </Box>
  );
  if (!inFrame) {
    return tone === 'neutral' ? (
      content
    ) : (
      <Box
        $css={css`
          ${barCss(tone)}
          border-radius: 12px;
        `}
      >
        {content}
      </Box>
    );
  }
  return bar
    ? createPortal(<Box $css={barCss(tone)}>{content}</Box>, bar)
    : null;
};

/**
 * A screen of the course that stays put. On top, the way out on the left
 * and the shortcuts on the right, then where you are; the content in the
 * middle; at the bottom of the panel, the bar of the screen's actions. The
 * bar does not move from one screen to the next; long content scrolls above.
 */
export const CourseFrame = ({
  exit,
  tools,
  top,
  children,
}: {
  /** The way out, on the top left: always at the same place. */
  exit: ReactNode;
  /** Shortcuts on the top right. */
  tools?: ReactNode;
  /** Where you are: title, times of the step. */
  top: ReactNode;
  children: ReactNode;
}) => {
  const [bar, setBar] = useState<HTMLElement | null>(null);
  const setActionBarHeight = usePromptToolkitStore(
    (state) => state.setActionBarHeight,
  );
  const isShown = useIsSpaceShown('learn');
  // Nestor's round button stays above the bar, however tall the bar gets
  // (a correction makes it taller).
  useEffect(() => {
    if (!isShown || !bar) {
      return;
    }
    const measure = () => setActionBarHeight(bar.offsetHeight);
    measure();
    const observer =
      typeof ResizeObserver === 'undefined'
        ? null
        : new ResizeObserver(measure);
    observer?.observe(bar);
    return () => {
      observer?.disconnect();
      setActionBarHeight(0);
    };
  }, [isShown, bar, setActionBarHeight]);

  return (
    <Box
      data-frame="course"
      $css={css`
        flex: 1 0 auto;
        min-height: 100%;
      `}
    >
      <Box
        $gap="12px"
        $css={css`
          ${COLUMN_CSS}
          padding: 12px 24px 0;
          @media (max-width: 480px) {
            padding-inline: 16px;
          }
        `}
      >
        <Box
          $direction="row"
          $align="center"
          $gap="4px"
          $css={css`
            /* The way out stays in sight when the content scrolls. */
            position: sticky;
            top: 0;
            z-index: 2;
            min-height: 32px;
            margin-inline: -8px;
            padding-block: 4px;
            background: var(--c--contextuals--background--surface--primary);
          `}
        >
          {exit}
          <Box
            $direction="row"
            $align="center"
            $gap="4px"
            $css="margin-left: auto;"
          >
            {tools}
          </Box>
        </Box>
        {top}
      </Box>
      <Box
        $css={css`
          flex: 1 0 auto;
          padding: 18px 24px 28px;
          @media (max-width: 480px) {
            padding-inline: 16px;
          }
        `}
      >
        <Box $css={COLUMN_CSS}>
          <FrameBar.Provider value={{ inFrame: true, bar }}>
            {children}
          </FrameBar.Provider>
        </Box>
      </Box>
      <Box
        ref={setBar}
        $css={css`
          position: sticky;
          bottom: 0;
          z-index: 2;
          &:empty {
            display: none;
          }
        `}
      />
    </Box>
  );
};
