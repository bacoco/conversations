import { decideBarAction } from '../chat/barGuard';
import { ROUNDS_MAX, carryOver } from '../chat/rounds';

const base = {
  draft: 'Fais un courriel',
  hasAnswer: true,
  reviewUpToDate: false,
  questionsOpen: false,
};

describe('decideBarAction', () => {
  it('asks to write first when the field is empty, for analyse and improve', () => {
    for (const action of ['analyse', 'improve'] as const) {
      expect(decideBarAction(action, { ...base, draft: '  ' })).toEqual({
        kind: 'hint',
        hint: 'write-first',
        focusField: true,
      });
    }
  });

  it('says the review comes after an answer', () => {
    expect(decideBarAction('review', { ...base, hasAnswer: false })).toEqual({
      kind: 'hint',
      hint: 'review-after-answer',
      focusField: false,
    });
  });

  it('shows the same review again when it is up to date', () => {
    expect(
      decideBarAction('review', { ...base, reviewUpToDate: true }),
    ).toEqual({ kind: 'reshow-review' });
  });

  it('runs on a snapshot during questions, and offers to resume them', () => {
    expect(
      decideBarAction('improve', { ...base, questionsOpen: true }),
    ).toEqual({ kind: 'run', resumeQuestions: true });
  });

  it('a new analysis replaces the questions: nothing to resume', () => {
    expect(
      decideBarAction('analyse', { ...base, questionsOpen: true }),
    ).toEqual({ kind: 'run', resumeQuestions: false });
  });

  it('"Demander à Nestor" always opens, even with an empty field', () => {
    expect(decideBarAction('ask', { ...base, draft: '' })).toEqual({
      kind: 'run',
      resumeQuestions: false,
    });
  });
});

describe('carryOver', () => {
  it('keeps a still useful round first, before the new ones', () => {
    expect(
      carryOver(
        [{ id: 'redo-with-missing', primary: true }, { id: 'shorter' }],
        [{ id: 'new-request' }, { id: 'lesson' }],
      ),
    ).toEqual([
      { id: 'redo-with-missing', primary: true },
      { id: 'new-request' },
      { id: 'lesson' },
    ]);
  });

  it('never shows the same round twice nor more than three', () => {
    const rounds = carryOver(
      [{ id: 'redo-with-missing' }, { id: 'resume-questions' }],
      [{ id: 'redo-with-missing', primary: true }, { id: 'shorter' }, { id: 'other-version' }],
    );
    expect(rounds).toHaveLength(ROUNDS_MAX);
    expect(rounds.filter((round) => round.id === 'redo-with-missing')).toHaveLength(1);
  });
});
