import { PropsWithChildren, useState } from 'react';
import { css } from 'styled-components';

import { Box } from '@/components';
import { useConfig } from '@/core/config';
import { BannerStack, useNewVersionBanner } from '@/features/banner';
import { useAssistantHealth } from '@/features/chat/api/useAssistantHealth';
import { useChatPreferencesStore } from '@/features/chat/stores/useChatPreferencesStore';
import { Header } from '@/features/header';
import { LeftPanel } from '@/features/left-panel';
import {
  RightPanel,
  usePanelWidth,
  usePromptToolkitStore,
} from '@/features/prompt-toolkit';
import { SourcePanel } from '@/features/sources-panel';
import { MAIN_LAYOUT_ID } from '@/layouts/conf';
import { useResponsiveStore } from '@/stores';

const SOURCES_PANEL_WIDTH_PX = 360;

type MainLayoutProps = {
  backgroundColor?: 'white' | 'grey';
};

export function MainLayout({
  children,
  backgroundColor: _backgroundColor = 'white',
}: PropsWithChildren<MainLayoutProps>) {
  const { isDesktop } = useResponsiveStore();
  const { isPanelOpen, isSourcesPanelOpen } = useChatPreferencesStore();
  const { isOpen: isPromptToolkitOpen, isResizing } = usePromptToolkitStore();
  const promptToolkitWidth = usePanelWidth();
  // The sources panel takes precedence: both live on the right side.
  const showPromptToolkit = isPromptToolkitOpen && !isSourcesPanelOpen;
  // Mounted on first opening, then kept so the coach keeps its state.
  const [hasOpenedPromptToolkit, setHasOpenedPromptToolkit] = useState(false);
  if (showPromptToolkit && !hasOpenedPromptToolkit) {
    setHasOpenedPromptToolkit(true);
  }
  const { data: config } = useConfig();
  const { data: assistantHealth } = useAssistantHealth();
  const newVersionBanner = useNewVersionBanner();
  const [sourcesAnchorEl, setSourcesAnchorEl] = useState<HTMLDivElement | null>(
    null,
  );

  const leftPanelOffset = isDesktop && isPanelOpen ? 300 : 0;
  const sourcesPanelOffset =
    isDesktop && isSourcesPanelOpen ? SOURCES_PANEL_WIDTH_PX : 0;
  const promptToolkitOffset =
    isDesktop && showPromptToolkit ? promptToolkitWidth : 0;
  const rightPanelOffset = Math.max(sourcesPanelOffset, promptToolkitOffset);

  return (
    <Box className="--docs--main-layout">
      <Box
        $css={css`
          z-index: 1000;
          transition: left 0.3s ease;
          position: fixed;
          width: 300px;
          left: ${isPanelOpen ? '0px' : '-300px'};
        `}
      >
        <LeftPanel />
      </Box>
      <SourcePanel anchor={sourcesAnchorEl}>
        <Box
          $flex="none"
          className={
            isDesktop && !isPanelOpen
              ? 'main-layout__chat-column--wide'
              : undefined
          }
          $css={css`
            transition: ${isResizing ? 'none' : 'all 0.3s ease'};
            position: fixed;
            left: ${leftPanelOffset}px;
            width: calc(100vw - ${leftPanelOffset}px - ${rightPanelOffset}px);
            min-height: 100dvh;
            /* Next to the right panel, keep a margin around the chat content. */
            ${
              promptToolkitOffset
                ? css`
                    --chat-content-max-width: min(
                      ${
                        isDesktop && !isPanelOpen
                          ? 'calc(var(--chat-content-base) + var(--left-panel-width))'
                          : 'var(--chat-content-base)'
                      },
                      calc(100% - 48px)
                    );
                  `
                : ''
            }
          `}
        >
          <Header />
          <Box
            $align="center"
            $width="100%"
            $padding={{ horizontal: 'base' }}
            $css={css`
              position: absolute;
              top: 12px;
              left: 0;
              z-index: 1001;
              pointer-events: none;
              & > * {
                pointer-events: auto;
              }
            `}
          >
            <BannerStack
              banners={[
                ...(config?.status_banner ? [config.status_banner] : []),
                ...(assistantHealth?.banners ?? []),
                ...(newVersionBanner ? [newVersionBanner] : []),
              ]}
            />
          </Box>
          <Box $direction="row" $width="100%">
            <Box
              as="main"
              id={MAIN_LAYOUT_ID}
              $align="center"
              $width="100%"
              $height="100dvh"
              $css={css`
                overflow-y: auto;
                overflow-x: clip;
              `}
            >
              {children}
            </Box>
          </Box>
          <Box
            ref={setSourcesAnchorEl}
            aria-hidden={!isSourcesPanelOpen}
            className="main-layout__sources-panel-anchor"
            $css={css`
              ${
                isDesktop
                  ? css`
                      position: fixed;
                      top: 0;
                      right: ${
                        isSourcesPanelOpen
                          ? '0px'
                          : `-${SOURCES_PANEL_WIDTH_PX}px`
                      };
                      bottom: 0;
                      z-index: 1001;
                      width: ${SOURCES_PANEL_WIDTH_PX}px;
                    `
                  : css`
                      position: fixed;
                      inset: 0;
                      width: 100%;
                      z-index: 1002;
                    `
              }
              pointer-events: ${isSourcesPanelOpen ? 'auto' : 'none'};
              visibility: ${isSourcesPanelOpen ? 'visible' : 'hidden'};
              transition: right 0.3s ease;
            `}
          />
          <Box
            aria-hidden={!showPromptToolkit}
            className="main-layout__prompt-toolkit"
            $css={css`
              ${
                isDesktop
                  ? css`
                      /* Full height: its tabs share the header row. */
                      position: fixed;
                      top: 0;
                      right: ${
                        showPromptToolkit ? '0px' : `-${promptToolkitWidth}px`
                      };
                      bottom: 0;
                      z-index: 1001;
                      width: ${promptToolkitWidth}px;
                    `
                  : css`
                      position: fixed;
                      inset: 0;
                      width: 100%;
                      z-index: 1002;
                    `
              }
              /* On desktop only the panel's own parts take the clicks, so the
                 header buttons under its transparent top row stay usable. */
              pointer-events: ${showPromptToolkit && !isDesktop ? 'auto' : 'none'};
              visibility: ${showPromptToolkit ? 'visible' : 'hidden'};
              transition: ${isResizing ? 'none' : 'right 0.3s ease'};
            `}
          >
            {hasOpenedPromptToolkit && (
              <RightPanel isVisible={showPromptToolkit} />
            )}
          </Box>
        </Box>
      </SourcePanel>
    </Box>
  );
}
