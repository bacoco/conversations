import {
  HISTORY_MAX_ENTRIES,
  toExcerpt,
  useCoachHistoryStore,
} from '../stores/useCoachHistoryStore';

const competencies = {
  task: 50,
  context: 50,
  format: 50,
  audience: 50,
  constraints: 50,
  verification: 50,
  sources: 50,
  examples: 50,
};

describe('useCoachHistoryStore', () => {
  beforeEach(() => useCoachHistoryStore.setState({ entries: [] }));

  it('keeps only the most recent entries, newest first', () => {
    for (let index = 0; index < HISTORY_MAX_ENTRIES + 5; index++) {
      useCoachHistoryStore
        .getState()
        .record(`prompt ${index}`, index, competencies);
    }
    const { entries } = useCoachHistoryStore.getState();

    expect(entries).toHaveLength(HISTORY_MAX_ENTRIES);
    expect(entries[0].excerpt).toBe(`prompt ${HISTORY_MAX_ENTRIES + 4}`);
  });

  it('stores a short excerpt, not the whole prompt', () => {
    const excerpt = toExcerpt(`${'a '.repeat(200)}end`);
    expect(excerpt.length).toBeLessThanOrEqual(80);
    expect(excerpt.endsWith('…')).toBe(true);
  });

  it('clears the history', () => {
    useCoachHistoryStore.getState().record('prompt', 40, competencies);
    useCoachHistoryStore.getState().clear();
    expect(useCoachHistoryStore.getState().entries).toEqual([]);
  });
});
