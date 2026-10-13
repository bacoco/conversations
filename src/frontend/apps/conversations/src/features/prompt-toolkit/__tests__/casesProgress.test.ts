import { casesOf } from '../jobs/jobs';
import {
  isUnlocked,
  nextCase,
  useCasesStore,
  weeklyCase,
} from '../learn/cases/casesProgress';
import { weeklySlotIcs } from '../learn/cases/ics';

describe('practical cases — progress', () => {
  beforeEach(() => useCasesStore.setState({ done: {} }));
  const [one, two, three] = casesOf('rh');

  it('opens level 1 at once, the next level once a case of the level below is done', () => {
    expect(isUnlocked('rh', 1, {})).toBe(true);
    expect(isUnlocked('rh', 2, {})).toBe(false);
    expect(isUnlocked('rh', 2, { [one.id]: 1 })).toBe(true);
    expect(isUnlocked('rh', 3, { [one.id]: 1 })).toBe(false);
  });

  it('the next case is the first not done whose level is open', () => {
    const cases = casesOf('rh');
    expect(nextCase('rh', {})?.id).toBe(cases[0].id);
    expect(nextCase('rh', { [cases[0].id]: 1 })?.id).toBe(cases[1].id);
    // Every case done: none left.
    expect(
      nextCase(
        'rh',
        Object.fromEntries(cases.map((item, index) => [item.id, index + 1])),
      ),
    ).toBeNull();
  });

  it('remembers a case done, for this account only', () => {
    useCasesStore.getState().markDone(one.id, 10);
    expect(useCasesStore.getState().done).toEqual({ [one.id]: 10 });
  });

  it('the case of the week: the next one; all done, one to practise again', () => {
    const now = new Date('2026-10-13T09:00:00');
    expect(weeklyCase('rh', {}, now)?.id).toBe(one.id);
    const all = { [one.id]: 1, [two.id]: 2, [three.id]: 3 };
    expect(casesOf('rh').map((item) => item.id)).toContain(
      weeklyCase('rh', all, now)?.id,
    );
  });
});

describe('weeklySlotIcs — 20 minutes a week in the diary', () => {
  it('a weekly event of 20 minutes that Outlook can open', () => {
    const ics = weeklySlotIcs(new Date('2026-10-13T09:00:00'), {
      title: 'Nestor : 20 minutes pour progresser',
      description:
        'Le cas de la semaine vous attend dans le panneau de Nestor.',
    });
    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('RRULE:FREQ=WEEKLY');
    expect(ics).toContain('DTSTART:20261015T100000');
    expect(ics).toContain('DTEND:20261015T102000');
    expect(ics).toContain('SUMMARY:Nestor : 20 minutes pour progresser');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
  });
});
