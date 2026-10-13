import { foldSummary, foldThread } from '../chat/fold';
import type { NestorMessage } from '../chat/types';

const t = (key: string, values?: Record<string, unknown>) =>
  values
    ? key.replace(/\{\{(\w+)\}\}/g, (_, name: string) => String(values[name]))
    : key;

const msg = (action: number, rest: object, id = `${action}-${Math.random()}`) =>
  ({ id, action, ...rest }) as NestorMessage;

describe('foldThread', () => {
  it('keeps the current action open and folds each past action into one part', () => {
    const parts = foldThread(
      [
        msg(0, { kind: 'request', n: 1, at: 0 }),
        msg(0, { kind: 'pistes', phrases: ['a'] }),
        msg(1, {
          kind: 'analysis',
          draft: 'x',
          check: { present: [], missing: [], message: 'm' },
        }),
        msg(1, { kind: 'hint', hint: 'write-first' }),
        msg(2, { kind: 'reply', text: 'live' }),
      ],
      2,
    );
    expect(parts.map((part) => part.kind)).toEqual([
      'live',
      'fold',
      'fold',
      'live',
    ]);
    expect(parts[2]).toMatchObject({ kind: 'fold', action: 1 });
  });

  it('never folds the request separators', () => {
    const parts = foldThread([msg(0, { kind: 'request', n: 1, at: 0 })], 5);
    expect(parts).toEqual([{ kind: 'live', message: expect.anything() }]);
  });
});

describe('foldSummary', () => {
  it('names an analysis by its verdict', () => {
    expect(
      foldSummary(
        [
          msg(1, {
            kind: 'analysis',
            draft: 'x',
            check: {
              present: [],
              missing: [{ short: 'date', question: 'q', choices: [] }],
              message: 'm',
            },
          }),
        ],
        t,
      ),
    ).toBe('Analysis: missing {{items}}'.replace('{{items}}', 'date'));
  });

  it('lists the answers given to the questions', () => {
    expect(
      foldSummary(
        [
          msg(1, { kind: 'user', text: 'Compléter', via: 'action' }),
          msg(1, { kind: 'question', index: 0, items: [] }),
          msg(1, {
            kind: 'user',
            text: 'toute l’équipe',
            via: 'voice',
            answers: 'q',
          }),
          msg(1, {
            kind: 'user',
            text: 'Je ne sais pas',
            via: 'skip',
            answers: 'q2',
          }),
        ],
        t,
      ),
    ).toBe('Questions: toute l’équipe');
  });

  it('names the step where the version went into the field', () => {
    expect(foldSummary([msg(3, { kind: 'placed', previous: 'x' })], t)).toBe(
      'Version put in the Assistant’s field',
    );
  });

  it('names a hint by what it said, never "Earlier step"', () => {
    expect(
      foldSummary([msg(3, { kind: 'hint', hint: 'write-first' })], t),
    ).toBe('Nestor asked to write the request first');
  });

  it('an idea cancelled is said cancelled', () => {
    expect(
      foldSummary(
        [
          msg(2, {
            kind: 'chosen',
            text: 'Rédige',
            previous: '',
            undone: true,
          }),
        ],
        t,
      ),
    ).toBe('Idea cancelled: {{text}}'.replace('{{text}}', 'Rédige'));
  });

  it('examples are named examples, not ideas close to yours', () => {
    expect(
      foldSummary(
        [msg(2, { kind: 'pistes', phrases: ['a'], examples: true })],
        t,
      ),
    ).toBe('Examples of requests');
  });

  it('a step with only a click is named by that click', () => {
    expect(
      foldSummary(
        [msg(4, { kind: 'user', text: 'Annuler', via: 'action' })],
        t,
      ),
    ).toBe('You clicked: {{text}}'.replace('{{text}}', 'Annuler'));
  });
});
