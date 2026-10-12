/** Embeddings stand-in: texts about minutes are close to each other. */
const embeddingsResponse = (body: string) => {
  const { input } = JSON.parse(body) as { input: string[] };
  return new Response(
    JSON.stringify({
      data: input.map((text, index) => ({
        index,
        embedding: text.includes('minutes') ? [1, 0] : [0, 1],
      })),
    }),
  );
};

describe('embedding batches', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('sends the library to Albert in batches of 64 texts at most', async () => {
    const { searchPhrases } = await import('../library/embeddingSearch');
    const fetchMock = vi.fn((url: string, init: RequestInit) =>
      Promise.resolve(embeddingsResponse(init.body as string)),
    );
    vi.stubGlobal('fetch', fetchMock);
    await searchPhrases('minutes', 'fr');
    fetchMock.mock.calls.forEach(([, init]) => {
      const { input } = JSON.parse(init.body as string) as { input: string[] };
      expect(input.length).toBeLessThanOrEqual(64);
    });
    expect(fetchMock.mock.calls.length).toBeGreaterThan(2);
  });
});

describe('links to the full templates', () => {
  it('every linked request points to an existing library prompt', async () => {
    const { getPhrases } = await import('../phrases');
    const { getPromptLibrary } = await import('../library/content');
    for (const language of ['fr', 'en']) {
      const ids = new Set(getPromptLibrary(language).prompts.map((p) => p.id));
      const linked = getPhrases(language).filter((p) => p.templateId);
      expect(linked.length).toBeGreaterThan(50);
      linked.forEach((phrase) =>
        expect(ids.has(phrase.templateId!)).toBe(true),
      );
    }
  });
});
