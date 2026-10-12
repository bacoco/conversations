import type { MissingItem, NestorMessage, QuestionMessage } from './types';

export interface QuestionState {
  /** The pieces asked in this round, in order. */
  items: MissingItem[];
  /** The question waiting for an answer; null when none. */
  current: QuestionMessage | null;
  answers: { question: string; answer: string }[];
  /** What the user does not know: left out of the request. */
  skipped: string[];
  /** A version was written from this round. */
  done: boolean;
}

const CLOSED: QuestionState = {
  items: [],
  current: null,
  answers: [],
  skipped: [],
  done: false,
};

/**
 * The latest round of questions, read back from the thread: it survives a
 * reload, and nothing else has to stay in step with it.
 */
export const questionState = (messages: NestorMessage[]): QuestionState => {
  const start = messages.findLastIndex(
    (message) => message.kind === 'question' && message.index === 0,
  );
  if (start === -1) {
    return CLOSED;
  }
  const state: QuestionState = { ...CLOSED, answers: [], skipped: [] };
  const asked = new Map<string, QuestionMessage>();
  for (const message of messages.slice(start)) {
    if (message.kind === 'question') {
      state.items = message.items;
      asked.set(message.id, message);
      state.current = message;
    } else if (message.kind === 'version') {
      return { ...state, current: null, done: true };
    } else if (message.kind === 'user' && message.answers) {
      const question = asked.get(message.answers);
      if (!question) {
        continue;
      }
      const item = question.items[question.index];
      if (message.via === 'stop') {
        state.skipped.push(
          ...question.items.slice(question.index).map((piece) => piece.short),
        );
        return { ...state, current: null };
      }
      if (message.via === 'skip') {
        state.skipped.push(item.short);
      } else {
        state.answers.push({ question: item.question, answer: message.text });
      }
      if (state.current?.id === question.id) {
        state.current = null;
      }
    }
  }
  return state;
};
