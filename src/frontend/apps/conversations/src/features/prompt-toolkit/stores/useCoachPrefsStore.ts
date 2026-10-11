import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { Competency, RequestKind } from '../coach/coachApi';

export type CoachTone = 'encouraging' | 'direct';
export type CoachLength = 'short' | 'detailed';

/** Who the user usually writes to, chosen once ("my goals"). */
export const USUAL_AUDIENCES = [
  'public',
  'colleagues',
  'management',
  'partners',
] as const;
export type UsualAudience = (typeof USUAL_AUDIENCES)[number];

const AUDIENCE_WORDS: Record<UsualAudience, string> = {
  public: 'members of the public',
  colleagues: 'colleagues',
  management: 'their management',
  partners: 'outside partners',
};

/** "Useful? Too simple? Too complicated?" is asked at most once a day. */
export const FELT_ASK_EVERY_MS = 24 * 60 * 60 * 1000;

interface CoachPrefsState {
  tone: CoachTone;
  length: CoachLength;
  /** Ask the user what is missing before giving the coach's opinion. */
  askFirst: boolean;
  /** Three boxes to tick before sending, for those who want them. */
  checklist: boolean;
  /**
   * The coach in the room: it watches the request being written and, at a
   * pause, says the one thing that matters, if any.
   */
  roomCoach: boolean;
  /** The coach in the room said once what it does. */
  roomCoachIntroSeen: boolean;
  usualAudience: UsualAudience | null;
  /** Tips the user said are not needed, per kind of request. */
  dismissedTips: Partial<Record<RequestKind, Competency[]>>;
  /** When "useful? too simple? too complicated?" was last asked. */
  feltAskedAt: number;
  setTone: (tone: CoachTone) => void;
  setLength: (length: CoachLength) => void;
  setAskFirst: (askFirst: boolean) => void;
  setChecklist: (checklist: boolean) => void;
  setRoomCoach: (roomCoach: boolean) => void;
  setRoomCoachIntroSeen: () => void;
  setUsualAudience: (audience: UsualAudience | null) => void;
  dismissTip: (kind: RequestKind, skill: Competency) => void;
  markFeltAsked: (now?: number) => void;
  reset: () => void;
}

const initialPrefs = {
  tone: 'encouraging' as CoachTone,
  length: 'short' as CoachLength,
  askFirst: false,
  checklist: false,
  roomCoach: true,
  roomCoachIntroSeen: false,
  usualAudience: null as UsualAudience | null,
  dismissedTips: {} as Partial<Record<RequestKind, Competency[]>>,
  feltAskedAt: 0,
};

export const useCoachPrefsStore = create<CoachPrefsState>()(
  persist(
    (set) => ({
      ...initialPrefs,
      setTone: (tone) => set({ tone }),
      setLength: (length) => set({ length }),
      setAskFirst: (askFirst) => set({ askFirst }),
      setChecklist: (checklist) => set({ checklist }),
      setRoomCoach: (roomCoach) => set({ roomCoach }),
      setRoomCoachIntroSeen: () => set({ roomCoachIntroSeen: true }),
      setUsualAudience: (usualAudience) => set({ usualAudience }),
      dismissTip: (kind, skill) =>
        set((state) => {
          const current = state.dismissedTips[kind] ?? [];
          return current.includes(skill)
            ? state
            : {
                dismissedTips: {
                  ...state.dismissedTips,
                  [kind]: [...current, skill],
                },
              };
        }),
      markFeltAsked: (now = Date.now()) => set({ feltAskedAt: now }),
      reset: () => set(initialPrefs),
    }),
    { name: 'prompt-coach-prefs' },
  ),
);

/** What the coach's instructions say about the user's choices. */
export const coachRules = () => {
  const { tone, length, usualAudience } = useCoachPrefsStore.getState();
  return [
    tone === 'direct'
      ? 'The user prefers a direct coach: state the next step plainly, keep praise to a few words.'
      : '',
    length === 'detailed'
      ? 'The user likes details: you may explain why in one more sentence.'
      : 'Keep every text short.',
    usualAudience
      ? `The user usually writes to ${AUDIENCE_WORDS[usualAudience]}: when a request does not name its audience, assume this one and do not ask about it nor lower the audience grade for it.`
      : '',
  ]
    .filter(Boolean)
    .join('\n');
};
