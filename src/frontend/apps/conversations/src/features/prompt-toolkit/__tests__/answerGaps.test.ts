import { fillGaps, findGaps } from '../coach/answerGaps';

const ANSWER =
  'Bonjour Monsieur Durand,\nVotre dossier est suivi. Pour suivre votre demande, consultez À COMPLÉTER (vérifier le site officiel). Contactez-nous à À COMPLÉTER : adresse du service.\nCordialement,\n[Votre nom] [Votre service]';

describe('the gaps of an answer', () => {
  it('finds brackets and "TO COMPLETE", with what to give', () => {
    const gaps = findGaps(ANSWER);
    expect(gaps.map((gap) => gap.label)).toEqual([
      'vérifier le site officiel',
      'adresse du service',
      'Votre nom',
      'Votre service',
    ]);
    expect(gaps[0].sentence).toBe(
      'Pour suivre votre demande, consultez À COMPLÉTER (vérifier le site officiel).',
    );
  });

  it('fills each gap with exactly what the user typed', () => {
    const filled = fillGaps(ANSWER, [
      { value: 'le site de l’ANTS' },
      { value: 'cartes-grises@prefecture.fr' },
      { value: 'Martine Leroy' },
      { value: 'Accueil' },
    ]);
    expect(filled).toContain('consultez le site de l’ANTS.');
    expect(filled).toContain('Contactez-nous à cartes-grises@prefecture.fr.');
    expect(filled).toContain('Martine Leroy Accueil');
    expect(findGaps(filled)).toEqual([]);
  });

  it('takes away the sentence of a fact the user does not have', () => {
    const filled = fillGaps(ANSWER, [
      { drop: true },
      { value: 'cartes-grises@prefecture.fr' },
      { value: 'Martine Leroy' },
      { drop: true },
    ]);
    expect(filled).not.toContain('Pour suivre votre demande');
    expect(filled).toContain('Votre dossier est suivi.');
    expect(filled).toContain('Contactez-nous à cartes-grises@prefecture.fr.');
    // A name left out goes alone: the signature stays.
    expect(filled.endsWith('Martine Leroy')).toBe(true);
    expect(findGaps(filled)).toEqual([]);
  });

  it('leaves the gaps not answered yet', () => {
    const filled = fillGaps(ANSWER, [{ value: 'le site de l’ANTS' }]);
    expect(findGaps(filled)).toHaveLength(3);
  });
});
