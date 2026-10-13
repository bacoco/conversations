import { profileRules, useProfileStore } from '../stores/useProfileStore';

describe('useProfileStore — the job of the ministry', () => {
  beforeEach(() => useProfileStore.setState({ job: null, isBeginner: false }));

  it('forgets a former choice that is not one of the ten jobs', () => {
    const { migrate, version } = useProfileStore.persist.getOptions();
    expect(version).toBe(2);
    expect(
      migrate?.(
        { job: { id: 'mail', label: 'Courriels' }, isBeginner: true },
        0,
      ),
    ).toMatchObject({ job: null, isBeginner: true });
    expect(
      migrate?.({ job: { id: 'rh', label: 'Gestionnaire RH' } }, 0),
    ).toMatchObject({ job: { id: 'rh' } });
  });

  it('tells the coach the words of the job, never as a fact', () => {
    useProfileStore.getState().setJob({ id: 'rh', label: 'Gestionnaire RH' });
    const rules = profileRules();
    expect(rules).toContain('compte épargne-temps');
    expect(rules).toContain('never add');
  });
});
