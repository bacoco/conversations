import type { JobCase } from '../jobs/jobs';
import { EMBEDDINGS_URL, EMBEDDING_MODEL } from '../library/embeddingSearch';
import type { LibraryPrompt } from '../library/types';

/**
 * Below this closeness (cosine on bge-m3) to a case's title, task and
 * starting request, the case is about something else: better none than a
 * wrong one. Measured on 28 typical requests (2026-10-13, 30 cases): the
 * right case scores 0.66 to 0.77; unrelated or wrong ones 0.62 at most.
 */
export const CLOSE_CASE_MIN_SCORE = 0.65;
/**
 * Same for a library model (title, description, keywords and text, as the
 * library's own search reads it): the right model scores 0.60 to 0.72;
 * wrong or doubtful ones stay below 0.60.
 */
export const CLOSE_MODEL_MIN_SCORE = 0.6;

/** Albert refuses more texts than this in one call. */
const MAX_BATCH = 64;

export interface CloseMatchesFound {
  caseMatch: JobCase | null;
  model: LibraryPrompt | null;
}

export const NO_CLOSE_MATCH: CloseMatchesFound = {
  caseMatch: null,
  model: null,
};

/** What a case is about, as one text to embed: its title comes first. */
export const caseText = (item: JobCase) =>
  [item.title, item.task, item.startingRequest].filter(Boolean).join('\n');

/** What a model is about, as the library search embeds it: title first. */
export const modelText = (prompt: LibraryPrompt) =>
  [prompt.title, prompt.description, prompt.keywords.join(', '), prompt.prompt]
    .filter(Boolean)
    .join('\n');

const embedBatch = async (
  texts: string[],
  signal?: AbortSignal,
): Promise<number[][]> => {
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

/**
 * Cases and models are embedded once, then kept for the session; a case
 * added later is embedded when first met.
 */
const vectors = new Map<string, Promise<number[]>>();

/** For tests: forget what was embedded. */
export const clearCloseMatchVectors = () => vectors.clear();

const vectorsOf = (texts: string[]): Promise<number[][]> => {
  const missing = [...new Set(texts.filter((text) => !vectors.has(text)))];
  for (let start = 0; start < missing.length; start += MAX_BATCH) {
    const batch = missing.slice(start, start + MAX_BATCH);
    // Not aborted with the request: other searches wait for the same texts.
    const done = embedBatch(batch);
    batch.forEach((text, index) => {
      const vector = done.then((found) => {
        if (!found[index]) throw new Error('Missing embedding');
        return found[index];
      });
      // A failure is not kept: the next search tries again.
      vector.catch(() => vectors.delete(text));
      vectors.set(text, vector);
    });
  }
  return Promise.all(
    texts.map(
      (text) =>
        vectors.get(text) ?? Promise.reject(new Error('Missing embedding')),
    ),
  );
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

/** The closest item, if it is really close. */
const closest = <T>(
  query: number[],
  items: T[],
  itemVectors: number[][],
  minScore: number,
): T | null => {
  let best: T | null = null;
  let bestScore = minScore;
  for (let index = 0; index < items.length; index += 1) {
    const score = cosine(query, itemVectors[index]);
    if (score >= bestScore) {
      best = items[index];
      bestScore = score;
    }
  }
  return best;
};

/**
 * The practical case and the library model closest in meaning to what the
 * user is writing (embeddings), at most one of each, and only when really
 * close.
 */
export const findCloseMatches = async (
  text: string,
  {
    cases,
    prompts,
    signal,
  }: { cases: JobCase[]; prompts: LibraryPrompt[]; signal?: AbortSignal },
): Promise<CloseMatchesFound> => {
  const [[query], caseVectors, modelVectors] = await Promise.all([
    embedBatch([text], signal),
    vectorsOf(cases.map(caseText)),
    vectorsOf(prompts.map(modelText)),
  ]);
  if (!query) return NO_CLOSE_MATCH;
  return {
    caseMatch: closest(query, cases, caseVectors, CLOSE_CASE_MIN_SCORE),
    model: closest(query, prompts, modelVectors, CLOSE_MODEL_MIN_SCORE),
  };
};
