import { useEffect, useRef } from 'react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { NestorTurn, PROMPT_TOOLKIT_ENABLED } from '../coach/coachApi';
import { readSharedPrompt } from '../library/templateVars';

/** Sections of the right panel; add one here and in `RightPanel`. */
export type RightPanelMode = 'coach' | 'learn' | 'tools';
/** Horizontal resting place of the collapsed Nestor coach launcher. */
export type NestorDockPosition = 'left' | 'center' | 'right';

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
  /** The height of a course screen's action bar at the bottom; 0: none. */
  actionBarHeight: number;
  setActionBarHeight: (height: number) => void;
  isResizing: boolean;
  /** The cards home, shown on first opening and after a reset. */
  showHome: boolean;
  /** False while Nestor's welcome is shown: first opening, and each Home. */
  hasSeenWelcome: boolean;
  /** The coach's bin was clicked: « Effacer le fil ? » waits for a yes. */
  eraseAsked: boolean;
  dismissWelcome: () => void;
  /** The coaching mode options, folded by default to save room. */
  isCoachOptionsOpen: boolean;
  /** Nestor's settings over the chat (gear in the header); not kept. */
  showNestorSettings: boolean;
  /** Nestor's settings, from any screen of the panel (home included). */
  openNestorSettings: () => void;
  /** « Mes favoris », a page of the panel opened from its home card. */
  showFavorites: boolean;
  openFavorites: () => void;
  /** Where closing a completion goes back to: the screen it was opened from. */
  fillReturn: { showHome: boolean; showFavorites: boolean } | null;
  setShowNestorSettings: (show: boolean) => void;
  /** Bumped by the header trash button; the open section clears itself. */
  resetCount: number;
  /** Live copy of the chat input, published by the chat while it is mounted. */
  chatInput: string;
  /** Replaces the chat input; null when no chat is mounted. */
  setChatInput: ((value: string) => void) | null;
  toggle: () => void;
  close: () => void;
  setMode: (mode: RightPanelMode) => void;
  /** Open the coach from the home cards: one screen, following the moment. */
  startCoach: () => void;
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
    /** The draft this prompt is a version of: it replaces it when used. */
    replaces?: string;
  } | null;
  /** `context`: what the user already wrote, used to ask fewer questions. */
  startFill: (
    template: string,
    title: string,
    context?: string,
    mode?: 'template' | 'draft',
    replaces?: string,
  ) => void;
  closeFill: () => void;
  /** A prompt shared by a colleague through a link, waiting to be imported. */
  sharedPrompt: { title: string; prompt: string } | null;
  clearSharedPrompt: () => void;
  /** The conversation with Nestor, kept while the page is open. */
  nestorChat: NestorTurn[];
  setNestorChat: (turns: NestorTurn[]) => void;
  /** The launcher can be dragged along the bottom of the right panel. */
  nestorDockPosition: NestorDockPosition;
  setNestorDockPosition: (position: NestorDockPosition) => void;
  /** A task requested from a panel tool: Nestor executes it in the panel. */
  nestorTask: { prompt: string; label: string } | null;
  openNestorTask: (prompt: string, label: string) => void;
  clearNestorTask: () => void;
  /** A lesson to open in the course, asked from another section. */
  /**
   * The coach read the request just sent: once the answer is there, the
   * closed panel shows a gentle dot instead of opening itself.
   */
  coachWaitsForAnswer: boolean;
  setCoachWaitsForAnswer: (waits: boolean) => void;
  /**
   * A request to put in a message field that already holds a text: the
   * user chooses to replace it, add after it, or cancel.
   */
  pendingPlacement: string | null;
  setPendingPlacement: (prompt: string | null) => void;
  /**
   * Nestor helped with the request just sent: when its answer arrives
   * elsewhere in the panel, offer the coach's help with it, once.
   */
  offerAnswerHelp: boolean;
  setOfferAnswerHelp: (offer: boolean) => void;
  /**
   * Asked from the composer: open the coach and read the request. Kept
   * until the coach reads it, even when it is not there yet.
   */
  pendingRead: boolean;
  openCoachAndRead: () => void;
  clearPendingRead: () => void;
  /**
   * A tool asked the Assistant from the panel: once the answer is there,
   * the panel goes on with it (what to settle before sending).
   */
  followAnswer: boolean;
  setFollowAnswer: (follow: boolean) => void;
  /** The coach opens the "make it ready" workshop on the next answer. */
  finishNextAnswer: boolean;
  setFinishNextAnswer: (finish: boolean) => void;
  /** A lesson asked from elsewhere, on one of its screens if given. */
  lessonRequest: { lessonId: string; slide?: number } | null;
  openLesson: (lessonId: string, slide?: number) => void;
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

