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
List as missing only facts that really change this answer AND only the user knows: who (which team, which person), what about (the subject, the decision), when, where, a figure. Never ask about the tone, the format, the length, attachments or the structure: Nestor's version takes care of the form. Never list a role, a magic formula, or anything this request does not need. A simple, complete request has nothing missing.
When a word of the request is vague, quote it: «L'équipe» reste vague : laquelle ?
For each missing piece: one short question (8 words at most) and up to 3 likely short answers the user could pick as is, the most likely first, read from the user's own words (a "réunion de service" is most likely for "Tout le service"); no answer when only the user can know it (a date, a room).
Name what is present with the user's own subject, never generic words: "Le refus", "Le ton bienveillant", "La réunion de jeudi" — never "La demande", "La réponse" or "La tâche".
JSON shape: {"present": ["<1 to 4 words>"], "missing": [{"short": "<1 to 3 words, no article, e.g. 'équipe', 'date'>", "question": "<the question>", "choices": ["..."]}], "message": "<one or two plain sentences; say you will not invent what only the user knows>"}
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

/** A blank left for later: any bracket, "À COMPLÉTER", underscores. */
const HOLE = /[[\]]|À COMPL[ÉE]TER|A COMPLETER|TO COMPLETE|_{3,}/i;
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

export const PISTES_COUNT = 3;

const PISTES_SYSTEM_PROMPT = (language: string) =>
  `You are Nestor, a coach who helps a public servant write a request for an AI assistant. The user is typing it now.
${COMMON_RULES(language)}
Propose ${PISTES_COUNT} complete versions of THIS request the user could start from. Each keeps exactly the user's task, subject, people and facts, and adds one useful precision of form only (purpose, format, length, tone or a part to include). The three must be clearly different from each other: never three synonyms of the same tone.
Never another task or another subject. Never a new fact: no name, date, place or figure the user did not write, and never ask to mention, add or include one (no "en précisant l'heure et le lieu", no "en incluant les dates"). Never brackets, placeholders or blanks.
Each one: 6 to 18 words, ready to send, written as the user writes to the assistant, with the same form of address.
JSON shape: {"pistes": ["...", "...", "..."]}`;

const sameText = (a: string, b: string) =>
  a.replace(/\s+/g, ' ').trim().toLowerCase() ===
  b.replace(/\s+/g, ' ').trim().toLowerCase();

/**
 * Starting ideas while the user types: their own request, made more
 * precise. Never another task, never a blank, never the draft itself.
 */
export const suggestPistes = async (
  draft: string,
  language: string,
  signal?: AbortSignal,
): Promise<string[]> => {
  const raw = await complete(PISTES_SYSTEM_PROMPT(language), draft, signal);
  const pistes: string[] = [];
  for (const piste of asStringList(raw.pistes, 10)) {
    if (
      !hasHoles(piste) &&
      !sameText(piste, draft) &&
      !pistes.some((kept) => sameText(kept, piste))
    ) {
      pistes.push(piste);
    }
  }
  return pistes.slice(0, PISTES_COUNT);
};

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
Rewrite the request into ONE clear request to the assistant that the user can send as is, keeping their own way of addressing the assistant: say what to write, for whom, with which content and in which tone.
Keep the user's intent, subject and facts exactly, and weave every answer of <answers> into the request as a plain statement in the user's voice (e.g. answer "besoin de présence" to "Pourquoi refuser ?" becomes "explique que le service a besoin de présence sur place"). Never copy a question, never write "Pourquoi … ?" or "Quelle … ?" from <answers>.
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

const normalized = (text: string) =>
  text.toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();

/** Questions of the round copied into the version instead of answered. */
const copiedQuestions = (
  answers: { question: string; answer: string }[],
  version: string,
) =>
  answers
    .map(({ question }) => question.trim())
    .filter(
      (question) =>
        question.length > 4 &&
        normalized(version).includes(normalized(question)),
    );

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
    .map(({ question, answer }) => `${question} → ${answer}`)
    .join('\n')}\n</answers>${
    skipped.length
      ? `\nLeave out entirely, the user does not know them: ${skipped.join(', ')}.`
      : ''
  }`;
  let version = versionOf(await complete(system, input, signal, false));
  const dropped = droppedAnswers(answers, version);
  const copied = copiedQuestions(answers, version);
  if (hasHoles(version) || dropped.length || copied.length) {
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
        }${
          copied.length
            ? `It copies the questions (${copied.join(' ')}): write the answers as plain statements instead. `
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
