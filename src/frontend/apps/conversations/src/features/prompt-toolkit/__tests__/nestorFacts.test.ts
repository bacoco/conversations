import { changedNumbers, numbersOf, unfoundNumbers } from '../chat/facts';

describe('the figures of a text', () => {
  it('reads figures, amounts written with spaces, hours and years', () => {
    expect(
      numbersOf('La facture de 4 860 euros, reçue le 12/03/2026, à 10h30.'),
    ).toEqual(['4860', '12', '03', '2026', '10', '30']);
  });

  it('a version that changes a figure says which, added or removed', () => {
    expect(
      changedNumbers(
        'Réponds au fournisseur : facture de 4 860 euros, délai de 48 heures.',
        'Réponds en 5 lignes : facture de 4 680 euros, délai de 48 heures.',
        [],
      ),
    ).toEqual({ added: ['4680'], removed: ['4860'] });
  });

  it('the figures of the advice and small numbers are no change of fact', () => {
    expect(
      changedNumbers(
        'Réponds à l’agent.',
        'Réponds en 5 lignes, en 3 paragraphes, comme demandé en 15 lignes.',
        ['Dites la longueur : 15 lignes.'],
      ),
    ).toEqual({ added: [], removed: [] });
  });

  it('figures of the answer that are nowhere in what the user gave', () => {
    expect(
      unfoundNumbers(
        'Le changement est possible si la demande est faite 72 heures avant, selon la note de 2024.',
        ['Note : demandé au moins 48 heures à l’avance.'],
      ),
    ).toEqual(['72', '2024']);
  });
});
