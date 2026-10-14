import { useTranslation } from 'react-i18next';
import styled, { keyframes } from 'styled-components';

import { Icon } from '@/components';

import { NESTOR_AVATAR_URL } from './avatar';
import { barLabel } from './labels';
import type { BarAction } from './types';
import { Dock, DockDivider, FaceRound, RoundButton } from './ui';
import type { NestorChat } from './useNestorChat';

const pulse = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(232, 162, 0, 0.7); }
  100% { box-shadow: 0 0 0 12px rgba(232, 162, 0, 0); }
`;

/** The demo's ring: the next button to try. */
const Bar = styled(Dock)`
  & [data-next='true'] > span:first-child {
    outline: 3px solid #e8a200;
    outline-offset: 2px;
    animation: ${pulse} 1.4s infinite;
  }
  @media (prefers-reduced-motion: reduce) {
    & [data-next='true'] > span:first-child {
      animation: none;
    }
  }
`;

/** Always the same four buttons, same order, same place, never greyed. */
export const NestorBar = ({
  chat,
  highlight,
  onBar,
}: {
  chat: NestorChat;
  /** The demo: the button to try next wears a ring. */
  highlight?: BarAction;
  /** The demo: told of each click, before the button does its work. */
  onBar?: (action: BarAction) => void;
}) => {
  const { t } = useTranslation();
  const items: { action: BarAction; label: string; icon: string }[] = [
    { action: 'analyse', label: barLabel(t, 'analyse'), icon: 'search' },
    { action: 'improve', label: barLabel(t, 'improve'), icon: 'auto_awesome' },
    { action: 'review', label: barLabel(t, 'review'), icon: 'show_chart' },
  ];
  return (
    <Bar role="toolbar" aria-label={t('Nestor’s buttons')} data-tour="bar">
      {items.map((item) => (
        <RoundButton
          key={item.action}
          type="button"
          $size="bar"
          aria-busy={chat.busy === item.action}
          data-next={highlight === item.action || undefined}
          data-tour={`bar-${item.action}`}
          onClick={() => {
            onBar?.(item.action);
            chat.runBar(item.action);
          }}
        >
          <span>
            <Icon iconName={item.icon} $size="22px" $withThemeInherited />
          </span>
          {item.label}
        </RoundButton>
      ))}
      <DockDivider />
      <RoundButton
        type="button"
        $size="bar"
        data-next={highlight === 'ask' || undefined}
        data-tour="bar-ask"
        onClick={() => {
          onBar?.('ask');
          chat.runBar('ask');
        }}
      >
        <FaceRound>
          <img src={NESTOR_AVATAR_URL} alt="" />
        </FaceRound>
        {barLabel(t, 'ask')}
      </RoundButton>
    </Bar>
  );
};
