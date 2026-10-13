import { shortText } from './shortText';
import type { NestorMessage } from './types';

export type ThreadPart =
  | { kind: 'live'; message: NestorMessage }
  | { kind: 'fold'; action: number; messages: NestorMessage[] };

type T = (key: string, values?: Record<string, unknown>) => string;

/**
 * Past actions fold into one line each, to reopen; the current action
 * stays open. The "Demande n" separators always show.
 */
export const foldThread = (
  messages: NestorMessage[],
  current: number,
): ThreadPart[] => {
  const parts: ThreadPart[] = [];
  for (const message of messages) {
    if (message.action >= current || message.kind === 'request') {
      parts.push({ kind: 'live', message });
      continue;
    }
    const last = parts.at(-1);
    if (last?.kind === 'fold' && last.action === message.action) {
      last.messages.push(message);
    } else {
      parts.push({ kind: 'fold', action: message.action, messages: [message] });
    }
  }
  return parts;
};

const listOf = (items: string[]) =>
  new Intl.ListFormat('fr', { type: 'conjunction' }).format(items);

/** The one line that stands for a past step. */
export const foldSummary = (messages: NestorMessage[], t: T): string => {
  const find = <K extends NestorMessage['kind']>(kind: K) =>
    messages.find(
      (message): message is Extract<NestorMessage, { kind: K }> =>
        message.kind === kind,
    );
  const analysis = find('analysis');
  if (analysis) {
    const missing = analysis.check.missing.map((item) => item.short);
    return missing.length
      ? t('Analysis: missing {{items}}', { items: listOf(missing) })
      : t('Analysis: clear request');
  }
  if (find('question')) {
    const said = messages
      .filter(
        (message): message is Extract<NestorMessage, { kind: 'user' }> =>
          message.kind === 'user' &&
          message.via !== 'skip' &&
          message.via !== 'stop' &&
          message.via !== 'action',
      )
      .map((message) => message.text);
    return said.length
      ? t('Questions: {{answers}}', { answers: said.join(' · ') })
      : t('Questions: nothing given');
  }
  if (find('version')) {
    if (find('placed')) {
      return t('Version prepared, put in the Assistant’s field');
    }
    // "Plus court", "Autre version": the step says which one it was.
    const asked = messages.find(
      (message): message is Extract<NestorMessage, { kind: 'user' }> =>
        message.kind === 'user' && message.via === 'action',
    );
    return asked
      ? t('Version prepared: {{how}}', { how: asked.text })
      : t('Version prepared');
  }
  const chosen = find('chosen');
  if (chosen) {
    return chosen.undone
      ? t('Idea cancelled: {{text}}', { text: shortText(chosen.text) })
      : t('Chosen start: {{text}}', { text: shortText(chosen.text) });
  }
  if (find('examples')) {
    return t('Examples, before and after');
  }
  const pistes = find('pistes');
  if (pistes) {
    return pistes.examples
      ? t('Examples of requests')
      : t('Starting ideas, close to yours');
  }
  const advice = find('advice');
  if (advice) {
    return t('Advice: {{advice}}', { advice: advice.note.tryNow });
  }
  if (find('review')) {
    return t('Session review');
  }
  if (find('placed')) {
    return t('Version put in the Assistant’s field');
  }
  const hint = find('hint');
  if (hint) {
    return hint.hint === 'write-first'
      ? t('Nestor asked to write the request first')
      : hint.hint === 'review-after-answer'
        ? t('The review comes after an answer')
        : t('New request');
  }
  const question = messages.find(
    (message): message is Extract<NestorMessage, { kind: 'user' }> =>
      message.kind === 'user' && message.via !== 'action',
  );
  if (question) {
    return t('You asked Nestor: {{text}}', { text: question.text });
  }
  const clicked = messages.find(
    (message): message is Extract<NestorMessage, { kind: 'user' }> =>
      message.kind === 'user' && message.via === 'action',
  );
  if (clicked) {
    return t('You clicked: {{text}}', { text: clicked.text });
  }
  return t('Earlier step');
};
