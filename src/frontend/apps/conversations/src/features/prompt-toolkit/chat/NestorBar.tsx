import { useTranslation } from 'react-i18next';

import { Icon } from '@/components';

import { NESTOR_AVATAR_URL } from '../components/PanelHome';

import { barLabel } from './labels';
import type { BarAction } from './types';
import { Dock, DockDivider, FaceRound, RoundButton } from './ui';
import type { NestorChat } from './useNestorChat';

/** Always the same four buttons, same order, same place, never greyed. */
export const NestorBar = ({ chat }: { chat: NestorChat }) => {
  const { t } = useTranslation();
  const items: { action: BarAction; label: string; icon: string }[] = [
    { action: 'analyse', label: barLabel(t, 'analyse'), icon: 'search' },
    { action: 'improve', label: barLabel(t, 'improve'), icon: 'auto_awesome' },
    { action: 'review', label: barLabel(t, 'review'), icon: 'show_chart' },
  ];
  return (
    <Dock role="toolbar" aria-label={t('Nestor’s buttons')}>
      {items.map((item) => (
        <RoundButton
          key={item.action}
          type="button"
          $size="bar"
          aria-busy={chat.busy === item.action}
          onClick={() => chat.runBar(item.action)}
        >
          <span>
            <Icon iconName={item.icon} $size="22px" $withThemeInherited />
          </span>
          {item.label}
        </RoundButton>
      ))}
      <DockDivider />
      <RoundButton type="button" $size="bar" onClick={() => chat.runBar('ask')}>
        <FaceRound>
          <img src={NESTOR_AVATAR_URL} alt="" />
        </FaceRound>
        {barLabel(t, 'ask')}
      </RoundButton>
    </Dock>
  );
};
