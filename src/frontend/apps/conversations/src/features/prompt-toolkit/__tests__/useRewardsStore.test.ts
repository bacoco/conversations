import { levelOf, useRewardsStore } from '../rewards/useRewardsStore';

describe('rewards', () => {
  beforeEach(() => useRewardsStore.getState().reset());

  it('adds points and unlocks each badge once', () => {
    const { record } = useRewardsStore.getState();

    expect(record('analysis')).toEqual(['first-step']);
    expect(record('analysis')).toEqual([]);
    record('improvement');
    record('improvement');
    expect(record('improvement')).toEqual(['rewriter']);

    expect(useRewardsStore.getState()).toMatchObject({
      points: 5 + 5 + 10 * 3,
      badges: ['first-step', 'rewriter'],
    });
  });

  it('climbs from beginner to expert', () => {
    expect(levelOf(0).level.id).toBe('beginner');
    expect(levelOf(99).next?.id).toBe('operational');
    expect(levelOf(100).level.id).toBe('operational');
    expect(levelOf(300)).toEqual({
      level: { id: 'expert', from: 300 },
      next: null,
    });
  });
});
