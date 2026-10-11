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

/**
 * The actions of a screen, the main one last. In a course frame they go to
 * its bar at the bottom of the panel, at the same place from one screen to
 * the next; elsewhere they stay in the flow, on the right.
 */
export const ScreenActions = ({ children }: { children: ReactNode }) => {
  const { inFrame, bar } = useContext(FrameBar);
  if (!inFrame) {
    return (
      <Box
        $direction="row"
        $gap="8px"
        $justify="flex-end"
        $css="flex-wrap: wrap;"
      >
        {children}
      </Box>
    );
  }
  return bar ? createPortal(children, bar) : null;
};

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

/** Wide enough to compare two requests, short enough to read a line. */
const COLUMN_CSS = css`
  width: 100%;
  max-width: 760px;
  margin-inline: auto;
  box-sizing: border-box;
`;

/**
 * A screen of the course that stays put: where you are on top, the content
 * in the middle, and at the bottom of the panel a bar with the way out on
 * the left and the main action on the right. The bar does not move from one
 * screen to the next; the content, when long, scrolls above it.
 */
export const CourseFrame = ({
  top,
  exit,
  children,
}: {
  top: ReactNode;
  /** The way out, on the left of the bar. */
  exit?: ReactNode;
  children: ReactNode;
}) => {
  const [bar, setBar] = useState<HTMLElement | null>(null);
  const setActionBarShown = usePromptToolkitStore(
    (state) => state.setActionBarShown,
  );
  const isShown = useIsSpaceShown('learn');
  // Nestor's round button moves above the bar while it is on screen.
  useEffect(() => {
    if (!isShown) {
      return;
    }
    setActionBarShown(true);
    return () => setActionBarShown(false);
  }, [isShown, setActionBarShown]);

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
          padding: 14px 24px 0;
          @media (max-width: 480px) {
            padding-inline: 16px;
          }
        `}
      >
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
        $css={css`
          position: sticky;
          bottom: 0;
          z-index: 2;
          padding: 12px 24px;
          border-top: 1px solid var(--c--contextuals--border--surface--primary);
          background: var(--c--contextuals--background--surface--primary);
          @media (max-width: 480px) {
            padding-inline: 16px;
          }
        `}
      >
        <Box
          $direction="row"
          $align="center"
          $gap="8px"
          $css={css`
            ${COLUMN_CSS}
            min-height: 40px;
          `}
        >
          {exit}
          <Box
            ref={setBar}
            $direction="row"
            $align="center"
            $gap="8px"
            $css={css`
              margin-left: auto;
              /* The main action keeps its width from one screen to the next. */
              & > button:last-child {
                min-width: min(220px, 45vw);
                justify-content: center;
              }
            `}
          />
        </Box>
      </Box>
    </Box>
  );
};
