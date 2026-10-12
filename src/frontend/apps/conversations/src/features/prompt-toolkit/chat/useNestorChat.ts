import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useConversationRouteId } from '@/utils';

import {
  CoachFollowUp,
  NextGroup,
  chatWithNestor,
  coachThreadNote,
  coachThreadReply,
  reviewSession,
} from '../coach/coachApi';
import { detectSensitiveData } from '../coach/sensitiveData';
import { answerGaps } from '../coach/useAfterAnswer';
import { LESSON_FOR_COMPETENCY } from '../learn/lessonForCompetency';
import { searchPhrases } from '../library/embeddingSearch';
import { getPhrases } from '../phrases';
import { useReward } from '../rewards/useReward';
import { useMainConversationStore } from '../stores/useMainConversationStore';
import {
  NEW_CHAT_KEY,
  actionOf,
  messagesOf,
  pendingRounds,
  useNestorChatStore,
} from '../stores/useNestorChatStore';
import { useProfileStore } from '../stores/useProfileStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';
import { usePlacePrompt } from '../tools/usePlacePrompt';

import { decideBarAction } from './barGuard';
import { barLabel, roundLabel } from './labels';
import {
  VersionInput,
  adviceCount,
  checkRequest,
  hasHoles,
  writeVersion,
} from './nestorChatApi';
import { questionState } from './questions';
import { carryOver } from './rounds';
import type {
  BarAction,
  NestorMessage,
  NewMessage,
  Round,
  UserVia,
} from './types';

export type BusyKind = BarAction | 'advice' | 'version' | 'reply';

type Find<K extends NestorMessage['kind']> = Extract<
  NestorMessage,
  { kind: K }
>;

const lastOf = <K extends NestorMessage['kind']>(
  messages: NestorMessage[],
  kind: K,
) => messages.findLast((message): message is Find<K> => message.kind === kind);

/**
 * The request a round of questions is about: the analysis or the version
 * just before its first question, never an older one.
 */
const roundSource = (messages: NestorMessage[]) => {
  const start = messages.findLastIndex(
    (message) => message.kind === 'question' && message.index === 0,
  );
  for (let index = start - 1; index >= 0; index -= 1) {
    const message = messages[index];
    if (message.kind === 'analysis') return message.draft;
    if (message.kind === 'version') return message.version;
  }
  return '';
};

/** The central field, focused when Nestor asks to write in it. */
const focusAssistantField = () =>
  document
    .querySelector<HTMLTextAreaElement>('textarea[name="inputchat-textarea"]')
    ?.focus();

/**
 * Nestor's chat: each click (bar, round, answer, microphone) becomes
 * messages in the thread. Nothing here draws: the thread is the state.
 */
