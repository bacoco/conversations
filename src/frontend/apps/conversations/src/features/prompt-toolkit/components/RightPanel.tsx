import {
  KeyboardEvent,
  PointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon } from '@/components';
import { useAuthQuery } from '@/features/auth';
import { HEADER_HEIGHT } from '@/features/header/conf';
import { useResponsiveStore } from '@/stores';

import {
  useAiAvailability,
  useAiAvailable,
  useAiUnavailable,
} from '../coach/aiAvailability';
import { languageName } from '../coach/language';
import {
  FavoritesButton,
  favoritesCornerShown,
} from '../favorites/FavoritesButton';
import { FavoritesPage } from '../favorites/FavoritesPage';
import { PromptFillView } from '../fill/PromptFillView';
import { usePanelWidth } from '../hooks/usePanelWidth';
import { LearnPanel } from '../learn/LearnPanel';
import { useRecorderStore } from '../speech/useRecorderStore';
import { claimNestorData } from '../stores/accountScope';
import { useCoachPrefsStore } from '../stores/useCoachPrefsStore';
import { useMainConversationStore } from '../stores/useMainConversationStore';
import {
  RightPanelMode,
  clampPanelWidth,
  usePromptToolkitStore,
} from '../stores/usePromptToolkitStore';
import { useTrainerStore } from '../stores/useTrainerStore';
import { ToolsPanel } from '../tools/ToolsPanel';
import { TourStage } from '../tour/TourStage';

import { CoachPanel } from './CoachPanel';
import { NestorDock } from './NestorChat';
import { PanelHeaderTools } from './PanelHeaderTools';
import { PanelHome } from './PanelHome';
import { PlacementChoice } from './PlacementChoice';
import { SharedPromptBanner } from './SharedPromptBanner';

const KEYBOARD_STEP_PX = 24;

const ResizeHandle = () => {
  const { t } = useTranslation();
  const { setWidth, setResizing, isResizing } = usePromptToolkitStore();
  const width = usePanelWidth();

  const onPointerDown = useCallback(
    (event: PointerEvent<HTMLButtonElement>) => {
      event.preventDefault();
      setResizing(true);
      const onMove = (moveEvent: globalThis.PointerEvent) =>
        setWidth(
          clampPanelWidth(
            window.innerWidth - moveEvent.clientX,
            window.innerWidth,
          ),
        );
      const onUp = () => {
        setResizing(false);
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      };
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    },
    [setResizing, setWidth],
  );

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const delta =
      event.key === 'ArrowLeft'
        ? KEYBOARD_STEP_PX
        : event.key === 'ArrowRight'
          ? -KEYBOARD_STEP_PX
          : 0;
    if (delta) {
      event.preventDefault();
      setWidth(clampPanelWidth(width + delta, window.innerWidth));
    }
  };

  return (
    <Box
      as="button"
      type="button"
      aria-label={t('Resize the panel')}
      title={t('Resize the panel')}
      onPointerDown={onPointerDown}
      onKeyDown={onKeyDown}
      $css={css`
        position: absolute;
        top: 0;
        bottom: 0;
        left: -4px;
        width: 8px;
        z-index: 2;
        padding: 0;
        border: none;
        background: transparent;
        cursor: col-resize;
        touch-action: none;
        pointer-events: auto;
        &::after {
          content: '';
          position: absolute;
          top: 0;
          bottom: 0;
          left: 3px;
          width: 2px;
          background: ${
            isResizing
              ? 'var(--c--contextuals--border--semantic--brand--primary)'
              : 'transparent'
          };
          transition: background 0.15s ease;
        }
        &:hover::after,
        &:focus-visible::after {
          background: var(--c--contextuals--border--semantic--brand--primary);
        }
        &:focus-visible {
          outline: none;
        }
      `}
    />
  );
};

/** Panel sections; add an entry here to get a new tab. */
const useSections = () => {
  const { t } = useTranslation();
  return [
    { mode: 'tools', icon: 'apps', label: t('Tools') },
    { mode: 'coach', icon: 'rate_review', label: t('Coach') },
    { mode: 'learn', icon: 'school', label: t('Course') },
  ] satisfies {
    mode: RightPanelMode;
    icon: string;
    label: string;
  }[];
};

/** A title that shortens with « … » when the tools need the room. */
const ellipsis = {
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
  minWidth: 0,
} as const;

const homeButtonCss = css`
  flex: none;
  height: 32px;
  padding: 0 10px 0 8px;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--c--contextuals--content--semantic--brand--primary);
  background: var(--c--contextuals--background--semantic--brand--tertiary);
  &:hover {
    filter: brightness(0.97);
  }
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 1px;
  }
`;

