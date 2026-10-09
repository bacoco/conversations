import { Button } from '@gouvfr-lasuite/cunningham-react';
import {
  KeyboardEvent,
  PointerEvent,
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useTranslation } from 'react-i18next';
import { css } from 'styled-components';

import { Box, Icon } from '@/components';
import { HEADER_HEIGHT } from '@/features/header/conf';
import { useResponsiveStore } from '@/stores';

import {
  useAiAvailability,
  useAiAvailable,
  useAiUnavailable,
} from '../coach/aiAvailability';
import { languageName } from '../coach/language';
import { PromptFillView } from '../fill/PromptFillView';
import { usePanelWidth } from '../hooks/usePanelWidth';
import { LearnPanel } from '../learn/LearnPanel';
import {
  RightPanelMode,
  clampPanelWidth,
  usePromptToolkitStore,
} from '../stores/usePromptToolkitStore';
import { ToolsPanel } from '../tools/ToolsPanel';

import { CoachPanel } from './CoachPanel';
import { PanelHome } from './PanelHome';
import { RobinDock } from './RobinChat';

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
export const RightPanel = ({ isVisible = true }: { isVisible?: boolean }) => {
  const { t, i18n } = useTranslation();
  const { isDesktop } = useResponsiveStore();
  const accountToolsWidth = useAccountToolsWidth();
  // Robin's welcome comes first, whatever section was last open.
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
  } = usePromptToolkitStore();
  const sections = useSections();
  const fill = usePromptToolkitStore((state) => state.fill);
  const isAiAvailable = useAiAvailable();
  const isAiUnavailable = useAiUnavailable();
  const checkAi = useAiAvailability((state) => state.check);
  useEffect(() => {
    void checkAi();
  }, [checkAi]);
  // Without the Albert relay there is no coach: the home cards instead.
  const showHome =
    isHomeRequested || welcomeShown || (mode === 'coach' && isAiUnavailable);
  // The open space, as named in the header: the coach shows its mode.
  const current =
    mode === 'coach'
      ? { icon: 'touch_app', label: t('Coach') }
      : (sections.find((section) => section.mode === mode) ?? {
          icon: 'apps',
          label: '',
        });
  const title = showHome ? t('Prompt help') : current.label;

  return (
    <Box
      as="aside"
      aria-label={title}
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
          height: ${isDesktop ? HEADER_HEIGHT : 48}px;
          padding: 0 ${isDesktop ? accountToolsWidth + 16 : 8}px 0 12px;
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
            $gap="10px"
            $css="min-width: 0;"
          >
            <Box
              as="button"
              type="button"
              // From a space, Home shows the cards; from the cards, the welcome.
              onClick={showHome ? goWelcome : goHome}
              $direction="row"
              $align="center"
              $gap="6px"
              $css={homeButtonCss}
            >
              <Icon iconName="home" $size="18px" $withThemeInherited />
              {t('Home')}
            </Box>
            {!showHome && (
              <Box
                as="h2"
                $direction="row"
                $align="center"
                $gap="6px"
                $css="margin: 0; font-size: 0.9375rem; font-weight: 700; min-width: 0; white-space: nowrap;"
              >
                <Icon iconName={current.icon} $size="18px" $theme="brand" />
                {current.label}
              </Box>
            )}
          </Box>
        )}
        <Box $direction="row" $gap="4px">
          {!showHome && (
            <Button
              size="small"
              color="neutral"
              variant="tertiary"
              onClick={resetSection}
              aria-label={t('Start over')}
              title={t('Start over')}
              icon={<Icon iconName="delete" $size="20px" />}
            />
          )}
          {isDesktop && (
            <Button
              size="small"
              color="neutral"
              variant="tertiary"
              onClick={toggleExpanded}
              aria-label={
                isExpanded ? t('Reduce the panel') : t('Expand the panel')
              }
              icon={
                <Icon
                  iconName={isExpanded ? 'close_fullscreen' : 'open_in_full'}
                  $size="18px"
                />
              }
            />
          )}
          {/* On desktop the panel button next to it already closes it. */}
          {!isDesktop && (
            <Button
              size="small"
              color="neutral"
              variant="tertiary"
              onClick={close}
              aria-label={t('Close the panel')}
              icon={<Icon iconName="close" $size="20px" />}
            />
          )}
        </Box>
      </Box>
      <Box
        $css={css`
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overflow-x: hidden;
          pointer-events: auto;
          background: var(--c--contextuals--background--surface--primary);
        `}
      >
        {/* `Box` forces `display: flex`, so hide with $display, not `hidden`. */}
        {showHome && <PanelHome />}
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
          $display={!showHome && !fill && mode === 'coach' ? undefined : 'none'}
          $css="flex: 1 0 auto;"
        >
          <CoachPanel isActive={isVisible && !showHome && mode === 'coach'} />
        </Box>
        <Box
          $display={!showHome && !fill && mode === 'learn' ? undefined : 'none'}
          $css={css`
            min-height: 100%;
            /* Short course content reads better in a centred column. */
            & > * {
              width: 100%;
              max-width: 480px;
              margin-inline: auto;
            }
          `}
        >
          <LearnPanel />
        </Box>
        <Box
          $display={!showHome && !fill && mode === 'tools' ? undefined : 'none'}
          $css="min-height: 100%;"
        >
          <ToolsPanel />
        </Box>
      </Box>
      {/* Robin, on every screen: a round button that opens a sheet. */}
      {isAiAvailable && <RobinDock language={languageName(i18n.language)} />}
    </Box>
  );
};
