import { useEffect, useRef } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { PROMPT_TOOLKIT_ENABLED } from '../coach/coachApi';

/** Sections of the right panel; add one here and in `RightPanel`. */
export type RightPanelMode = 'coach' | 'learn' | 'tools';
/**
 * off: nothing is sent; manual: on button press; session: a review of the
 * whole conversation.
 */
export type CoachMode = 'off' | 'manual' | 'session';

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
  /** False while Robin's welcome is shown: first opening, and each Home. */
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
  setCoachOptionsOpen: (isOpen: boolean) => void;
  resetSection: () => void;
  /** A prompt being completed by guided questions, shown over the section. */
  fill: { template: string; title: string; context?: string } | null;
  /** `context`: what the user already wrote, used to ask fewer questions. */
  startFill: (template: string, title: string, context?: string) => void;
  closeFill: () => void;
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
      startFill: (template, title, context) =>
        set({ fill: { template, title, context } }),
      closeFill: () => set({ fill: null }),
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
      // Home always opens on Robin's welcome; "Get started" shows the cards.
      goHome: () =>
        set({
          fill: null,
          showHome: true,
          hasSeenWelcome: false,
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
      // v2 removed the live coach: stored "live" modes become on demand.
      version: 2,
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
          coachMode:
            (state.coachMode as string) === 'live' ? 'manual' : state.coachMode,
        };
      },
      // A panel left open stays closed if the deployment turned it off.
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<PromptToolkitState>),
        isOpen:
          PROMPT_TOOLKIT_ENABLED &&
          Boolean((persisted as Partial<PromptToolkitState>)?.isOpen),
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
