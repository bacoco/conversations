import { useEffect, useRef } from 'react';

import type { BarAction } from '../chat/types';
import type { NestorChat } from '../chat/useNestorChat';
import { DEMO_STEPS, useDemoStore } from '../stores/useDemoStore';

/**
 * During the demo: a button clicked does its real work; once it is done,
 * Nestor explains it under the answer and the ring moves to the next button.
 */
export const useDemoGuide = (chat: NestorChat) => {
  const active = useDemoStore((state) => state.active);
  const done = useDemoStore((state) => state.done);
  const pending = useRef<BarAction | null>(null);
  const last = chat.messages.at(-1);

  const explain = (step: BarAction) => {
    // Under the latest message and its buttons, never inside the thread.
    const after = chat.messages.at(-1)?.id ?? '';
    const demo = useDemoStore.getState();
    demo.addNote({ after, step });
    demo.markDone(step);
    if (
      DEMO_STEPS.every((item) => useDemoStore.getState().done.includes(item))
    ) {
      demo.addNote({ after, step: 'end' });
    }
  };

  useEffect(() => {
    const step = pending.current;
    // Done when Nestor is no longer working and has said something back.
    if (!active || !step || chat.busy || !last || last.kind === 'user') {
      return;
    }
    pending.current = null;
    explain(step);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, chat.busy, last?.id]);

  const onBar = (step: BarAction) => {
    if (!active) return;
    if (step === 'ask') {
      // The sheet opens at once: the explanation waits under it.
      explain(step);
      return;
    }
    pending.current = step;
  };

  return {
    active,
    onBar,
    next: active ? DEMO_STEPS.find((step) => !done.includes(step)) : undefined,
  };
};
