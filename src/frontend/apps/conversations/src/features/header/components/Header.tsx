import { Button } from '@gouvfr-lasuite/cunningham-react';
import {
  Suspense,
  useEffect as _useEffect,
  useState as _useState,
  lazy,
} from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router';
import { css } from 'styled-components';

import NewChatIcon from '@/assets/icons/new-message-bold.svg?react';
import LogoAssistant from '@/assets/logo/logomark.svg?react';
import { Box } from '@/components/';
import { useCunninghamTheme } from '@/cunningham';
import { useChatScroll } from '@/features/chat/hooks';
import { useChatPreferencesStore } from '@/features/chat/stores/useChatPreferencesStore';
import {
  RightPanelToggle,
  usePanelWidth,
  usePromptToolkitStore,
} from '@/features/prompt-toolkit';
import { useResponsiveStore } from '@/stores';
import { useConversationRouteId } from '@/utils';

import { HEADER_HEIGHT } from '../conf';

import { ButtonToggleLeftPanel } from './ButtonToggleLeftPanel';
import { LaGaufre } from './LaGaufre';

const UserInfo = lazy(() =>
  import('@/features/auth/components/UserInfo').then((mod) => ({
    default: mod.UserInfo,
  })),
);

const headerStyles = css`
  display: flex;
  position: absolute;
  top: 0;
  right: 0;
  z-index: 1000;
  width: 100%;
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
`;

export const Header = () => {
  const { t } = useTranslation();
  const { spacingsTokens, componentTokens } = useCunninghamTheme();
  const showLaGaufre =
    (componentTokens as Record<string, unknown>)['la-gaufre'] === true;
  const { isDesktop } = useResponsiveStore();
  const { setPanelOpen, isSourcesPanelOpen } = useChatPreferencesStore();
  const { isOpen: isRightPanelOpen, isResizing } = usePromptToolkitStore();
  const rightPanelWidth = usePanelWidth();
  // The right panel opens under the header: span over it so the account
  // menu keeps its place at the right edge of the screen.
  const rightPanelOverlap =
    isDesktop && isRightPanelOpen && !isSourcesPanelOpen ? rightPanelWidth : 0;
  const { isAtTop } = useChatScroll();
  const navigate = useNavigate();
  const hasConversationIdInRoute = !!useConversationRouteId();

  return (
    <Box
      as="header"
      $css={headerStyles}
      style={{
        height: `${HEADER_HEIGHT}px`,
        right: `-${rightPanelOverlap}px`,
        width: `calc(100% + ${rightPanelOverlap}px)`,
        transition: isResizing ? 'none' : 'right 0.3s ease, width 0.3s ease',
        padding: `${isDesktop ? '0' : '12px'} ${spacingsTokens['base']}`,
        background: `${
          isAtTop
            ? ''
            : 'linear-gradient(180deg, color-mix(in srgb, var(--c--contextuals--background--surface--primary) 75%, transparent) 0%, transparent 100%)'
        }`,
        backdropFilter: `${isAtTop ? 'blur(0px)' : 'blur(0.8px)'}`,
      }}
    >
      {!isDesktop && (
        <Box className="selector-header">
          <ButtonToggleLeftPanel />
        </Box>
      )}
      <Box
        $align="center"
        className="container"
        $gap={spacingsTokens['xs']}
        $direction="row"
        $position="relative"
        $height="fit-content"
        $flex={isDesktop ? undefined : '1'}
        $justify={isDesktop ? undefined : 'center'}
      >
        {isDesktop && (
          <Box className="selector-header">
            <ButtonToggleLeftPanel />
          </Box>
        )}
        {!isDesktop && !hasConversationIdInRoute && (
          <LogoAssistant height="32px" width="auto" />
        )}
      </Box>
      {!isDesktop ? (
        <Box $direction="row" $gap={spacingsTokens['sm']} $align="center">
          <Box className="selector-header">
            <RightPanelToggle />
          </Box>
          <Box className="selector-header">
            <Button
              size="small"
              onClick={() => {
                void navigate('/');
                setPanelOpen(false);
              }}
              className="mobile-no-focus"
              aria-label={t('New chat')}
              color="brand"
              variant="tertiary"
              icon={<NewChatIcon height="24px" />}
            />
          </Box>
        </Box>
      ) : (
        <Box $align="center" $direction="column">
          <Box
            $direction="row"
            $gap="4px"
            className="selector-header"
            data-header-account-tools
          >
            <RightPanelToggle />
            {showLaGaufre && <LaGaufre />}
            <Suspense fallback={null}>
              <UserInfo />
            </Suspense>
          </Box>
        </Box>
      )}
    </Box>
  );
};
