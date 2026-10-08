import { wordDiff } from '../coach/wordDiff';

describe('wordDiff', () => {
  it('marks added and removed words, and rebuilds both texts', () => {
    const parts = wordDiff(
      'Résume le rapport',
      'Résume le rapport annuel pour la direction',
    );
    expect(parts).toEqual([
      { kind: 'same', text: 'Résume le rapport' },
      { kind: 'added', text: ' annuel pour la direction' },
    ]);

    const swap = wordDiff('Écris un mail court', 'Écris un courriel court');
    const rebuild = (kinds: string[]) =>
      swap
        ?.filter((part) => kinds.includes(part.kind))
        .map((part) => part.text)
        .join('');
    expect(rebuild(['same', 'removed'])).toBe('Écris un mail court');
    expect(rebuild(['same', 'added'])).toBe('Écris un courriel court');
  });

  it('gives up on very long texts', () => {
    expect(wordDiff('a '.repeat(2000), 'b')).toBeNull();
  });
});
