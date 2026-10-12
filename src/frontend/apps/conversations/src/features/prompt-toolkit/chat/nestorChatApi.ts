import {
  COMMON_RULES,
  CoachError,
  asStringList,
  complete,
  droppedAnswers,
} from '../coach/coachApi';

import {
  MissingItem,
  NestorMessage,
  QUESTIONS_MAX,
  RequestCheck,
} from './types';

const CHECK_SYSTEM_PROMPT = (language: string) =>
  `You are Nestor, a coach who helps a public servant write a request for an AI assistant.
${COMMON_RULES(language)}
Read the request and say, in plain words, what it already gives and what the assistant still needs for a good answer.
List as missing only what really changes this answer AND only the user knows (which team, a date, a place, a name, a figure). Never list a role, a magic formula, or anything this request does not need. A simple, complete request has nothing missing.
When a word of the request is vague, quote it: «L'équipe» reste vague : laquelle ?
For each missing piece: one short question (8 words at most) and up to 3 likely short answers the user could pick as is; no answer when only the user can know it (a date, a room).
JSON shape: {"present": ["<1 to 3 words, e.g. 'La tâche', 'Le contexte'>"], "missing": [{"short": "<1 to 3 words, no article, e.g. 'équipe', 'date'>", "question": "<the question>", "choices": ["..."]}], "message": "<one or two plain sentences; say you will not invent what only the user knows>"}
At most ${QUESTIONS_MAX} missing pieces, the most useful first.`;

const asMissing = (value: unknown): MissingItem[] =>
  (Array.isArray(value) ? value : [])
    .filter(
      (item): item is Record<string, unknown> =>
        typeof item === 'object' && item !== null,
    )
    .map((item) => ({
      short: typeof item.short === 'string' ? item.short.trim() : '',
      question: typeof item.question === 'string' ? item.question.trim() : '',
      choices: asStringList(item.choices, 3),
    }))
    .filter((item) => item.short && item.question)
    .slice(0, QUESTIONS_MAX);

export const parseRequestCheck = (
  raw: Record<string, unknown>,
): RequestCheck => {
  const message = typeof raw.message === 'string' ? raw.message.trim() : '';
  if (!message) {
    throw new CoachError('Nestor returned no reading of the request');
  }
  return {
    present: asStringList(raw.present, 4),
    missing: asMissing(raw.missing),
    message,
  };
};

/** "Analyser mon texte": what the request gives, what only the user knows. */
export const checkRequest = async (
  draft: string,
  language: string,
  signal?: AbortSignal,
): Promise<RequestCheck> =>
  parseRequestCheck(
    await complete(CHECK_SYSTEM_PROMPT(language), draft, signal),
  );

/** A blank left for later: brackets, "À COMPLÉTER", underscores. */
const HOLE = /\[[^\]\n]{1,120}\]|À COMPL[ÉE]TER|A COMPLETER|TO COMPLETE|_{3,}/i;
const SENTENCE_WITH_HOLE = new RegExp(
  `[^.!?\\n]*(?:${HOLE.source})[^.!?\\n]*[.!?]?`,
  'gi',
);

export const hasHoles = (text: string) => HOLE.test(text);

/** The last resort: a sentence holding a blank is taken out. */
export const withoutHoles = (text: string) =>
  text
    .replace(SENTENCE_WITH_HOLE, '')
    .replace(/[ \t]{2,}/g, ' ')
    .replace(/[ \t]+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

export type VersionStyle = 'full' | 'shorter' | 'other';

export interface VersionInput {
  /** The text the version starts from. */
  draft: string;
  answers: { question: string; answer: string }[];
  /** What the user does not know: left out entirely. */
  skipped: string[];
  style?: VersionStyle;
}

const STYLE_RULE: Record<VersionStyle, string> = {
  full: '',
  shorter: 'Make it clearly shorter, keeping every fact.',
  other:
    'Write it differently: another structure and other words, the same facts.',
};

const VERSION_SYSTEM_PROMPT = (language: string, style: VersionStyle) =>
  `You are Nestor, a coach who helps a public servant write a request for an AI assistant.
${COMMON_RULES(language)}
Rewrite the request into ONE version the user can send as is, keeping their own way of addressing the assistant.
Keep the user's intent, subject and facts exactly, and add every answer given in <answers>.
Never write a placeholder, brackets, "à compléter", "to complete" or a blank. Information the user did not give is simply left out, and the wording adapts so that nothing looks missing. Never invent a name, date, place, figure or fact.
${STYLE_RULE[style]}
JSON shape: {"version": "<the request>"}`;

const versionOf = (raw: Record<string, unknown>) => {
  const version = typeof raw.version === 'string' ? raw.version.trim() : '';
  if (!version) {
    throw new CoachError('Nestor returned no version');
  }
  return version;
};

/**
 * "Améliorer mon texte": one version with the user's answers and no blank,
 * ever. One more round when the model leaves a blank or drops an answer;
 * a blank still there is taken out with its sentence.
 */
export const writeVersion = async (
  { draft, answers, skipped, style = 'full' }: VersionInput,
  language: string,
  signal?: AbortSignal,
): Promise<string> => {
  const system = VERSION_SYSTEM_PROMPT(language, style);
  const input = `<prompt>\n${draft}\n</prompt>\n<answers>\n${answers
    .map(({ question, answer }) => `${question} ${answer}`)
    .join('\n')}\n</answers>${
    skipped.length
      ? `\nLeave out entirely, the user does not know them: ${skipped.join(', ')}.`
      : ''
  }`;
  let version = versionOf(await complete(system, input, signal, false));
  const dropped = droppedAnswers(answers, version);
  if (hasHoles(version) || dropped.length) {
    version = versionOf(
      await complete(
        system,
        `${input}\n\nYour version was: ${version}\n${
          hasHoles(version)
            ? 'It holds a blank: remove it and adapt the wording. '
            : ''
        }${
          dropped.length
            ? `It leaves out: ${dropped.join(', ')}. Put them in. `
            : ''
        }Return the whole version again.`,
        signal,
        false,
      ),
    );
  }
  return hasHoles(version) ? withoutHoles(version) : version;
};

/** "Sur 2 conseils, vous en avez appliqué 1": checked advice only. */
export const adviceCount = (messages: NestorMessage[]) => {
  const checked = messages.filter(
    (message): message is Extract<NestorMessage, { kind: 'advice' }> =>
      message.kind === 'advice' && message.note.applied !== null,
  );
  return {
    advised: checked.length,
    applied: checked.filter((message) => message.note.applied).length,
  };
};
