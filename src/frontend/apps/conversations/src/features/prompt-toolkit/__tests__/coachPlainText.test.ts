import { asPlainText } from '../coach/coachApi';

describe('asPlainText: what the model writes, shown as plain words', () => {
  it('never shows markdown stars to the user', () => {
    expect(asPlainText('Gardez le *pourquoi* et le **quoi**.')).toBe(
      'Gardez le pourquoi et le quoi.',
    );
  });

  it('keeps a lone star that is not emphasis', () => {
    expect(asPlainText('Note : 5 * 3 = 15')).toBe('Note : 5 * 3 = 15');
  });
});
