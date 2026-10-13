import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useConversationRouteId } from '@/utils';

import {
  CoachFollowUp,
  NextGroup,
  coachThreadNote,
  coachThreadReply,
  reviewSession,
} from '../coach/coachApi';
import { detectSensitiveData } from '../coach/sensitiveData';
import { answerGaps } from '../coach/useAfterAnswer';
import { jobById } from '../jobs/jobs';
import { LESSON_FOR_COMPETENCY } from '../learn/lessonForCompetency';
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

import { authorOf } from './author';
import { decideBarAction } from './barGuard';
import { ExamplePair, examplePairs } from './examples';
import { barLabel, roundLabel } from './labels';
import {
  CoachTurn,
  VersionInput,
  adviceCount,
  adviseRequest,
  checkRequest,
  coachChat,
  hasHoles,
  writeChoices,
  writeVersion,
} from './nestorChatApi';
import { PASTED_ANSWER_CHARS, questionState } from './questions';
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

/** Nestor's last steps in a few words: what he knows he has done. */
const doneSteps = (messages: NestorMessage[]) =>
  messages
    .filter((message) => message.kind !== 'user' && message.kind !== 'request')
    .slice(-5)
    .map((message) => {
      switch (message.kind) {
        case 'analysis':
          return 'Read the request in the field with the five lines';
        case 'counsel':
          return `Gave advice on the request: ${message.advice.tips
            .map((tip) => tip.text)
            .join(' ')}`;
        case 'versions':
          return `Wrote ${message.items.length} version(s) of the request`;
        case 'placed':
          return 'Put a version in the Assistant’s field';
        case 'advice':
          return `Advice after the Assistant’s answer: ${message.note.tryNow}`;
        case 'review':
          return 'Did the review of the session';
        case 'reply':
          return `Said: ${message.text}`;
        default:
          return '';
      }
    })
    .filter(Boolean);

