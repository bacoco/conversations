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

import { PromptFillView } from '../fill/PromptFillView';
import { usePanelWidth } from '../hooks/usePanelWidth';
import { LearnPanel } from '../learn/LearnPanel';
import { RecommendationBar } from '../library/RecommendationBar';
import {
  CoachMode,
  RightPanelMode,
  clampPanelWidth,
  usePromptToolkitStore,
} from '../stores/usePromptToolkitStore';
import { ToolsPanel } from '../tools/ToolsPanel';

import { CoachPanel } from './CoachPanel';
import { PanelHome } from './PanelHome';

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

const tabCss = (isActive: boolean) => css`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 32px;
  padding: 0 ${isActive ? 12 : 8}px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font: inherit;
  font-size: 0.875rem;
  font-weight: ${isActive ? 600 : 400};
  color: ${
    isActive
      ? 'var(--c--contextuals--content--semantic--brand--primary)'
      : 'var(--c--contextuals--content--semantic--neutral--secondary)'
  };
  background: ${
    isActive
      ? 'var(--c--contextuals--background--semantic--brand--tertiary)'
      : 'transparent'
  };
  &:hover {
    color: var(--c--contextuals--content--semantic--brand--primary);
  }
  &:focus-visible {
    outline: 2px solid var(--c--contextuals--border--semantic--brand--primary);
    outline-offset: 1px;
  }
`;

const COACH_MODE_ICON: Record<CoachMode, { icon: string; color: string }> = {
  off: {
    icon: 'block',
    color: 'var(--c--contextuals--content--semantic--error--primary)',
  },
  manual: {
    icon: 'touch_app',
    color: 'var(--c--contextuals--content--semantic--brand--primary)',
  },
  session: {
    icon: 'insights',
    color: 'var(--c--contextuals--content--semantic--info--primary)',
  },
};

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
  const { t } = useTranslation();
  const { isDesktop } = useResponsiveStore();
  const accountToolsWidth = useAccountToolsWidth();
  // Robin's welcome comes first, whatever section was last open.
  const welcomeShown = !usePromptToolkitStore((state) => state.hasSeenWelcome);
  const dismissWelcome = usePromptToolkitStore((state) => state.dismissWelcome);
  const {
    mode,
    close,
    isExpanded,
    toggleExpanded,
    coachMode,
    isCoachOptionsOpen,
    setCoachOptionsOpen,
    resetSection,
    showHome: isHomeRequested,
    goHome,
    openSection,
  } = usePromptToolkitStore();
  const coachModeLabels: Record<CoachMode, string> = {
    off: t('Off'),
    manual: t('On demand'),
    session: t('Session review'),
  };
  const sections = useSections();
  const fill = usePromptToolkitStore((state) => state.fill);
  const showHome = isHomeRequested || welcomeShown;
  const title = sections.find((section) => section.mode === mode)?.label ?? '';

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
        <Box $direction="row" $gap="4px" role="tablist">
          {sections.map((section) => {
            const isActive = section.mode === mode && !showHome;
            const isCoach = section.mode === 'coach';
            return (
              <Box
                key={section.mode}
                as="button"
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-expanded={
                  isCoach && isActive ? isCoachOptionsOpen : undefined
                }
                aria-controls={isCoach ? 'coach-options' : undefined}
                title={
                  isCoach
                    ? t('Coach mode: {{mode}}. Click again to change it.', {
                        mode: coachModeLabels[coachMode],
                      })
                    : section.label
                }
                $direction="row"
                onClick={() => {
                  if (isCoach && isActive) {
                    // A second click on the active Coach tab shows the modes.
                    setCoachOptionsOpen(!isCoachOptionsOpen);
                  } else {
                    if (welcomeShown) {
                      dismissWelcome();
                    }
                    openSection(section.mode);
                  }
                }}
                $css={tabCss(isActive)}
              >
                <Icon
                  iconName={section.icon}
                  $size="18px"
                  $withThemeInherited
                />
                {/* Only the active tab shows its name, to keep the header on one line. */}
                {isActive ? (
                  section.label
                ) : (
                  <span className="sr-only">{section.label}</span>
                )}
                {isCoach && (
                  <>
                    <Icon
                      iconName={COACH_MODE_ICON[coachMode].icon}
                      $size="16px"
                      $color={COACH_MODE_ICON[coachMode].color}
                    />
                    <span className="sr-only">
                      {coachModeLabels[coachMode]}
                    </span>
                    {isActive && (
                      <Icon
                        iconName={
                          isCoachOptionsOpen ? 'expand_less' : 'expand_more'
                        }
                        $size="16px"
                        $withThemeInherited
                      />
                    )}
                  </>
                )}
              </Box>
            );
          })}
        </Box>
        <Box $direction="row" $gap="4px">
          {!welcomeShown && (
            <Button
              size="small"
              color="neutral"
              variant="tertiary"
              onClick={goHome}
              aria-label={t('Back to the home cards')}
              title={t('Back to the home cards')}
              icon={<Icon iconName="home" $size="20px" />}
            />
          )}
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
          <Button
            size="small"
            color="neutral"
            variant="tertiary"
            onClick={close}
            aria-label={t('Close the panel')}
            icon={<Icon iconName="close" $size="20px" />}
          />
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
        {/* Suggestions follow what the user types, in the working sections. */}
        {!showHome && !fill && mode !== 'learn' && (
          <RecommendationBar isActive={isVisible} />
        )}
        {!showHome && fill && (
          <PromptFillView
            key={fill.template}
            template={fill.template}
            title={fill.title}
            context={fill.context}
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
    </Box>
  );
};
