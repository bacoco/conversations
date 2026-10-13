import { useCallback, useEffect, useRef, useState } from 'react';

import { FILL_MODEL } from '../coach/coachApi';
import { caseById, casesOf } from '../jobs/jobs';
import { useCasesStore } from '../learn/cases/casesProgress';
import { useCoachPrefsStore } from '../stores/useCoachPrefsStore';
import { useMainConversationStore } from '../stores/useMainConversationStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';
import { useTrainerStore } from '../stores/useTrainerStore';

import { unfoundNumbers } from './facts';
import { adviseRequest, checkFix } from './nestorChatApi';
import type { TipState } from './types';
import { withWords } from './useNestorChat';

/** What the trainer says under its card, when a click cannot go on. */
export type TrainerNotice = 'write-first' | 'failed' | null;

/** The request itself: what is written above the case's texts. */
const requestOf = (field: string) => field.split('\n\n')[0].trim();

const setField = (text: string) =>
  usePromptToolkitStore.getState().setChatInput?.(text);

/** The central field, ready to type at its very start. */
const focusFieldStart = () => {
  const field = document.querySelector<HTMLTextAreaElement>(
    'textarea[name="inputchat-textarea"]',
  );
  field?.focus();
  field?.setSelectionRange(0, 0);
};

/**
 * The trainer: one case of the user's job, one step at a time — read,
 * write one's own request, Nestor's advice, compare with a good request,
 * check the Assistant's answer. Everything the user writes is written in
 * the Assistant's field, as in real work.
 */
export const useTrainer = (language: string) => {
  const state = useTrainerStore();
  const item = state.caseId ? caseById(state.caseId) : null;
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<TrainerNotice>(null);
  const controllerRef = useRef<AbortController | null>(null);
  useEffect(() => () => controllerRef.current?.abort(), []);
  const update = useTrainerStore.getState().update;

  /** One call at a time; a failure says so and leaves the step as it was. */
  const call = useCallback(
    async (task: (signal: AbortSignal) => Promise<void>) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setBusy(true);
      setNotice(null);
      try {
        await task(controller.signal);
      } catch {
        if (!controller.signal.aborted) setNotice('failed');
      } finally {
        if (controllerRef.current === controller) setBusy(false);
      }
    },
    [],
  );

  const material = item?.material ?? '';
  const withMaterial = (request: string) =>
    material ? `${request}\n\n${material}` : request;

  const readDone = useCallback(() => {
    setField(withMaterial(''));
    update({ step: 'ask' });
    focusFieldStart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [material, update]);

  const useBeginnerRequest = useCallback(() => {
    if (item) setField(withMaterial(item.startingRequest));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, material]);

  /** A request dictated at the microphone, above the case's texts. */
  const saidRequest = useCallback(
    (text: string) => setField(withMaterial(text.trim())),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [material],
  );

  const myRequestDone = useCallback(() => {
    const field = usePromptToolkitStore.getState().chatInput;
    if (!requestOf(field)) {
      setNotice('write-first');
      focusFieldStart();
      return;
    }
    void call(async (signal) => {
      const advice = await adviseRequest(
        field,
        language,
        signal,
        [],
        useCoachPrefsStore.getState().knownParts,
      );
      update({ advice, tipStates: {}, step: 'advice' });
    });
  }, [call, language, update]);

  const tipAction = useCallback(
    (index: number, tipState: TipState) => {
      const tip = useTrainerStore.getState().advice?.tips[index];
      if (!tip) return;
      if (tipState === 'added' && tip.add) {
        setField(
          withWords(usePromptToolkitStore.getState().chatInput, tip.add),
        );
      }
      if (tipState === 'known' && tip.part) {
        useCoachPrefsStore.getState().addKnownPart(tip.part);
      }
      update({
        tipStates: {
          ...useTrainerStore.getState().tipStates,
          [index]: tipState,
        },
      });
    },
    [update],
  );

  /** « J'ai corrigé »: the key points of the case, on the request alone. */
  const corrected = useCallback(() => {
    if (!item) return;
    const mine = requestOf(usePromptToolkitStore.getState().chatInput);
    if (!mine) {
      setNotice('write-first');
      return;
    }
    void call(async (signal) => {
      const { done } = await checkFix(
        mine,
        item.keyPoints.map((point) => point.point),
        language,
        signal,
        FILL_MODEL,
      );
      update({ mine, points: done, step: 'compare' });
    });
  }, [call, item, language, update]);

  /** The good request, or the user's own, in the field: then « Envoyer ». */
  const useGood = useCallback(() => {
    if (!item) return;
    setField(withMaterial(item.goodRequest));
    update({ placed: 'good' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item, material, update]);

  const useMine = useCallback(() => {
    update({ placed: 'mine' });
    focusFieldStart();
  }, [update]);

  // The answer to the request sent: what to check in it.
  const answerId = useMainConversationStore(
    (main) => main.latestCompletedAssistantMessageId,
  );
  const isResponding = useMainConversationStore(
    (main) => main.isAssistantResponding,
  );
  useEffect(() => {
    const now = useTrainerStore.getState();
    if (now.step !== 'compare' || !now.placed || !answerId || isResponding) {
      return;
    }
    const turns = useMainConversationStore.getState().turns;
    const answer = turns.findLast((turn) => turn.role === 'assistant')?.text;
    const sent = turns.findLast((turn) => turn.role === 'user')?.text ?? '';
    if (!answer) return;
    update({
      step: 'verify',
      unfound: unfoundNumbers(answer, [material, sent]),
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [answerId, isResponding]);

  const check = useCallback(
    (index: number, yes: boolean) =>
      update({
        checks: { ...useTrainerStore.getState().checks, [index]: yes },
      }),
    [update],
  );

  const verified = useCallback(() => {
    if (state.caseId) useCasesStore.getState().markDone(state.caseId);
    update({ step: 'done' });
  }, [state.caseId, update]);

  // The next case of the same job not done yet, else the next one at all.
  const jobCases = item ? casesOf(item.jobId) : [];
  const done = useCasesStore((cases) => cases.done);
  const others = jobCases.filter((other) => other.id !== state.caseId);
  const nextCaseId =
    (others.find((other) => !done[other.id]) ?? others[0])?.id ?? null;

  const nextCase = useCallback(() => {
    if (nextCaseId) {
      const from = useTrainerStore.getState().from;
      useTrainerStore.getState().start(nextCaseId, from);
    }
  }, [nextCaseId]);

  /** The end: back to where the user came from (the home page if none). */
  const leave = useCallback(() => {
    const from = useTrainerStore.getState().from;
    useTrainerStore.getState().stop();
    const panel = usePromptToolkitStore.getState();
    if (from) panel.openSection(from);
    else panel.goHome();
  }, []);

  return {
    ...state,
    item,
    busy,
    notice,
    readDone,
    useBeginnerRequest,
    saidRequest,
    myRequestDone,
    tipAction,
    corrected,
    useGood,
    useMine,
    check,
    verified,
    nextCaseId,
    nextCase,
    leave,
  };
};

export type Trainer = ReturnType<typeof useTrainer>;