/** Same breakpoint as the app's desktop layout. */
const isDesktopWindow = () =>
  typeof window !== 'undefined' && window.innerWidth >= 1024;

/**
 * Not in unit tests, where the app is rendered on a desktop-sized window
 * without the panel's providers.
 */
const isFirstVisitOnDesktop = () =>
  import.meta.env.MODE !== 'test' && isDesktopWindow();

export const usePromptToolkitStore = create<PromptToolkitState>()(
  persist(
    (set, get) => ({
      isOpen: false,
      mode: 'coach',
      width: PANEL_DEFAULT_WIDTH_PX,
      isExpanded: false,
      actionBarHeight: 0,
      setActionBarHeight: (actionBarHeight) => set({ actionBarHeight }),
      isResizing: false,
      isCoachOptionsOpen: false,
      showNestorSettings: false,
      setShowNestorSettings: (showNestorSettings) =>
        set({ showNestorSettings }),
      showFavorites: false,
      openFavorites: () =>
        set({
          isOpen: true,
          showHome: false,
          showFavorites: true,
          showNestorSettings: false,
          fill: null,
        }),
      fillReturn: null,
      openNestorSettings: () =>
        set({
          isOpen: true,
          mode: 'coach',
          showHome: false,
          showFavorites: false,
          fill: null,
          showNestorSettings: true,
        }),
      showHome: true,
      hasSeenWelcome: false,
      eraseAsked: false,
      dismissWelcome: () => set({ hasSeenWelcome: true }),
      resetCount: 0,
      chatInput: '',
      setChatInput: null,
      toggle: () => set((state) => ({ isOpen: !state.isOpen })),
      close: () => set({ isOpen: false }),
      setMode: (mode) => set({ mode }),
      setCoachOptionsOpen: (isCoachOptionsOpen) => set({ isCoachOptionsOpen }),
      startCoach: () =>
        set({
          mode: 'coach',
          showHome: false,
          showFavorites: false,
          showNestorSettings: false,
          fill: null,
        }),
      openSection: (mode) =>
        set({
          mode,
          showHome: false,
          showFavorites: false,
          showNestorSettings: false,
          fill: null,
        }),
      fill: null,
      startFill: (template, title, context, mode, replaces) =>
        set((state) => ({
          fill: { template, title, context, mode, replaces },
          showHome: false,
          showFavorites: false,
          // Opened over a completion, it keeps the first screen to go back to.
          fillReturn: state.fill
            ? state.fillReturn
            : { showHome: state.showHome, showFavorites: state.showFavorites },
        })),
      closeFill: () =>
        set((state) => ({
          fill: null,
          fillReturn: null,
          ...(state.fillReturn ?? {}),
        })),
      sharedPrompt: null,
      clearSharedPrompt: () => set({ sharedPrompt: null }),
      nestorChat: [],
      setNestorChat: (nestorChat) => set({ nestorChat }),
      nestorDockPosition: 'right',
      setNestorDockPosition: (nestorDockPosition) =>
        set({ nestorDockPosition }),
      nestorTask: null,
      openNestorTask: (prompt, label) =>
        set({ nestorTask: { prompt, label }, isOpen: true }),
      clearNestorTask: () => set({ nestorTask: null }),
      coachWaitsForAnswer: false,
      pendingPlacement: null,
      setPendingPlacement: (pendingPlacement) => set({ pendingPlacement }),
      offerAnswerHelp: false,
      setOfferAnswerHelp: (offerAnswerHelp) => set({ offerAnswerHelp }),
      pendingRead: false,
      openCoachAndRead: () =>
        set({
          isOpen: true,
          mode: 'coach',
          showHome: false,
          showFavorites: false,
          fill: null,
          pendingRead: true,
        }),
      clearPendingRead: () => set({ pendingRead: false }),
      followAnswer: false,
      setFollowAnswer: (followAnswer) => set({ followAnswer }),
      finishNextAnswer: false,
      setFinishNextAnswer: (finishNextAnswer) => set({ finishNextAnswer }),
      setCoachWaitsForAnswer: (coachWaitsForAnswer) =>
        set({ coachWaitsForAnswer }),
      lessonRequest: null,
      openLesson: (lessonId, slide) =>
        set({
          lessonRequest: { lessonId, slide },
          mode: 'learn',
          showHome: false,
          showFavorites: false,
          fill: null,
        }),
      clearLessonRequest: () => set({ lessonRequest: null }),
      toolRequest: null,
      openTool: (toolId) =>
        set({
          toolRequest: toolId,
          mode: 'tools',
          showHome: false,
          showFavorites: false,
          fill: null,
        }),
      clearToolRequest: () => set({ toolRequest: null }),
      goWelcome: () =>
        set({
          showFavorites: false,
          fill: null,
          showHome: true,
          hasSeenWelcome: false,
          isCoachOptionsOpen: false,
          showNestorSettings: false,
        }),
      // Home opens the cards; a second Home goes back to the welcome.
      goHome: () =>
        set({
          showFavorites: false,
          fill: null,
          showHome: true,
          isCoachOptionsOpen: false,
          showNestorSettings: false,
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
      // v2 removed the live coach, v3 the "off" mode; v5 brought back the
      // coach's four screens; v6 starts everyone on "as you type"; v7 moved
      // the next questions into the advice thread; v8 made the coach one chat
      // with Nestor: no screen to remember.
      version: 8,
      migrate: (persisted) => {
        const { coachMode: _screen, ...stored } = persisted as Partial<
          PromptToolkitState & { coachMode: string }
        >;
        return {
          isOpen: false,
          width: PANEL_DEFAULT_WIDTH_PX,
          showHome: true,
          hasSeenWelcome: false,
          mode: 'coach' as RightPanelMode,
          ...stored,
        };
      },
      // A panel left open stays closed if the deployment turned it off.
      // On the very first visit (nothing stored), it opens on Nestor's
      // welcome, on desktop only. On a phone it would cover the chat: there
      // the conversation always comes first and the panel opens on demand.
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<PromptToolkitState>),
        isOpen:
          PROMPT_TOOLKIT_ENABLED &&
          (persisted
            ? Boolean((persisted as Partial<PromptToolkitState>).isOpen) &&
              isDesktopWindow()
            : isFirstVisitOnDesktop()),
      }),
      partialize: (state) => ({
        isOpen: state.isOpen,
        mode: state.mode,
        width: state.width,
        showHome: state.showHome,
        hasSeenWelcome: state.hasSeenWelcome,
      }),
    },
  ),
);

/**
 * A link shared by a colleague (#nestor-prompt=…, or the older #robin-prompt=…)
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

/** Asked as « toolRequest »: the everyday tools' list, not a tool. */
export const TOOLS_LIST = '__list__';

/** « Outils du quotidien » from the home page: the list, never the last tool. */
export const openToolsList = () => {
  usePromptToolkitStore.getState().openSection('tools');
  usePromptToolkitStore.setState({ toolRequest: TOOLS_LIST });
};
