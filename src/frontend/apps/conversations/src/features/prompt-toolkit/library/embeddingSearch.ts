import { COACH_COMPLETIONS_URL } from '../coach/coachApi';
import { getPhrases } from '../phrases';
import type { Phrase } from '../phrases/types';

import { getPromptLibrary } from './content';
import type { LibraryPrompt } from './types';

const env = import.meta.env as Record<string, string | undefined>;

/** Same Albert proxy as the coach, embeddings route. */
const COMPLETIONS_PATH = 'chat/completions';
export const EMBEDDINGS_URL = COACH_COMPLETIONS_URL.endsWith(COMPLETIONS_PATH)
  ? `${COACH_COMPLETIONS_URL.slice(0, -COMPLETIONS_PATH.length)}embeddings`
  : COACH_COMPLETIONS_URL;
export const EMBEDDING_MODEL =
  env.VITE_PROMPT_COACH_EMBEDDING_MODEL || 'bge-m3';

/** Albert refuses more texts than this in one call. */
const MAX_BATCH = 64;

const embed = async (texts: string[], signal?: AbortSignal) => {
  const batches: string[][] = [];
  for (let start = 0; start < texts.length; start += MAX_BATCH) {
    batches.push(texts.slice(start, start + MAX_BATCH));
  }
  const vectors = await Promise.all(
    batches.map((batch) => embedBatch(batch, signal)),
  );
  return vectors.flat();
};

const embedBatch = async (texts: string[], signal?: AbortSignal) => {
  const response = await fetch(EMBEDDINGS_URL, {
    method: 'POST',
    credentials: 'include',
    signal,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: EMBEDDING_MODEL, input: texts }),
  });
  if (!response.ok) {
    throw new Error(`Embedding request failed: ${response.status}`);
  }
  const data = (await response.json()) as {
    data?: { index: number; embedding: number[] }[];
  };
  return (data.data ?? [])
    .sort((a, b) => a.index - b.index)
    .map((item) => item.embedding);
};

const cosine = (a: number[], b: number[]) => {
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA * normB) || 1);
};

/** What a prompt is about, as one text to embed. */
const describe = (prompt: LibraryPrompt) =>
  [prompt.title, prompt.description, prompt.keywords.join(', '), prompt.prompt]
    .filter(Boolean)
    .join('\n');

/** The library is embedded once per language, then kept for the session. */
const libraryVectors = new Map<string, Promise<number[][]>>();

const vectorsOf = (language: string, prompts: LibraryPrompt[]) => {
  let vectors = libraryVectors.get(language);
  if (!vectors) {
    vectors = embed(prompts.map(describe));
    // A failure is not kept: the next search tries again.
    vectors.catch(() => libraryVectors.delete(language));
    libraryVectors.set(language, vectors);
  }
  return vectors;
};

/** Short phrases embedded once per language too, for "As you type". */
const phraseVectors = new Map<string, Promise<number[][]>>();

/**
 * The phrases closest in meaning to the text, best first: always an answer,
 * whatever the words used.
 */
export const searchPhrases = async (
  text: string,
  language: string,
  limit = 5,
  signal?: AbortSignal,
): Promise<Phrase[]> => {
  const phrases = getPhrases(language);
  const key = (language ?? '').startsWith('fr') ? 'fr' : 'en';
  let vectors = phraseVectors.get(key);
  if (!vectors) {
    vectors = embed(
      phrases.map((phrase) => `${phrase.category.label} : ${phrase.text}`),
    );
    vectors.catch(() => phraseVectors.delete(key));
    phraseVectors.set(key, vectors);
  }
  const [library, [query]] = await Promise.all([
    vectors,
    embed([text], signal),
  ]);
  return phrases
    .map((phrase, index) => ({ phrase, score: cosine(query, library[index]) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.phrase);
};

/**
 * The library prompts closest in meaning to the text, best first: always an
 * answer, whatever the words used.
 */
export const searchLibrary = async (
  text: string,
  language: string,
  limit = 3,
  signal?: AbortSignal,
): Promise<LibraryPrompt[]> => {
  const { prompts } = getPromptLibrary(language);
  const [library, [query]] = await Promise.all([
    vectorsOf(language, prompts),
    embed([text], signal),
  ]);
  return prompts
    .map((prompt, index) => ({ prompt, score: cosine(query, library[index]) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.prompt);
};
