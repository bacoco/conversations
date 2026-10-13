import { markParts } from '../chat/markParts';

describe('markParts', () => {
  it('cuts a text where each line of the grid is said, in order', () => {
    expect(
      markParts('Rédige une réponse courte à l’agent.', [
        { part: 'task', words: 'Rédige une réponse' },
        { part: 'reader', words: 'à l’agent' },
        { part: 'form', words: 'courte' },
        { part: 'tone', words: '' },
      ]),
    ).toEqual([
      { text: 'Rédige une réponse', part: 'task' },
      { text: ' ' },
      { text: 'courte', part: 'form' },
      { text: ' ' },
      { text: 'à l’agent', part: 'reader' },
      { text: '.' },
    ]);
  });

  it('leaves the text whole when no line is found', () => {
    expect(markParts('Bonjour', [{ part: 'task', words: 'Écris' }])).toEqual([
      { text: 'Bonjour' },
    ]);
  });
});
