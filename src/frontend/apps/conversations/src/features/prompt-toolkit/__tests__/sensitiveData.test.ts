import { detectSensitiveData } from '../coach/sensitiveData';

describe('detectSensitiveData', () => {
  it('finds nothing in a plain prompt', () => {
    expect(detectSensitiveData('Résume ce rapport en cinq points.')).toEqual(
      [],
    );
  });

  it.each([
    ['écris à jean.dupont@finances.gouv.fr', 'email'],
    ['rappelle le 06 12 34 56 78', 'phone'],
    ['son NIR est 1 85 05 78 006 084 36', 'nir'],
    ['IBAN FR76 3000 6000 0112 3456 7890 189', 'iban'],
    ['carte 4970 1012 3456 7890', 'card'],
  ])('detects %s', (text, kind) => {
    expect(detectSensitiveData(text)).toContain(kind);
  });
});
