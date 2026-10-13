import {
  HISTORY_MAX_ENTRIES,
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
    expect(entries[0].score).toBe(HISTORY_MAX_ENTRIES + 4);
  });

  it('never keeps a word of the request: grades only', () => {
    useCoachHistoryStore
      .getState()
      .record('Rédige un courriel à Mme Martin', 70, competencies);
    expect(
      JSON.stringify(useCoachHistoryStore.getState().entries),
    ).not.toContain('Martin');
  });

  it('forgets the excerpts kept by an older version', () => {
    const { migrate, version } = useCoachHistoryStore.persist.getOptions();
    expect(version).toBe(1);
    const migrated = migrate?.(
      { entries: [{ excerpt: 'Rédige…', score: 60, competencies, sentAt: 1 }] },
      0,
    ) as { entries: object[] };
    expect(migrated.entries).toEqual([{ score: 60, competencies, sentAt: 1 }]);
  });

  it('clears the history', () => {
    useCoachHistoryStore.getState().record('prompt', 40, competencies);
    useCoachHistoryStore.getState().clear();
    expect(useCoachHistoryStore.getState().entries).toEqual([]);
  });
});
