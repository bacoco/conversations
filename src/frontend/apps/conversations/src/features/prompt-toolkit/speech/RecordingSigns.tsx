import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { css, keyframes } from 'styled-components';

import { Box } from '@/components';

/**
 * What shows that the microphone records: the red button that pulses, the
 * time, and bars that follow the voice. The same everywhere one speaks.
 */
export const RECORD_RED = '#d0342c';
const WAVE_BARS = 28;

export const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(208, 52, 44, 0.45); }
  100% { box-shadow: 0 0 0 14px rgba(208, 52, 44, 0); }
`;

export const formatTime = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(
    seconds % 60,
  ).padStart(2, '0')}`;

/** Bars that follow the microphone level while recording. */
export const Wave = ({ readLevel }: { readLevel: () => number }) => {
  const { t } = useTranslation();
  const barsRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let timer = 0;
    let isStopped = false;
    const history = new Array<number>(WAVE_BARS).fill(0);
    const draw = () => {
      if (isStopped) return;
      history.shift();
      history.push(readLevel());
      barsRef.current?.childNodes.forEach((bar, index) => {
        (bar as HTMLElement).style.height = `${4 + history[index] * 28}px`;
      });
      timer = window.setTimeout(() => requestAnimationFrame(draw), 90);
    };
    draw();
    return () => {
      isStopped = true;
      window.clearTimeout(timer);
    };
  }, [readLevel]);

  return (
    <Box
      ref={barsRef}
      role="img"
      aria-label={t('Your voice')}
      $direction="row"
      $align="center"
      $gap="3px"
      $css="height: 32px;"
    >
      {Array.from({ length: WAVE_BARS }, (_, index) => (
        <Box
          key={index}
          $css={css`
            width: 4px;
            height: 4px;
            border-radius: 2px;
            background: ${RECORD_RED};
            transition: height 0.1s ease;
          `}
        />
      ))}
    </Box>
  );
};

/** While recording: the time and the bars, side by side. */
export const Listening = ({
  seconds,
  readLevel,
}: {
  seconds: number;
  readLevel: () => number;
}) => (
  <Box $direction="row" $align="center" $justify="center" $gap="10px">
    <Box
      as="span"
      $css={css`
        font-variant-numeric: tabular-nums;
        font-weight: 600;
        color: ${RECORD_RED};
      `}
    >
      {formatTime(seconds)}
    </Box>
    <Wave readLevel={readLevel} />
  </Box>
);