export const useNestorChat = (language: string) => {
  const { t, i18n } = useTranslation();
  const conversationId = useConversationRouteId();
  const key = conversationId ?? NEW_CHAT_KEY;
  const messages = useNestorChatStore((state) => messagesOf(state.chats, key));
  const action = useNestorChatStore((state) => actionOf(state.chats, key));
  const store = useNestorChatStore.getState;
  const placePrompt = usePlacePrompt();
  const reward = useReward();
  const [busy, setBusy] = useState<BusyKind | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const questions = useMemo(() => questionState(messages), [messages]);

  // A thread belongs to one conversation: a call in flight stops.
  useEffect(() => {
    controllerRef.current?.abort();
    setBusy(null);
  }, [key]);
  useEffect(() => () => controllerRef.current?.abort(), []);

  const post = useCallback(
    (message: NewMessage, rounds: Round[] = []) => {
      const all = carryOver(
        pendingRounds(messagesOf(store().chats, key)),
        rounds,
      );
      return store().post(
        key,
        all.length ? { ...message, rounds: all } : message,
      );
    },
    [key, store],
  );

  /** One AI call at a time; a new one stops the previous one. */
  const run = useCallback(
    async (
      kind: BusyKind,
      retry: BarAction | null,
      task: (signal: AbortSignal, say: typeof post) => Promise<void>,
    ) => {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;
      setBusy(kind);
      // A call stopped (new call, new request, other conversation) writes
      // nothing, even if its answer arrives.
      const say: typeof post = (message, rounds) =>
        controller.signal.aborted ? '' : post(message, rounds);
      try {
        await task(controller.signal, say);
      } catch {
        if (!controller.signal.aborted && retry) {
          post({ kind: 'error', retry }, [{ id: 'retry', primary: true }]);
        }
      } finally {
        if (controllerRef.current === controller) setBusy(null);
      }
    },
    [post],
  );

  const draftNow = () => usePromptToolkitStore.getState().chatInput.trim();

  const warnSensitive = (text: string, say: typeof post) => {
    if (detectSensitiveData(text).length) {
      say({ kind: 'warning', text: 'sensitive' });
    }
  };

  /**
   * The caller says what the version is made of: answers and skips of the
   * open round only, never those of an earlier request.
   */
  const writeVersionInto = useCallback(
    async (
      input: VersionInput,
      extra: Round[],
      signal: AbortSignal,
      say: typeof post,
    ) => {
      const version = await writeVersion(input, language, signal);
      const missing = input.skipped;
      say({ kind: 'version', original: input.draft, version, missing }, [
        ...(missing.length
          ? [{ id: 'redo-with-missing', primary: true } as Round]
          : []),
        { id: 'shorter' },
        { id: 'other-version' },
        ...extra,
      ]);
      reward('improvement');
    },
    [language, reward],
  );

  const writeAndPost = useCallback(
    (input: VersionInput, extra: Round[] = []) => {
      void run('version', 'improve', (signal, say) =>
        writeVersionInto(input, extra, signal, say),
      );
    },
    [run, writeVersionInto],
  );

  /**
   * "Améliorer mon texte" on a new request: when only the user knows what
   * is missing, the questions come first; a version made without it would
   * say nothing.
   */
  const runImprove = useCallback(() => {
    const draft = draftNow();
    void run('improve', 'improve', async (signal, say) => {
      const check = await checkRequest(draft, language, signal);
      warnSensitive(draft, say);
      if (check.missing.length) {
        say({ kind: 'analysis', draft, check });
        say({ kind: 'question', index: 0, items: check.missing });
        return;
      }
      await writeVersionInto(
        { draft, answers: [], skipped: [] },
        [],
        signal,
        say,
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, run, writeVersionInto]);

  const runAnalyse = useCallback(() => {
    const draft = draftNow();
    void run('analyse', 'analyse', async (signal, say) => {
      const check = await checkRequest(draft, language, signal);
      warnSensitive(draft, say);
      say(
        { kind: 'analysis', draft, check },
        check.missing.length
          ? [{ id: 'complete', primary: true }, { id: 'create-without' }]
          : [],
      );
      reward('analysis');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language, post, reward, run]);

  const runReview = useCallback(() => {
    const { turns, latestCompletedAssistantMessageId } =
      useMainConversationStore.getState();
    const all = messagesOf(store().chats, key);
    const prompts = turns
      .filter((turn) => turn.role === 'user')
      .map((turn) => turn.text);
    // Advice counts only when a later request could apply it.
    const advice = all
      .filter((message): message is Find<'advice'> => message.kind === 'advice')
      .map((message) => ({
        afterPrompt: turns
          .slice(0, message.note.upTo)
          .filter((turn) => turn.role === 'user').length,
        text: message.note.tryNow,
      }))
      .filter((item) => item.afterPrompt < prompts.length);
    void run('review', 'review', async (signal, say) => {
      const review = await reviewSession(prompts, language, signal, advice);
      const lastAdvice = lastOf(all, 'advice');
      const lesson = lastAdvice?.note.competency
        ? LESSON_FOR_COMPETENCY[lastAdvice.note.competency]
        : undefined;
      say(
        {
          kind: 'review',
          review,
          ...adviceCount(all),
          answerId: latestCompletedAssistantMessageId ?? '',
        },
        [{ id: 'new-request' }, ...(lesson ? [{ id: 'lesson' } as Round] : [])],
      );
    });
  }, [key, language, run, store]);

  const runBar = useCallback(
    (bar: BarAction) => {
      const all = messagesOf(store().chats, key);
      const {
        latestCompletedAssistantMessageId: answerId,
        isAssistantResponding,
      } = useMainConversationStore.getState();
      const decision = decideBarAction(bar, {
        draft: draftNow(),
        hasAnswer: !!answerId && !isAssistantResponding,
        reviewUpToDate:
          !!answerId && lastOf(all, 'review')?.answerId === answerId,
        questionsOpen: questionState(all).current !== null,
      });
      if (bar === 'ask') {
        setSheetOpen(true);
        return;
      }
      store().beginAction(key);
      // What was clicked shows on the user's side, as in a chat.
      store().post(key, {
        kind: 'user',
        via: 'action',
        text: barLabel(t, bar),
      });
      if (decision.kind === 'hint') {
        post({ kind: 'hint', hint: decision.hint });
        if (decision.focusField) focusAssistantField();
        return;
      }
      if (decision.kind === 'reshow-review') {
        const review = lastOf(all, 'review');
        if (review) {
          // Shown again at the end, as it was: no new call.
          const {
            id: _id,
            action: _action,
            rounds: _rounds,
            ...again
          } = review;
          post(again);
        }
        return;
      }
      const resume: Round[] = decision.resumeQuestions
        ? [{ id: 'resume-questions' }]
        : [];
      // During the questions, a snapshot: what was answered so far.
      const open = questionState(all);
      if (bar === 'analyse') runAnalyse();
      if (bar === 'improve') {
        if (open.current) {
          writeAndPost(
            {
              draft: draftNow(),
              answers: open.answers,
              skipped: open.skipped,
            },
            resume,
          );
        } else {
          runImprove();
        }
      }
      if (bar === 'review') runReview();
    },
    [key, post, runAnalyse, runImprove, runReview, store, t, writeAndPost],
  );

  const askQuestion = useCallback(
    (items: Find<'question'>['items'], index: number) => {
      post({ kind: 'question', index, items });
    },
    [post],
  );

  const answerQuestion = useCallback(
    (text: string, via: UserVia) => {
      const state = questionState(messagesOf(store().chats, key));
      const current = state.current;
      if (!current) return;
      store().post(key, { kind: 'user', text, via, answers: current.id });
      const next = current.index + 1;
      if (via !== 'stop' && next < current.items.length) {
        askQuestion(current.items, next);
        return;
      }
      store().beginAction(key);
      // After a send the field is empty: the round started from the last
      // version ("Refaire avec…"), else from the analysed draft.
      const all = messagesOf(store().chats, key);
      const done = questionState(all);
      writeAndPost({
        draft: draftNow() || roundSource(all),
        answers: done.answers,
        skipped: done.skipped,
      });
    },
    [askQuestion, key, store, writeAndPost],
  );

  /** "Voir des exemples": close to the job when one is chosen. */
  const showExamples = useCallback(
    (said: () => void) => {
      const job = useProfileStore.getState().job;
      const code = language === 'French' ? 'fr' : 'en';
      store().beginAction(key);
      said();
      if (!job) {
        const firsts = ['email', 'meeting', 'summary'].map(
          (category) =>
            getPhrases(code).find((phrase) => phrase.category.id === category)
              ?.text ?? '',
        );
        post({
          kind: 'pistes',
          phrases: firsts.filter(Boolean),
          examples: true,
        });
        return;
      }
      void run('reply', null, async (signal, say) => {
        const found = await searchPhrases(job.label, code, 3, signal);
        say({
          kind: 'pistes',
          phrases: found.map((phrase) => phrase.text),
          examples: true,
        });
      });
    },
    [key, language, post, run, store],
  );

  const runRound = useCallback(
    (messageId: string, round: Round) => {
      // The welcome's round has no stored message.
      const all = messagesOf(store().chats, key);
      const version = lastOf(all, 'version');
      const said = (chosen: boolean) =>
        store().post(key, {
          kind: 'user',
          via: 'action',
          text: roundLabel(t, i18n.language, round.id, {
            missing: version?.missing ?? [],
            chosen,
          }),
        });
      if (round.id === 'examples') {
        if (messageId !== 'hello') store().consumeRounds(key, messageId);
        showExamples(() => said(false));
        return;
      }
      const message = all.find((item) => item.id === messageId);
      if (!message) return;
      store().consumeRounds(key, messageId);
      store().beginAction(key);
      said(message.kind === 'chosen');
      const analysis = lastOf(all, 'analysis');
      switch (round.id) {
        case 'complete':
          if (analysis) askQuestion(analysis.check.missing, 0);
          break;
        case 'create-without':
          if (analysis) {
            writeAndPost({
              draft: draftNow() || analysis.draft,
              answers: [],
              skipped: analysis.check.missing.map((item) => item.short),
            });
          }
          break;
        case 'redo-with-missing':
          if (version) {
            const items = (analysis?.check.missing ?? []).filter((item) =>
              version.missing.includes(item.short),
            );
            if (items.length) askQuestion(items, 0);
          }
          break;
        case 'shorter':
        case 'other-version':
          if (version) {
            // The version already holds the answers; what is missing stays so.
            writeAndPost({
              draft: version.version,
              answers: [],
              skipped: version.missing,
              style: round.id === 'shorter' ? 'shorter' : 'other',
            });
          }
          break;
        case 'undo':
          if (message.kind === 'placed' || message.kind === 'chosen') {
            usePromptToolkitStore.getState().setChatInput?.(message.previous);
            store().markUndone(key, messageId);
          }
          break;
        case 'resume-questions': {
          const current = questionState(all).current;
          if (current) askQuestion(current.items, current.index);
          break;
        }
        case 'new-request':
          usePromptToolkitStore.getState().setChatInput?.('');
          post({ kind: 'hint', hint: 'new-request' });
          focusAssistantField();
          break;
        case 'lesson': {
          const competency = lastOf(all, 'advice')?.note.competency;
          const lesson = competency
            ? LESSON_FOR_COMPETENCY[competency]
            : undefined;
          if (lesson)
            usePromptToolkitStore
              .getState()
              .openLesson(lesson.lessonId, lesson.slide);
          break;
        }
        case 'retry':
          if (message.kind === 'error') runBar(message.retry);
          break;
      }
    },
    [
      askQuestion,
      i18n.language,
      key,
      post,
      runBar,
      showExamples,
      store,
      t,
      writeAndPost,
    ],
  );

  const placeVersion = useCallback(
    (messageId: string) => {
      const version = messagesOf(store().chats, key).find(
        (item): item is Find<'version'> =>
          item.id === messageId && item.kind === 'version',
      );
      if (!version) return;
      const previous = usePromptToolkitStore.getState().chatInput;
      placePrompt(version.version, { replaceDraft: true });
      store().beginAction(key);
      post({ kind: 'placed', previous }, [{ id: 'undo' }]);
    },
    [key, placePrompt, post, store],
  );

  const choosePiste = useCallback(
    (text: string, phrases: string[]) => {
      const previous = usePromptToolkitStore.getState().chatInput;
      usePromptToolkitStore.getState().setChatInput?.(text);
      store().beginAction(key);
      store().post(key, { kind: 'pistes', phrases });
      post({ kind: 'chosen', text, previous }, [{ id: 'undo' }]);
    },
    [key, post, store],
  );

  const askNestor = useCallback(
    (text: string, via: 'voice' | 'keyboard') => {
      setSheetOpen(false);
      store().beginAction(key);
      store().post(key, { kind: 'user', text, via });
      const history = messagesOf(store().chats, key)
        .filter(
          (m): m is Find<'user'> | Find<'reply'> =>
            m.kind === 'reply' ||
            (m.kind === 'user' && !m.answers && m.via !== 'action'),
        )
        .slice(-8)
        .map((m) =>
          m.kind === 'user'
            ? { role: 'user' as const, text: m.text }
            : {
                role: 'nestor' as const,
                text: m.text,
                ...(m.prompt ? { prompt: m.prompt } : {}),
              },
        );
      void run('reply', 'ask', async (signal, say) => {
        const reply = await chatWithNestor(
          history,
          language,
          'the coach chat',
          signal,
          useMainConversationStore.getState().turns,
        );
        say({ kind: 'reply', text: reply.text, prompt: reply.prompt });
      });
    },
    [key, language, run, store],
  );

  const askAbout = useCallback(
    (messageId: string, ask: CoachFollowUp) => {
      const advice = messagesOf(store().chats, key).find(
        (item): item is Find<'advice'> =>
          item.id === messageId && item.kind === 'advice',
      );
      if (!advice) return;
      void run('reply', null, async (signal, say) => {
        const reply = await coachThreadReply(
          advice.note,
          ask,
          useMainConversationStore.getState().turns,
          language,
          signal,
        );
        say({
          kind: 'reply',
          text: reply.text,
          prompt: reply.prompt || undefined,
        });
      });
    },
    [key, language, run, store],
  );

  /** Nestor's advice on the latest answer (Auto, or asked). */
  const postAdvice = useCallback(
    (answerId: string) => {
      const all = messagesOf(store().chats, key);
      const turns = useMainConversationStore.getState().turns;
      const previous = lastOf(all, 'advice')?.note ?? null;
      const missing = lastOf(all, 'version')?.missing ?? [];
      const answer =
        turns.findLast((turn) => turn.role === 'assistant')?.text ?? '';
      const gaps = answerGaps(answer);
      void run('advice', null, async (signal, say) => {
        const note = await coachThreadNote(
          turns,
          previous,
          language,
          signal,
          gaps,
          missing,
        );
        const lesson = note.competency
          ? LESSON_FOR_COMPETENCY[note.competency]
          : undefined;
        say(
          { kind: 'advice', note, missing, gaps, answerId },
          missing.length
            ? [{ id: 'redo-with-missing', primary: true }]
            : lesson
              ? [{ id: 'lesson' }]
              : [],
        );
      });
    },
    [key, language, run, store],
  );

  /** Ways to go on: a suggestion holding a blank is never offered. */
  const postSuites = useCallback(
    (answerId: string, groups: NextGroup[]) => {
      const whole = groups
        .map((group) => ({
          ...group,
          questions: group.questions.filter((question) => !hasHoles(question)),
        }))
        .filter((group) => group.questions.length > 0);
      if (whole.length) post({ kind: 'suites', groups: whole, answerId });
    },
    [post],
  );

  /** "Demande n · 10 h 12": a request was sent to the Assistant. */
  const postRequest = useCallback(
    (n: number) => {
      // What Nestor was preparing belongs to the earlier request.
      controllerRef.current?.abort();
      setBusy(null);
      store().beginAction(key);
      store().post(key, { kind: 'request', n, at: Date.now() });
    },
    [key, store],
  );

  const usePrompt = useCallback(
    (text: string) => placePrompt(text),
    [placePrompt],
  );

  const clear = useCallback(() => {
    controllerRef.current?.abort();
    setBusy(null);
    store().clear(key);
  }, [key, store]);

  return {
    key,
    messages,
    action,
    busy,
    questions,
    sheetOpen,
    setSheetOpen,
    runBar,
    runRound,
    answerQuestion,
    askNestor,
    choosePiste,
    placeVersion,
    askAbout,
    usePrompt,
    postAdvice,
    postSuites,
    postRequest,
    clear,
  };
};

export type NestorChat = ReturnType<typeof useNestorChat>;
