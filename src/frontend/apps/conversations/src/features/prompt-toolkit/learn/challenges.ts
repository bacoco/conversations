import type { Competency } from '../coach/coachApi';

/** A weak prompt to fix: the coach grades the user's version. */
export interface Challenge {
  id: string;
  level: 1 | 2 | 3;
  title: string;
  badPrompt: string;
  /** What is wrong with it, in one sentence. */
  problem: string;
  /** The competencies the fixed prompt must reach. */
  targets: Competency[];
  hints: string[];
}

/** Each target competency must reach this grade for the challenge to pass. */
export const CHALLENGE_PASS_GRADE = 60;

const CHALLENGES_FR: Challenge[] = [
  {
    id: 'vague',
    level: 1,
    title: 'Le prompt trop vague',
    badPrompt: 'Fais-moi un truc avec ce texte.',
    problem: 'On ne sait ni ce qu’il faut produire, ni sous quelle forme.',
    targets: ['task', 'format'],
    hints: [
      'Quel résultat voulez-vous ?',
      'Sous quelle forme : liste, tableau, courriel ?',
    ],
  },
  {
    id: 'no-context',
    level: 1,
    title: 'Le prompt sans contexte',
    badPrompt: 'Résume ce décret.',
    problem:
      'Ni le public, ni l’usage, ni la longueur du résumé ne sont précisés.',
    targets: ['context', 'audience'],
    hints: [
      'Pour qui est ce résumé ?',
      'À quoi va-t-il servir ?',
      'Quelle longueur ?',
    ],
  },
  {
    id: 'no-format',
    level: 2,
    title: 'Le pavé illisible',
    badPrompt:
      'Donne-moi les informations importantes sur les trois scénarios de rénovation.',
    problem:
      'Sans format demandé, la réponse sera un long paragraphe difficile à comparer.',
    targets: ['format', 'constraints'],
    hints: [
      'Un tableau comparatif serait plus utile',
      'Quelles colonnes ?',
      'Une recommandation à la fin ?',
    ],
  },
  {
    id: 'contradictory',
    level: 2,
    title: 'Le prompt contradictoire',
    badPrompt:
      'Fais un résumé très détaillé en deux lignes, sur un ton formel et décontracté.',
    problem:
      'Détaillé ou deux lignes ? Formel ou décontracté ? Il faut choisir.',
    targets: ['task', 'constraints'],
    hints: [
      'Repérez chaque contradiction',
      'Choisissez une seule direction pour chacune',
    ],
  },
  {
    id: 'hallucination',
    level: 3,
    title: 'Le prompt qui fait inventer',
    badPrompt:
      'Quelles sont les dernières règles du télétravail dans la fonction publique ?',
    problem:
      'Sans source ni consigne de vérification, l’IA risque d’inventer des règles.',
    targets: ['context', 'verification'],
    hints: [
      'Fournissez le texte de référence',
      'Demandez de s’appuyer uniquement sur ce texte',
      'Demandez de signaler ce qui manque',
    ],
  },
  {
    id: 'multi-task',
    level: 3,
    title: 'Trois tâches en une phrase',
    badPrompt:
      'Résume ce texte et traduis-le en anglais et fais un tableau des points clés.',
    problem: 'Trois tâches mélangées, sans ordre ni format pour chacune.',
    targets: ['task', 'format'],
    hints: [
      'Numérotez les tâches',
      'Un format pour chacune',
      'Des sections séparées par un titre',
    ],
  },
];

const CHALLENGES_EN: Challenge[] = [
  {
    id: 'vague',
    level: 1,
    title: 'The vague prompt',
    badPrompt: 'Do something with this text.',
    problem: 'Neither the expected result nor its form is stated.',
    targets: ['task', 'format'],
    hints: ['What result do you want?', 'In what form: list, table, email?'],
  },
  {
    id: 'no-context',
    level: 1,
    title: 'The prompt without context',
    badPrompt: 'Summarise this decree.',
    problem:
      'The audience, the purpose and the length of the summary are missing.',
    targets: ['context', 'audience'],
    hints: [
      'Who is the summary for?',
      'What will it be used for?',
      'How long?',
    ],
  },
  {
    id: 'no-format',
    level: 2,
    title: 'The wall of text',
    badPrompt:
      'Give me the important information about the three renovation scenarios.',
    problem:
      'Without a format, the answer will be one long paragraph, hard to compare.',
    targets: ['format', 'constraints'],
    hints: [
      'A comparison table would help',
      'Which columns?',
      'A recommendation at the end?',
    ],
  },
  {
    id: 'contradictory',
    level: 2,
    title: 'The contradictory prompt',
    badPrompt:
      'Write a very detailed summary in two lines, in a formal and casual tone.',
    problem: 'Detailed or two lines? Formal or casual? You have to choose.',
    targets: ['task', 'constraints'],
    hints: ['Spot each contradiction', 'Pick one direction for each'],
  },
  {
    id: 'hallucination',
    level: 3,
    title: 'The prompt that makes things up',
    badPrompt: 'What are the latest remote-work rules in the civil service?',
    problem: 'With no source and no request to check, the AI may invent rules.',
    targets: ['context', 'verification'],
    hints: [
      'Provide the reference text',
      'Ask it to rely only on that text',
      'Ask it to say what is missing',
    ],
  },
  {
    id: 'multi-task',
    level: 3,
    title: 'Three tasks in one sentence',
    badPrompt:
      'Summarise this text and translate it into English and make a table of the key points.',
    problem:
      'Three tasks mixed together, with no order and no format for each.',
    targets: ['task', 'format'],
    hints: [
      'Number the tasks',
      'One format for each',
      'Sections separated by a heading',
    ],
  },
];

/** The challenges are written in French; other languages get English. */
export const getChallenges = (language?: string): Challenge[] =>
  (language ?? '').toLowerCase().startsWith('fr')
    ? CHALLENGES_FR
    : CHALLENGES_EN;
