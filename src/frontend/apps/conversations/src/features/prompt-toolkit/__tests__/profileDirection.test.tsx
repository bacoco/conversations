import { fireEvent, render, screen, within } from '@testing-library/react';

import { NestorSettings } from '../chat/NestorSettings';
import { ProfileSettings } from '../components/ProfileSettings';
import { DIRECTIONS, INTERESTS } from '../jobs/directions';
import { profileRules, useProfileStore } from '../stores/useProfileStore';

vi.mock('@/utils', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utils')>()),
  useConversationRouteId: () => 'c1',
}));

const reset = () =>
  useProfileStore.setState({
    job: null,
    isBeginner: false,
    direction: null,
    interests: [],
  });

describe('the direction and the work themes of the user', () => {
  beforeEach(reset);
  afterAll(reset);

  it('offers a short list of the ministry’s directions, and « other »', () => {
    expect(DIRECTIONS.length).toBeGreaterThanOrEqual(8);
    expect(DIRECTIONS.length).toBeLessThanOrEqual(12);
    expect(DIRECTIONS.at(-1)?.id).toBe('other');
    // Words first, the acronym only in brackets after them.
    DIRECTIONS.forEach((item) => {
      expect(item.label).toMatch(/^[A-Z][a-z]/);
      expect(item.label.replace(/\(.*\)/, '')).not.toMatch(/[A-Z]{2,}/);
    });
    expect(INTERESTS.length).toBeGreaterThanOrEqual(6);
    expect(INTERESTS.length).toBeLessThanOrEqual(10);
  });

  it('keeps a direction and ticks or unticks themes', () => {
    const store = useProfileStore.getState;
    store().setDirection('dgfip');
    store().toggleInterest('hr');
    store().toggleInterest('procurement');
    expect(store().direction).toBe('dgfip');
    expect(store().interests).toEqual(['hr', 'procurement']);
    store().toggleInterest('hr');
    expect(store().interests).toEqual(['procurement']);
    store().clearInterests();
    expect(store().interests).toEqual([]);
    store().setDirection(null);
    expect(store().direction).toBeNull();
  });

  it('migrates a former profile without losing anything', () => {
    const { migrate, version } = useProfileStore.persist.getOptions();
    expect(version).toBe(2);
    expect(
      migrate?.(
        { job: { id: 'rh', label: 'Gestionnaire RH' }, isBeginner: true },
        1,
      ),
    ).toMatchObject({
      job: { id: 'rh' },
      isBeginner: true,
      direction: null,
      interests: [],
    });
    // Unknown choices are forgotten, known ones are kept.
    expect(
      migrate?.(
        { direction: 'nowhere', interests: ['hr', 'cooking', 'hr'] },
        2,
      ),
    ).toMatchObject({ direction: null, interests: ['hr'] });
    expect(migrate?.({ direction: 'insee' }, 2)).toMatchObject({
      direction: 'insee',
    });
  });

  it('tells the model the direction and themes, only to pick examples', () => {
    expect(profileRules()).toBe('');
    useProfileStore.getState().setDirection('dgddi');
    useProfileStore.getState().toggleInterest('digital');
    const rules = profileRules();
    expect(rules).toContain('Direction générale des douanes');
    expect(rules).toContain('numérique et données');
    expect(rules).toContain('never add');
  });

  it('says nothing of « another direction »', () => {
    useProfileStore.getState().setDirection('other');
    expect(profileRules()).toBe('');
  });

  it('in Nestor’s settings: choose, untick, « Not specified »', () => {
    render(<NestorSettings onClose={vi.fn()} />);
    const directions = screen.getByRole('combobox', { name: 'My direction' });
    expect(within(directions).getAllByRole('option')).toHaveLength(
      DIRECTIONS.length + 1,
    );
    fireEvent.change(directions, { target: { value: 'insee' } });
    expect(useProfileStore.getState().direction).toBe('insee');
    fireEvent.change(directions, { target: { value: '' } });
    expect(useProfileStore.getState().direction).toBeNull();

    const themes = screen.getByRole('group', { name: 'My work themes' });
    const none = within(themes).getByRole('button', { name: 'Not specified' });
    expect(none).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(
      within(themes).getByRole('button', { name: 'Human resources' }),
    );
    fireEvent.click(
      within(themes).getByRole('button', { name: 'Procurement' }),
    );
    expect(useProfileStore.getState().interests).toEqual(['hr', 'procurement']);
    expect(none).toHaveAttribute('aria-pressed', 'false');
    expect(
      within(themes).getByRole('button', { name: 'Human resources' }),
    ).toHaveAttribute('aria-pressed', 'true');
    fireEvent.click(
      within(themes).getByRole('button', { name: 'Human resources' }),
    );
    expect(useProfileStore.getState().interests).toEqual(['procurement']);
    fireEvent.click(none);
    expect(useProfileStore.getState().interests).toEqual([]);
    expect(none).toHaveAttribute('aria-pressed', 'true');
  });

  it('the home page stays short: direction and themes live in the settings', () => {
    render(<ProfileSettings />);
    expect(screen.queryByRole('combobox', { name: 'My direction' })).toBeNull();
  });
});
