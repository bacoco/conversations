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
        msg(1, { kind: 'analysis', draft: 'x', check: { present: [], missing: [], message: 'm' } }),
        msg(1, { kind: 'hint', hint: 'write-first' }),
        msg(2, { kind: 'reply', text: 'live' }),
      ],
      2,
    );
    expect(parts.map((part) => part.kind)).toEqual(['live', 'fold', 'fold', 'live']);
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
        [msg(1, { kind: 'analysis', draft: 'x', check: { present: [], missing: [{ short: 'date', question: 'q', choices: [] }], message: 'm' } })],
        t,
      ),
    ).toBe('Analysis: missing {{items}}'.replace('{{items}}', 'date'));
  });

  it('lists the answers given to the questions', () => {
    expect(
      foldSummary(
        [
          msg(1, { kind: 'question', index: 0, items: [] }),
          msg(1, { kind: 'user', text: 'toute l’équipe', via: 'voice', answers: 'q' }),
          msg(1, { kind: 'user', text: 'Je ne sais pas', via: 'skip', answers: 'q2' }),
        ],
        t,
      ),
    ).toBe('Questions: toute l’équipe');
  });
});
