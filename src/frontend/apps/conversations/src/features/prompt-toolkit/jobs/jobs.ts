import accueilUsagers from './content/accueil-usagers.json';
import assistantDirection from './content/assistant-direction.json';
import chefProjet from './content/chef-projet.json';
import communication from './content/communication.json';
import comptable from './content/comptable.json';
import controle from './content/controle.json';
import encadrant from './content/encadrant.json';
import etudesStats from './content/etudes-stats.json';
import juristeAchat from './content/juriste-achat.json';
import rh from './content/rh.json';

/**
 * The ten typical jobs of the Ministry of the Economy, in the agreed order.
 * Everything Nestor says and shows can be tuned to one of them.
 */
export const JOB_IDS = [
  'assistant-direction',
  'rh',
  'juriste-achat',
  'controle',
  'accueil-usagers',
  'comptable',
  'etudes-stats',
  'chef-projet',
  'communication',
  'encadrant',
] as const;
export type JobId = (typeof JOB_IDS)[number];

export type CaseSkill =
  | 'task'
  | 'context'
  | 'audience'
  | 'format'
  | 'sources'
  | 'examples'
  | 'tone'
  | 'constraints';

/** A practical case: a real task of the job, from a vague request to a good one. */
export interface JobCase {
  id: string;
  jobId: JobId;
  level: 1 | 2 | 3;
  task: string;
  title: string;
  minutes: number;
  situation: string;
  /** A fictitious text to work from; empty when the task needs none. */
  material: string;
  /** What a beginner would write: short and vague. */
  startingRequest: string;
  goodRequest: string;
  keyPoints: { skill: CaseSkill; point: string }[];
  /** What to check in the Assistant's answer. */
  checkAnswer: string[];
  /** The rule to keep, for any request. */
  lesson: string;
}

export interface JobProfile {
  id: JobId;
  label: string;
  who: string;
  vocabulary: string[];
  readers: string[];
  tasks: string[];
  /** Everyday requests of the job, ready to send. */
  examples: string[];
  cautions: string[];
  /** The library's families that matter most for this job, first. */
  library: string[];
}

interface JobFile {
  job: Omit<JobProfile, 'library'>;
  cases: JobCase[];
}

const FILES: Record<JobId, JobFile> = {
  'assistant-direction': assistantDirection as JobFile,
  rh: rh as JobFile,
  'juriste-achat': juristeAchat as JobFile,
  controle: controle as JobFile,
  'accueil-usagers': accueilUsagers as JobFile,
  comptable: comptable as JobFile,
  'etudes-stats': etudesStats as JobFile,
  'chef-projet': chefProjet as JobFile,
  communication: communication as JobFile,
  encadrant: encadrant as JobFile,
};

/** Which families of the library come first for each job. */
const LIBRARY_FOR_JOB: Record<JobId, string[]> = {
  'assistant-direction': ['mail', 'meetings', 'writing'],
  rh: ['hr', 'mail', 'writing'],
  'juriste-achat': ['procurement', 'writing', 'summary'],
  controle: ['writing', 'summary', 'mail'],
  'accueil-usagers': ['public', 'mail'],
  comptable: ['data', 'summary', 'mail'],
  'etudes-stats': ['summary', 'data'],
  'chef-projet': ['project', 'meetings', 'summary'],
  communication: ['communication', 'writing'],
  encadrant: ['hr', 'meetings', 'project'],
};

export const JOBS: JobProfile[] = JOB_IDS.map((id) => ({
  ...FILES[id].job,
  id,
  library: LIBRARY_FOR_JOB[id],
}));

const isJobId = (id: unknown): id is JobId =>
  (JOB_IDS as readonly unknown[]).includes(id);

/** The job chosen, or null for none, an unknown or a former choice. */
export const jobById = (id: string | null | undefined): JobProfile | null =>
  isJobId(id) ? (JOBS.find((job) => job.id === id) ?? null) : null;

/** The three cases of a job, level 1 to 3. */
export const casesOf = (id: JobId): JobCase[] =>
  [...FILES[id].cases].sort((a, b) => a.level - b.level);

export const caseById = (caseId: string): JobCase | null =>
  JOB_IDS.flatMap((id) => FILES[id].cases).find((item) => item.id === caseId) ??
  null;

/**
 * What Nestor's instructions say about the user's job: its words, readers
 * and cautions, to pick examples, choices and vocabulary — never a fact.
 */
export const jobRules = (job: JobProfile) =>
  [
    `The user works as: ${job.label} (${job.who}).`,
    `Words of this job, to use in examples, choices and explanations when they fit: ${job.vocabulary.join(', ')}.`,
    `Their usual readers: ${job.readers.join(', ')}.`,
    `Cautions for this job, to recall when the request touches them: ${job.cautions.join(' ')}`,
    'Use all this only to pick examples, likely choices and words the user knows; never add it to a request as a fact, and never change the user’s subject.',
  ].join('\n');
