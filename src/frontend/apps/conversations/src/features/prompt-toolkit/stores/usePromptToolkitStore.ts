import { useEffect, useRef } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { NestorTurn, PROMPT_TOOLKIT_ENABLED } from '../coach/coachApi';
import { readSharedPrompt } from '../library/templateVars';

/** Sections of the right panel; add one here and in `RightPanel`. */
export type RightPanelMode = 'coach' | 'learn' | 'tools';
/**
 * manual: analysis on button press; assist: versions and library matches on
 * button press; instant: library matches as you type (no model);
 * session: a review of the whole conversation.
 * Opening the coach is enough to use it: there is no "off" mode.
 */
export type CoachMode = 'manual' | 'assist' | 'instant' | 'session';

export const PANEL_MIN_WIDTH_PX = 340;
export const PANEL_DEFAULT_WIDTH_PX = 400;
/** The panel never takes more than this share of the viewport. */
export const PANEL_MAX_VIEWPORT_RATIO = 0.6;

export const clampPanelWidth = (width: number, viewportWidth: number) =>
  Math.round(
    Math.min(
      Math.max(width, PANEL_MIN_WIDTH_PX),
      Math.max(PANEL_MIN_WIDTH_PX, viewportWidth * PANEL_MAX_VIEWPORT_RATIO),
    ),
  );

interface PromptToolkitState {
  isOpen: boolean;
  mode: RightPanelMode;
  width: number;
  isExpanded: boolean;
  isResizing: boolean;
  coachMode: CoachMode;
  /** The cards home, shown on first opening and after a reset. */
  showHome: boolean;
  /** False while Nestor's welcome is shown: first opening, and each Home. */
  hasSeenWelcome: boolean;
  dismissWelcome: () => void;
  /** The coaching mode options, folded by default to save room. */
  isCoachOptionsOpen: boolean;
  /** Bumped by the header trash button; the open section clears itself. */
  resetCount: number;
  /** Live copy of the chat input, published by the chat while it is mounted. */
  chatInput: string;
  /** Replaces the chat input; null when no chat is mounted. */
  setChatInput: ((value: string) => void) | null;
  toggle: () => void;
  close: () => void;
  setMode: (mode: RightPanelMode) => void;
  setCoachMode: (coachMode: CoachMode) => void;
  /** Pick a module from the home cards. */
  startCoach: (coachMode: CoachMode) => void;
  /** Open a section of the panel, leaving the home cards. */
  openSection: (mode: RightPanelMode) => void;
  goHome: () => void;
  /** From the cards, Home again: back to Nestor's big welcome. */
  goWelcome: () => void;
  setCoachOptionsOpen: (isOpen: boolean) => void;
  resetSection: () => void;
  /** A prompt being completed by guided questions, shown over the section. */
  fill: {
    template: string;
    title: string;
    context?: string;
    /** "draft": strengthen the user's own text rather than fill blanks. */
    mode?: 'template' | 'draft';
  } | null;
  /** `context`: what the user already wrote, used to ask fewer questions. */
  startFill: (
    template: string,
    title: string,
    context?: string,
    mode?: 'template' | 'draft',
  ) => void;
  closeFill: () => void;
  /** A prompt shared by a colleague through a link, waiting to be imported. */
  sharedPrompt: { title: string; prompt: string } | null;
  clearSharedPrompt: () => void;
  /** The conversation with Nestor, kept while the page is open. */
  nestorChat: NestorTurn[];
  setNestorChat: (turns: NestorTurn[]) => void;
  /** A lesson to open in the course, asked from another section. */
  lessonRequest: string | null;
  openLesson: (lessonId: string) => void;
  clearLessonRequest: () => void;
  /** A tool to open in the tools section, asked from a suggestion. */
  toolRequest: string | null;
  openTool: (toolId: string) => void;
  clearToolRequest: () => void;
  setWidth: (width: number) => void;
  toggleExpanded: () => void;
  setResizing: (isResizing: boolean) => void;
  publishChatInput: (value: string) => void;
  registerChatInput: (setter: (value: string) => void) => () => void;
}

/**
 * Same breakpoint as the app's desktop layout. Not in unit tests, where the
 * app is rendered on a desktop-sized window without the panel's providers.
 */
const isFirstVisitOnDesktop = () =>
  import.meta.env.MODE !== 'test' &&
  typeof window !== 'undefined' &&
  window.innerWidth >= 1024;