/** The free talk with Nestor: what was said, not the clicks. */
const coachHistory = (messages: NestorMessage[], extra?: string) => {
  const history: CoachTurn[] = messages
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
  return extra ? [...history, { role: 'user' as const, text: extra }] : history;
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
      // The lesson is about a line of the grid this request did not say.
      const analysis = messagesOf(store().chats, key).findLast(
        (message): message is Find<'analysis'> =>
          message.kind === 'analysis' && message.draft === input.draft,
      );
      const gaps =
        analysis?.check.grid
          .filter((line) => !line.words)
          .map((line) => line.part) ?? [];
      const { version, lesson, parts, rule } = await writeVersion(
        { gaps, ...input },
        language,
        signal,
      );
      const missing = input.skipped;
      say(
        {
          kind: 'version',
          original: input.draft,
          version,
          missing,
          ...(lesson && { lesson }),
          ...(parts && { parts }),
          ...(rule && { rule }),
        },
        [
          ...(missing.length
            ? [{ id: 'redo-with-missing', primary: true } as Round]
            : []),
          { id: 'shorter' },
          { id: 'other-version' },
          ...extra,
        ],
      );
      reward('improvement');
    },
    [key, language, reward, store],
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
   * « Améliorer mon texte » and « Compléter »: Nestor's advice first, never
   * a question; the text comes after, when the user asks for it.
   */
  const runCounsel = useCallback(
    (draft: string) => {
      void run('improve', 'improve', async (signal, say) => {
        const advice = await adviseRequest(
          draft,
          language,
          signal,
          useMainConversationStore.getState().turns,
        );
        warnSensitive(draft, say);
        say({ kind: 'counsel', draft, advice }, [
          { id: 'give-text', primary: true },
          { id: 'two-versions' },
          { id: 'fix-myself' },
          { id: 'say' },
        ]);
      });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language, run],
  );

  /** The text at the end: one request, or two to choose from. */
  const runChoices = useCallback(
    (draft: string, count: 1 | 2, tips: string[]) => {
      void run('version', 'improve', async (signal, say) => {
        const items = await writeChoices(
          { draft, count, tips },
          language,
          signal,
        );
        say({ kind: 'versions', draft, items }, [{ id: 'say' }]);
        reward('improvement');
      });
    },
    [language, reward, run],
  );

  const runAnalyse = useCallback(() => {
    const draft = draftNow();
    void run('analyse', 'analyse', async (signal, say) => {
      const check = await checkRequest(
        draft,
        language,
        signal,
        useMainConversationStore.getState().turns,
      );
      warnSensitive(draft, say);
      say(
        { kind: 'analysis', draft, check },
        check.missing.length
          ? [
              { id: 'complete', primary: true },
              { id: 'create-without' },
              { id: 'say' },
            ]
          : [{ id: 'say' }],
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
    // Advice counts only when a later request could apply it; whether it
    // was applied is what the next advice checked, never a guess.
    const notes = all.filter(
      (message): message is Find<'advice'> => message.kind === 'advice',
    );
    const advice = notes
      .map((message, index) => {
        const applied = notes[index + 1]?.note.applied;
        return {
          afterPrompt: turns
            .slice(0, message.note.upTo)
            .filter((turn) => turn.role === 'user').length,
          text: `${message.note.tryNow} (applied: ${
            applied === true ? 'yes' : applied === false ? 'no' : 'unknown'
          })`,
        };
      })
      .filter((item) => item.afterPrompt < prompts.length);
    void run('review', 'review', async (signal, say) => {
      const requests = all.filter(
        (message): message is Find<'request'> => message.kind === 'request',
      );
      // The lines of the grid most often left unsaid in this session.
      const unsaid = new Map<string, number>();
      all.forEach((message) => {
        if (message.kind !== 'analysis') return;
        message.check.grid
          .filter((line) => !line.words)
          .forEach((line) =>
            unsaid.set(line.part, (unsaid.get(line.part) ?? 0) + 1),
          );
      });
      const gaps = [...unsaid.entries()]
        .sort((a, b) => b[1] - a[1])
        .map(([part]) => part);
      const authors = prompts.map(
        (_, index) =>
          requests.findLast((message) => message.n === index + 1)?.by ?? 'user',
      );
      const review = await reviewSession(
        prompts,
        language,
        signal,
        advice,
        authors,
        gaps,
      );
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
    /** From words said to Nestor: the words already show, no echo. */
    (bar: BarAction, fromWords = false) => {
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
      if (!fromWords) {
        store().beginAction(key);
        // What was clicked shows on the user's side, as in a chat.
        store().post(key, {
          kind: 'user',
          via: 'action',
          text: barLabel(t, bar),
        });
      }
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
          runCounsel(draftNow());
        }
      }
      if (bar === 'review') runReview();
    },
    [key, post, runAnalyse, runCounsel, runReview, store, t, writeAndPost],
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
      // A pasted text (notes, an email) answers the rest: no more questions.
      const pasted = text.trim().length > PASTED_ANSWER_CHARS;
      if (via !== 'stop' && !pasted && next < current.items.length) {
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
      store().beginAction(key);
      said();
      // Before / after: the request as many write it, then a good one.
      post({ kind: 'examples', pairs: examplePairs(jobById(job?.id)?.id) });
    },
    [key, post, store],
  );

  /** « Essayer avec cette demande »: the vague one, to improve oneself. */
  const tryExample = useCallback(
    (pair: ExamplePair) => {
      const previous = usePromptToolkitStore.getState().chatInput;
      const text = pair.material
        ? `${pair.before}\n\n${pair.material}`
        : pair.before;
      placePrompt(text, { replaceDraft: true });
      store().beginAction(key);
      post({ kind: 'chosen', text, previous }, [{ id: 'undo' }]);
      post({ kind: 'hint', hint: 'improve-it' });
    },
    [key, placePrompt, post, store],
  );

  /**
   * Nestor called: he sees the field, the conversation and his own steps.
   * Words that ask for a button run it; words that could mean two things
   * get « Vous parlez de quoi ? »; anything else gets a coach's answer.
   */
  const replyAsCoach = useCallback(
    (extra?: string) => {
      const all = messagesOf(store().chats, key);
      const history = coachHistory(all, extra);
      void run('reply', 'ask', async (signal, say) => {
        const reply = await coachChat(
          { history, draft: draftNow(), done: doneSteps(all) },
          language,
          signal,
          useMainConversationStore.getState().turns,
        );
        if (reply.action === 'clarify') {
          say({ kind: 'reply', text: reply.text }, [
            { id: 'clarify-request' },
            { id: 'clarify-answer' },
            { id: 'say' },
          ]);
          return;
        }
        // Reading or improving needs a request in the field: with none,
        // the words were about something else, and Nestor's answer stands.
        const needsDraft =
          reply.action === 'analyse' || reply.action === 'improve';
        if (reply.action && !(needsDraft && !draftNow())) {
          if (reply.text) say({ kind: 'reply', text: reply.text });
          runBar(reply.action, true);
          return;
        }
        say(
          {
            kind: 'reply',
            text: reply.text,
            ...(reply.prompt && { prompt: reply.prompt }),
          },
          [{ id: 'say' }],
        );
      });
    },
    [key, language, run, runBar, store],
  );

  const askNestor = useCallback(
    (text: string, via: 'voice' | 'keyboard') => {
      setSheetOpen(false);
      store().beginAction(key);
      store().post(key, { kind: 'user', text, via });
      replyAsCoach();
    },
    [key, replyAsCoach, store],
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
      // The microphone opens; the buttons stay for when it closes.
      if (round.id === 'say') {
        setSheetOpen(true);
        return;
      }
      if (round.id === 'examples') {
        if (messageId !== 'hello') store().consumeRounds(key, messageId);
        showExamples(() => said(false));
        return;
      }
      const message = all.find((item) => item.id === messageId);
      if (!message) return;
      store().consumeRounds(key, messageId);
      // "Annuler" belongs to the step it cancels: no new step, no echo.
      if (round.id !== 'undo') {
        store().beginAction(key);
        said(message.kind === 'chosen');
      }
      const analysis = lastOf(all, 'analysis');
      switch (round.id) {
        case 'complete':
          if (analysis) runCounsel(draftNow() || analysis.draft);
          break;
        case 'create-without':
          if (analysis) runChoices(draftNow() || analysis.draft, 1, []);
          break;
        case 'give-text':
        case 'two-versions':
          if (message.kind === 'counsel') {
            runChoices(
              message.draft,
              round.id === 'give-text' ? 1 : 2,
              message.advice.tips.map((tip) => tip.text),
            );
          }
          break;
        case 'fix-myself':
          post({ kind: 'hint', hint: 'fix-myself' });
          focusAssistantField();
          break;
        case 'clarify-request':
          runBar('improve', true);
          break;
        case 'clarify-answer':
          replyAsCoach("I mean the Assistant's last answer, not my request.");
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
      replyAsCoach,
      runBar,
      runChoices,
      runCounsel,
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

  /** One of the versions at the end of the advice, put in the field. */
  const placeChoice = useCallback(
    (messageId: string, index: number) => {
      const versions = messagesOf(store().chats, key).find(
        (item): item is Find<'versions'> =>
          item.id === messageId && item.kind === 'versions',
      );
      const choice = versions?.items[index];
      if (!choice) return;
      const previous = usePromptToolkitStore.getState().chatInput;
      placePrompt(choice.text, { replaceDraft: true });
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
      const author = lastOf(all, 'request')?.by ?? 'user';
      void run('advice', null, async (signal, say) => {
        const note = await coachThreadNote(
          turns,
          previous,
          language,
          signal,
          gaps,
          missing,
          author,
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
      // Who wrote it: Nestor's text as given, added to, or the user's own.
      const sent =
        useMainConversationStore
          .getState()
          .turns.findLast((turn) => turn.role === 'user')?.text ?? '';
      const nestorTexts = messagesOf(store().chats, key).flatMap((message) =>
        message.kind === 'chosen'
          ? [message.text]
          : message.kind === 'version'
            ? [message.version]
            : message.kind === 'versions'
              ? message.items.map((item) => item.text)
              : [],
      );
      store().post(key, {
        kind: 'request',
        n,
        at: Date.now(),
        by: authorOf(sent, nestorTexts),
      });
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
    tryExample,
    placeVersion,
    placeChoice,
    askAbout,
    usePrompt,
    postAdvice,
    postSuites,
    postRequest,
    clear,
  };
};

export type NestorChat = ReturnType<typeof useNestorChat>;
