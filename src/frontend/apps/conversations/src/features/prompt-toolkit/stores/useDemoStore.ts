import { create } from 'zustand';

import { examplePairs } from '../chat/examples';
import type { BarAction } from '../chat/types';

import { useNestorChatStore } from './useNestorChatStore';
import { useProfileStore } from './useProfileStore';
import { usePromptToolkitStore } from './usePromptToolkitStore';

/** The demo's own thread: the user's real threads stay untouched. */
export const DEMO_KEY = 'nestor-demo';

/** The order of a real session: read, improve, review, ask. */
export const DEMO_STEPS: BarAction[] = ['analyse', 'improve', 'review', 'ask'];

const FALLBACK_DRAFT = 'Réponds à l’agent sur ses congés';

export type DemoStep = BarAction | 'intro' | 'end';

/** Nestor's word about a button, under the message it follows ('' : top). */
export interface DemoNote {
  after: string;
  step: DemoStep;
}

interface DemoState {
  active: boolean;
  /** Shown beside the thread, never in it: the answers keep their buttons. */
  notes: DemoNote[];
  addNote: (note: DemoNote) => void;
  /** The buttons already tried and explained. */
  done: BarAction[];
  /** The user's text in the Assistant's field, given back at the end. */
  previousDraft: string;
  start: (previousDraft: string) => void;
  markDone: (step: BarAction) => void;
  stop: () => void;
}

/** Kept in memory only: a reload ends the demo. */
export const useDemoStore = create<DemoState>()((set) => ({
  active: false,
  notes: [],
  done: [],
  previousDraft: '',
  addNote: (note) => set((state) => ({ notes: [...state.notes, note] })),
  start: (previousDraft) =>
    set({
      active: true,
      done: [],
      previousDraft,
      notes: [{ after: '', step: 'intro' }],
    }),
  markDone: (step) =>
    set((state) =>
      state.done.includes(step) ? state : { done: [...state.done, step] },
    ),
  stop: () => set({ active: false, done: [], previousDraft: '', notes: [] }),
}));

const putInField = (text: string) => {
  const panel = usePromptToolkitStore.getState();
  panel.setChatInput?.(text);
  panel.publishChatInput(text);
};

/**
 * « Essayer en mode démo »: the coach opens on its own thread, with an
 * example request of the user's job in the Assistant's field.
 */
export const startDemo = () => {
  const panel = usePromptToolkitStore.getState();
  useDemoStore.getState().start(panel.chatInput);
  useNestorChatStore.getState().clear(DEMO_KEY);
  panel.dismissWelcome();
  panel.openSection('coach');
  const job = useProfileStore.getState().job;
  putInField(examplePairs(job?.id as never)[0]?.before ?? FALLBACK_DRAFT);
};

/** « Quitter la démo »: the user's text comes back, the demo is forgotten. */
export const stopDemo = () => {
  const { previousDraft } = useDemoStore.getState();
  useNestorChatStore.getState().clear(DEMO_KEY);
  useDemoStore.getState().stop();
  putInField(previousDraft);
};