export const usePromptToolkitStore = create<PromptToolkitState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      mode: 'coach',
      width: PANEL_DEFAULT_WIDTH_PX,
      isExpanded: false,
      isResizing: false,
      // On demand by default: the model is only called when asked.
      coachMode: 'manual',
      isCoachOptionsOpen: false,
      showHome: true,
      hasSeenWelcome: false,
      dismissWelcome: () => set({ hasSeenWelcome: true }),
      resetCount: 0,
      chatInput: '',
      setChatInput: null,
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      close: () => set({ isOpen: false }),
      setMode: (mode) => set({ mode }),
      setCoachMode: (coachMode) => set({ coachMode }),
      setCoachOptionsOpen: (isCoachOptionsOpen) => set({ isCoachOptionsOpen }),
      startCoach: (coachMode) =>
        set({ coachMode, mode: 'coach', showHome: false, fill: null }),
      openSection: (mode) => set({ mode, showHome: false, fill: null }),
      fill: null,
      startFill: (template, title, context, mode) =>
        set({ fill: { template, title, context, mode } }),
      closeFill: () => set({ fill: null }),
      sharedPrompt: null,
      clearSharedPrompt: () => set({ sharedPrompt: null }),
      nestorChat: [],
      setNestorChat: (nestorChat) => set({ nestorChat }),
      lessonRequest: null,
      openLesson: (lessonId) =>
        set({
          lessonRequest: lessonId,
          mode: 'learn',
          showHome: false,
          fill: null,
        }),
      clearLessonRequest: () => set({ lessonRequest: null }),
      toolRequest: null,
      openTool: (toolId) =>
        set({
          toolRequest: toolId,
          mode: 'tools',
          showHome: false,
          fill: null,
        }),
      clearToolRequest: () => set({ toolRequest: null }),
      goWelcome: () =>
        set({
          fill: null,
          showHome: true,
          hasSeenWelcome: false,
          isCoachOptionsOpen: false,
        }),
      // Home opens the cards; a second Home goes back to the welcome.
      goHome: () =>
        set({
          fill: null,
          showHome: true,
          isCoachOptionsOpen: false,
        }),
      // The trash button: clear the coach and come back to the home cards.
      resetSection: () =>
        set((state) => ({ resetCount: state.resetCount + 1 })),
      setWidth: (width) => set({ width, isExpanded: false }),
      toggleExpanded: () => set((state) => ({ isExpanded: !state.isExpanded })),
      setResizing: (isResizing) => set({ isResizing }),
      publishChatInput: (value) => set({ chatInput: value }),
      registerChatInput: (setter) => {
        set({ setChatInput: setter });
        return () => {
          if (get().setChatInput === setter) {
            set({ setChatInput: null, chatInput: '' });
          }
        };
      },
    }),
    {
      name: 'prompt-toolkit',
      // v2 removed the live coach, v3 the "off" mode: both become on demand.
      version: 3,
      migrate: (persisted) => {
        const state = {
          isOpen: false,
          width: PANEL_DEFAULT_WIDTH_PX,
          coachMode: 'manual' as CoachMode,
          showHome: true,
          hasSeenWelcome: false,
          mode: 'coach' as RightPanelMode,
          ...(persisted as Partial<PromptToolkitState>),
        };
        return {
          ...state,
          coachMode: ['live', 'off'].includes(state.coachMode)
            ? 'manual'
            : state.coachMode,
        };
      },
      // A panel left open stays closed if the deployment turned it off.
      // On the very first visit (nothing stored), it opens on Nestor's
      // welcome, on desktop only: on a phone it would cover the chat.
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<PromptToolkitState>),
        isOpen:
          PROMPT_TOOLKIT_ENABLED &&
          (persisted
            ? Boolean((persisted as Partial<PromptToolkitState>).isOpen)
            : isFirstVisitOnDesktop()),
      }),
      partialize: (state) => ({
        isOpen: state.isOpen,
        mode: state.mode,
        width: state.width,
        coachMode: state.coachMode,
        showHome: state.showHome,
        hasSeenWelcome: state.hasSeenWelcome,
      }),
    },
  ),
);

/**
 * A link shared by a colleague (#nestor-prompt=…, or the older #nestor-prompt=…)
 * opens the panel with an offer to import the prompt; the address is then
 * cleaned.
 */
const takeSharedPrompt = () => {
  const shared = readSharedPrompt(window.location.hash);
  if (shared) {
    usePromptToolkitStore.setState({ sharedPrompt: shared, isOpen: true });
    window.history.replaceState(
      null,
      '',
      window.location.pathname + window.location.search,
    );
  }
};
if (typeof window !== 'undefined' && PROMPT_TOOLKIT_ENABLED) {
  takeSharedPrompt();
  // Also when the link is opened in a tab where the app already runs.
  window.addEventListener('hashchange', takeSharedPrompt);
}

/** Runs `onReset` when the header trash button is pressed in `mode`. */
export const useSectionReset = (mode: RightPanelMode, onReset: () => void) => {
  const resetCount = usePromptToolkitStore((state) => state.resetCount);
  const onResetRef = useRef(onReset);
  onResetRef.current = onReset;
  const seenRef = useRef(resetCount);
  useEffect(() => {
    if (resetCount === seenRef.current) {
      return;
    }
    seenRef.current = resetCount;
    if (usePromptToolkitStore.getState().mode === mode) {
      onResetRef.current();
    }
  }, [resetCount, mode]);
};
