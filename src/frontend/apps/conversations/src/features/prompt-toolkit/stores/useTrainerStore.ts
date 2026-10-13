import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import type { RequestAdvice } from '../chat/nestorChatApi';
import type { TipState } from '../chat/types';

import { RightPanelMode, usePromptToolkitStore } from './usePromptToolkitStore';

/** The trainer's steps, in order: the band at the top shows them. */
export const TRAINER_STEPS = [
  'read',
  'ask',
  'advice',
  'compare',
  'verify',
  'done',
] as const;
export type TrainerStep = (typeof TRAINER_STEPS)[number];

interface TrainerCase {
  /** The case being practised; null when there is none. */
  caseId: string | null;
  step: TrainerStep;
  /** Where the user came from, to go back there at the end. */
  from: RightPanelMode | null;
  /** The coach was used meanwhile: the case waits, « Reprendre ». */
  paused: boolean;
  advice: RequestAdvice | null;
  tipStates: Record<number, TipState>;
  /** The user's own request, as checked against the good one. */
  mine: string;
  /** For each key point of the case: did the user's request have it? */
  points: boolean[];
  /** The good or the user's request was put in the field, to send. */
  placed: 'good' | 'mine' | null;
  /** Figures of the answer found nowhere in the case's texts. */
  unfound: string[];
  /** The user's ticks on what to check in the answer. */
  checks: Record<number, boolean>;
}

interface TrainerState extends TrainerCase {
  start: (caseId: string, from: RightPanelMode | null) => void;
  update: (patch: Partial<TrainerCase>) => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
}

const EMPTY: TrainerCase = {
  caseId: null,
  step: 'read',
  from: null,
  paused: false,
  advice: null,
  tipStates: {},
  mine: '',
  points: [],
  placed: null,
  unfound: [],
  checks: {},
};

/** One case at a time, kept in this tab only (sessionStorage). */
export const useTrainerStore = create<TrainerState>()(
  persist(
    (set) => ({
      ...EMPTY,
      start: (caseId, from) => set({ ...EMPTY, caseId, from }),
      update: (patch) => set(patch),
      pause: () => set((state) => (state.caseId ? { paused: true } : state)),
      resume: () => set({ paused: false }),
      stop: () => set(EMPTY),
    }),
    {
      name: 'nestor-trainer',
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state): TrainerCase => ({
        caseId: state.caseId,
        step: state.step,
        from: state.from,
        paused: state.paused,
        advice: state.advice,
        tipStates: state.tipStates,
        mine: state.mine,
        points: state.points,
        placed: state.placed,
        unfound: state.unfound,
        checks: state.checks,
      }),
    },
  ),
);

/**
 * « S'entraîner », from wherever: the coach becomes the trainer on this
 * case, and remembers where the user was.
 */
export const startTraining = (caseId: string) => {
  const panel = usePromptToolkitStore.getState();
  useTrainerStore.getState().start(caseId, panel.showHome ? null : panel.mode);
  panel.openSection('coach');
};
