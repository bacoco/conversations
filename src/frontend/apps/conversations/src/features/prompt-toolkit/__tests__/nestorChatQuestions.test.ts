import { questionState } from '../chat/questions';
import type { MissingItem, NestorMessage } from '../chat/types';

const items: MissingItem[] = [
  { short: 'équipe', question: 'Quelle équipe ?', choices: ['Mon bureau'] },
  { short: 'date', question: 'Quelle date ?', choices: [] },
  { short: 'salle', question: 'Quelle salle ?', choices: [] },
];
const q = (index: number): NestorMessage => ({ id: `q${index}`, action: 1, kind: 'question', index, items });
const said = (answers: string, text: string, via: 'voice' | 'skip' | 'stop' | 'choice'): NestorMessage => ({
  id: `u-${answers}`, action: 1, kind: 'user', text, via, answers,
});

describe('questionState', () => {
  it('is closed with no question in the thread', () => {
    expect(questionState([]).current).toBeNull();
  });

  it('waits on the first question unanswered', () => {
    expect(questionState([q(0)]).current?.index).toBe(0);
  });

  it('keeps answers, skips and the question after them, as after a reload', () => {
    const state = questionState([q(0), said('q0', 'toute l’équipe du bureau 3', 'voice'), q(1), said('q1', 'Je ne sais pas', 'skip'), q(2)]);
    expect(state.answers).toEqual([{ question: 'Quelle équipe ?', answer: 'toute l’équipe du bureau 3' }]);
    expect(state.skipped).toEqual(['date']);
    expect(state.current?.index).toBe(2);
  });

  it('"Arrêter les questions" skips what was not asked yet and closes', () => {
    const state = questionState([q(0), said('q0', 'Arrêter', 'stop')]);
    expect(state.skipped).toEqual(['équipe', 'date', 'salle']);
    expect(state.current).toBeNull();
  });

  it('a version written from the round closes it', () => {
    const state = questionState([
      q(0),
      { id: 'v', action: 2, kind: 'version', original: 'a', version: 'b', missing: [] },
    ]);
    expect(state.current).toBeNull();
    expect(state.done).toBe(true);
  });

  it('a free question to Nestor is not an answer', () => {
    const state = questionState([q(0), { id: 'x', action: 1, kind: 'user', text: 'Bonjour ?', via: 'keyboard' }]);
    expect(state.current?.index).toBe(0);
    expect(state.answers).toEqual([]);
  });
});
