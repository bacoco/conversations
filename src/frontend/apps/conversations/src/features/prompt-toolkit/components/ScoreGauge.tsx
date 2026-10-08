import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box } from '@/components';

import { levelColor } from '../coach/levels';

const SIZE = 84;
const STROKE = 7;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const ScoreGauge = ({ score }: { score: number }) => {
  const { t } = useTranslation();
  const color = levelColor(score);

  return (
    <Box
      role="img"
      aria-label={t('Prompt score: {{score}} out of 100', { score })}
      $css={css`
        position: relative;
        flex: none;
        width: ${SIZE}px;
        height: ${SIZE}px;
      `}
    >
      <svg width={SIZE} height={SIZE} aria-hidden="true">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke="var(--c--contextuals--border--surface--primary)"
          strokeWidth={STROKE}
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - score / 100)}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
          style={{
            transition: 'stroke-dashoffset 0.6s ease, stroke 0.6s ease',
          }}
        />
      </svg>
      <Box
        aria-hidden="true"
        $align="center"
        $justify="center"
        $css={css`
          position: absolute;
          inset: 0;
          font-variant-numeric: tabular-nums;
          line-height: 1;
        `}
      >
        <span style={{ fontSize: '1.75rem', fontWeight: 700, color }}>
          {score}
        </span>
        <span
          style={{
            fontSize: '0.6875rem',
            color:
              'var(--c--contextuals--content--semantic--neutral--secondary)',
          }}
        >
          /100
        </span>
      </Box>
    </Box>
  );
};