/** Width of the header's toggle + account menu, kept free in the tab row. */
const useAccountToolsWidth = () => {
  const [width, setWidth] = useState(96);
  useEffect(() => {
    const element = document.querySelector('[data-header-account-tools]');
    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }
    const measure = () => setWidth(element.getBoundingClientRect().width);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return width;
};

/** Both sections stay mounted so switching tabs keeps their content. */
export const RightPanel = ({
  isVisible: _isVisible = true,
}: {
  isVisible?: boolean;
}) => {
  const { t, i18n } = useTranslation();
  const { isDesktop } = useResponsiveStore();
  const accountToolsWidth = useAccountToolsWidth();
  // Nestor's welcome comes first, whatever section was last open.
  const welcomeShown = !usePromptToolkitStore((state) => state.hasSeenWelcome);
  const {
    mode,
    close,
    isExpanded,
    toggleExpanded,
    resetSection,
    showHome: isHomeRequested,
    goHome,
    goWelcome,
    openNestorSettings,
    showFavorites,
  } = usePromptToolkitStore();
  const sections = useSections();
  const fill = usePromptToolkitStore((state) => state.fill);
  const closeFill = usePromptToolkitStore((state) => state.closeFill);
  // A request sent to the Assistant moves on: Nestor's questions about an
  // earlier draft would hide the coach, which now has an answer to read.
  const requestCount = useMainConversationStore(
    (state) => state.turns.filter((turn) => turn.role === 'user').length,
  );
  const requestCountRef = useRef(requestCount);
  useEffect(() => {
    if (requestCount > requestCountRef.current) {
      closeFill();
    }
    requestCountRef.current = requestCount;
  }, [requestCount, closeFill]);
  const isAiAvailable = useAiAvailable();
  const isAiUnavailable = useAiUnavailable();
  const checkAi = useAiAvailability((state) => state.check);
  useEffect(() => {
    void checkAi();
  }, [checkAi]);
  // A transcription kept in this tab belongs to whoever was signed in.
  const { data: user } = useAuthQuery();
  const claimRecorder = useRecorderStore((state) => state.claim);
  // On a shared computer, Nestor keeps nothing of the previous account:
  // nothing personal is shown before this account's data is claimed.
  const [claimedFor, setClaimedFor] = useState<string | null>(null);
  useEffect(() => {
    if (!user?.id) {
      return;
    }
    claimRecorder(user.id);
    let live = true;
    void claimNestorData(user.id).then(() => {
      if (live) setClaimedFor(user.id);
    });
    return () => {
      live = false;
    };
  }, [user?.id, claimRecorder]);
  const isClaimed = !!user?.id && claimedFor === user.id;
  // Without the Albert relay there is no coach: the home cards instead.
  const showHome =
    isHomeRequested || welcomeShown || (mode === 'coach' && isAiUnavailable);
  // The open space, as named in the header.
  const current = showFavorites
    ? { icon: 'star', label: t('My favorites') }
    : mode === 'coach'
      ? { icon: 'touch_app', label: t('Coach') }
      : (sections.find((section) => section.mode === mode) ?? {
          icon: 'apps',
          label: '',
        });
  const title = showHome ? 'Nestor' : current.label;
  // The coach is a chat with Nestor: his name, Auto and the gear on top.
  const isNestorChat = mode === 'coach' && !showHome && !showFavorites;
  // Nestor's round button outside the coach: only when asked for.
  const showDock = useCoachPrefsStore((state) => state.showDock);
  // A case in training: the coach is the trainer for now.
  const training = useTrainerStore((state) => !!state.caseId && !state.paused);

  return (
    <Box
      as="aside"
      aria-label={title}
      data-tour="panel"
      $height="100%"
      $css={css`
        position: relative;
        pointer-events: ${isDesktop ? 'none' : 'auto'};
        border-left: 1px solid var(--c--contextuals--border--surface--primary);
      `}
    >
      {isDesktop && <ResizeHandle />}
      {/*
       * On desktop the tab row shares the app header row; its right end stays
       * transparent so the panel toggle and account menu remain usable.
       */}
      <Box
        $direction="row"
        $align="center"
        $justify="space-between"
        $css={css`
          flex: none;
          container: panel-header / inline-size;
          height: ${isDesktop ? HEADER_HEIGHT : 48}px;
          /* Tight sides: « Nestor » stays whole beside the tools. */
          padding: 0 ${isDesktop ? accountToolsWidth + 8 : 8}px 0 8px;
          pointer-events: none;
          & > * {
            pointer-events: auto;
          }
          background: ${
            isDesktop
              ? 'transparent'
              : 'var(--c--contextuals--background--surface--primary)'
          };
          border-bottom: 1px solid
            var(--c--contextuals--border--surface--primary);
        `}
      >
        {/*
         * One space at a time: inside a space, "Home" and the space's name;
         * on the cards, "Home" alone; on the welcome, nothing.
         */}
        {welcomeShown ? (
          <span />
        ) : (
          <Box
            $direction="row"
            $align="center"
            $gap="6px"
            // The title gives way to the tools: it shortens, never overlaps.
            $css="min-width: 0; flex: 1 1 auto; overflow: hidden;"
          >
            <Box
              as="button"
              type="button"
              // From a space, Home shows the cards; from the cards, the welcome.
              onClick={showHome ? goWelcome : goHome}
              aria-label={t('Home')}
              title={t('Home')}
              $direction="row"
              $align="center"
              $gap="6px"
              $css={homeButtonCss}
            >
              <Icon iconName="home" $size="18px" $withThemeInherited />
              {/* Narrow: the house alone, so the screen's title stays whole. */}
              <Box
                as="span"
                $css={css`
                  @container panel-header (max-width: 520px) {
                    display: none;
                  }
                `}
              >
                {t('Home')}
              </Box>
            </Box>
            {isNestorChat && (
              <Box
                as="h2"
                // A short name, never cut (« Nes… »): it keeps its width.
                $css="margin: 0; font-size: 0.9375rem; font-weight: 700; white-space: nowrap; flex: none;"
              >
                <span>{training ? t('Training') : 'Nestor'}</span>
              </Box>
            )}
            {!showHome && !isNestorChat && (
              <Box
                as="h2"
                $direction="row"
                $align="center"
                $gap="6px"
                $css={css`
                  margin: 0;
                  font-size: 0.9375rem;
                  font-weight: 700;
                  min-width: 0;
                  white-space: nowrap;
                  overflow: hidden;
                  /* Narrow: the words of the title before its icon. */
                  @container panel-header (max-width: 520px) {
                    & > :first-child {
                      display: none;
                    }
                  }
                `}
              >
                <Icon iconName={current.icon} $size="18px" $theme="brand" />
                <span style={ellipsis}>{current.label}</span>
              </Box>
            )}
          </Box>
        )}
        <PanelHeaderTools
          isDesktop={isDesktop}
          isExpanded={isExpanded}
          onSettings={openNestorSettings}
          resetLabel={isNestorChat ? t('Erase Nestor’s thread') : undefined}
          onReset={
            isNestorChat
              ? () => usePromptToolkitStore.setState({ eraseAsked: true })
              : !showHome && !showFavorites
                ? resetSection
                : undefined
          }
          onExpand={toggleExpanded}
          onClose={close}
        />
      </Box>
      <Box
        data-panel-scroll
        $css={css`
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          pointer-events: auto;
          background: var(--c--contextuals--background--surface--primary);
        `}
      >
        {isClaimed && (
          <>
            <SharedPromptBanner />
            <PlacementChoice />
            {/* `Box` forces `display: flex`, so hide with $display, not `hidden`. */}
            {showHome && <PanelHome />}
            {!showHome && !fill && showFavorites && <FavoritesPage />}
            {!showHome && fill && (
              <PromptFillView
                key={fill.template}
                template={fill.template}
                title={fill.title}
                context={fill.context}
                mode={fill.mode}
              />
            )}
            <Box
              $display={
                !showHome && !fill && !showFavorites && mode === 'coach'
                  ? undefined
                  : 'none'
              }
              // The chat scrolls by itself; its bar stays at the bottom.
              $css="flex: 1; min-height: 0;"
            >
              <CoachPanel />
            </Box>
            <Box
              $display={
                !showHome && !fill && !showFavorites && mode === 'learn'
                  ? undefined
                  : 'none'
              }
              $css={css`
                min-height: 100%;
                /* Short course content reads better in a centred column. */
                & > * {
                  width: 100%;
                  max-width: 480px;
                  margin-inline: auto;
                }
                /* A course screen in its frame uses the whole panel. */
                & > [data-frame] {
                  max-width: none;
                }
              `}
            >
              <LearnPanel />
            </Box>
            <Box
              $display={
                !showHome && !fill && !showFavorites && mode === 'tools'
                  ? undefined
                  : 'none'
              }
              $css="min-height: 100%;"
            >
              <ToolsPanel />
            </Box>
          </>
        )}
      </Box>
      {/* Nestor, on every screen: a round button that opens a sheet. */}
      {/* In the coach, "Demander à Nestor" is in the bar. */}
      {/* Nestor's guided tour: he speaks in the middle, the panel flashes. */}
      <TourStage />
      {/* « Mes favoris »: a round star, bottom right, outside the coach. */}
      {isClaimed &&
        favoritesCornerShown({ welcomeShown, isNestorChat, showFavorites }) && (
          <Box
            $css={css`
              position: absolute;
              /* Above the field at the bottom of the course and the tools. */
              bottom: ${showHome ? 16 : 84}px;
              right: ${showDock ? 84 : 16}px;
              pointer-events: auto;
            `}
          >
            <FavoritesButton />
          </Box>
        )}
      {isClaimed && isAiAvailable && !isNestorChat && showDock && (
        <NestorDock language={languageName(i18n.language)} />
      )}
    </Box>
  );
};
