import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon } from '@/components';

import { NESTOR_AVATAR_URL } from '../components/PanelHome';

import type { BarAction } from './types';
import type { NestorChat } from './useNestorChat';

const barCss = css`
  position: sticky;
  bottom: 0;
  z-index: 2;
  display: flex;
  justify-content: center;
  gap: 10px;
  padding: 10px 12px calc(10px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--c--contextuals--border--surface--primary);
  background: var(--c--contextuals--background--surface--primary);
`;
const itemCss = css`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  width: 84px;
  padding: 0;
  border: none;
  background: none;
  cursor: pointer;
  font: inherit;
  font-size: 0.75rem;
  line-height: 1.2;
  text-align: center;
  & > span:first-child {
    display: grid;
    place-items: center;
    width: 48px;
    height: 48px;
    border-radius: 50%;
    overflow: hidden;
    color: #fff;
    background: var(--c--contextuals--background--semantic--brand--primary);
  }
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 2px;
  }
`;

/** Always the same four buttons, same order, same place, never greyed. */
export const NestorBar = ({ chat }: { chat: NestorChat }) => {
  const { t } = useTranslation();
  const items: { action: BarAction; label: string; icon: string }[] = [
    { action: 'analyse', label: t('Analyse my text'), icon: 'grading' },
    { action: 'improve', label: t('Improve my text'), icon: 'auto_fix_high' },
    { action: 'review', label: t('Do the review'), icon: 'flag' },
    { action: 'ask', label: t('Ask Nestor'), icon: '' },
  ];
  return (
    <Box role="toolbar" aria-label={t('Nestor’s buttons')} $css={barCss}>
      {items.map((item) => (
        <Box
          as="button"
          type="button"
          key={item.action}
          aria-busy={chat.busy === item.action}
          onClick={() => chat.runBar(item.action)}
          $css={css`
            ${itemCss}${item.action === 'ask' ? 'margin-left: 8px; padding-left: 10px; border-left: 1px solid var(--c--contextuals--border--surface--primary);' : ''}
          `}
        >
          <span>
            {item.action === 'ask' ? (
              <img src={NESTOR_AVATAR_URL} alt="" width={48} height={48} />
            ) : (
              <Icon iconName={item.icon} $size="24px" $withThemeInherited />
            )}
          </span>
          <span>{item.label}</span>
        </Box>
      ))}
    </Box>
  );
};
