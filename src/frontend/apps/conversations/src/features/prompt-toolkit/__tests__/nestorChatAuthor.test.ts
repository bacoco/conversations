import { authorOf, nestorWrote } from '../chat/author';
import { examplePairs } from '../chat/examples';
import type { NestorMessage } from '../chat/types';
import { casesOf } from '../jobs/jobs';

describe('who wrote the request sent', () => {
  const nestor = ['Rédigez une réponse simple et cordiale à un agent.'];

  it('Nestor, when it is his text as he gave it', () => {
    expect(
      authorOf(' Rédigez une réponse simple et cordiale  à un agent.', nestor),
    ).toBe('nestor');
  });
  it('both, when the user added to Nestor’s text', () => {
    expect(
      authorOf(
        'Rédigez une réponse simple et cordiale à un agent. En 3 lignes.',
        nestor,
      ),
    ).toBe('both');
  });
  it('the user, otherwise', () => {
    expect(authorOf('Écris un mot pour le pot de départ de Paul', nestor)).toBe(
      'user',
    );
  });
});

describe('what Nestor wrote, in the thread', () => {
  it('his ways to go on and his ideas count as his own words', () => {
    const messages = [
      {
        id: 's',
        action: 1,
        kind: 'suites',
        answerId: 'a',
        groups: [
          {
            kind: 'standard',
            axis: 'deepen',
            questions: ['Quels sont les critères de sélection des stations ?'],
          },
        ],
      },
      { id: 'p', action: 1, kind: 'pistes', phrases: ['Rédigez un courriel.'] },
    ] as unknown as NestorMessage[];
    const wrote = nestorWrote(messages);
    expect(
      authorOf('Quels sont les critères de sélection des stations ?', wrote),
    ).toBe('nestor');
    expect(authorOf('Rédigez un courriel.', wrote)).toBe('nestor');
  });
});

describe('examples, before and after', () => {
  it('the cases of my job: the vague request, the good one, the rule', () => {
    const pairs = examplePairs('rh');
    const [first] = casesOf('rh');
    expect(pairs).toHaveLength(3);
    expect(pairs[0]).toMatchObject({
      before: first.startingRequest,
      after: first.goodRequest,
      rule: first.lesson,
      caseId: first.id,
    });
  });
  it('without a job, one case of three different jobs', () => {
    const pairs = examplePairs(undefined);
    expect(pairs).toHaveLength(3);
    expect(
      new Set(pairs.map((pair) => pair.caseId.split('-')[0])).size,
    ).toBeGreaterThan(1);
  });
});
