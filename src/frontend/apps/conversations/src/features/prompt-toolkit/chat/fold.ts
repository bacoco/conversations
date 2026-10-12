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
          message.via !== 'stop',
      )
      .map((message) => message.text);
    return said.length
      ? t('Questions: {{answers}}', { answers: said.join(' · ') })
      : t('Questions: nothing given');
  }
  if (find('version')) {
    return find('placed')
      ? t('Version prepared, put in the Assistant’s field')
      : t('Version prepared');
  }
  const chosen = find('chosen');
  if (chosen) {
    return t('Chosen start: {{text}}', { text: chosen.text });
  }
  if (find('pistes')) {
    return t('Starting ideas, close to yours');
  }
  const advice = find('advice');
  if (advice) {
    return t('Advice: {{advice}}', { advice: advice.note.tryNow });
  }
  if (find('review')) {
    return t('Session review');
  }
  const question = messages.find(
    (message): message is Extract<NestorMessage, { kind: 'user' }> =>
      message.kind === 'user',
  );
  if (question) {
    return t('You asked Nestor: {{text}}', { text: question.text });
  }
  return t('Earlier step');
};
