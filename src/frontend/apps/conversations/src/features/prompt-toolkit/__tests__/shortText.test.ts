import { shortText } from '../chat/shortText';

describe('shortText', () => {
  it('keeps a short one-line text as it is', () => {
    expect(shortText('Réponds à l’agent')).toBe('Réponds à l’agent');
  });
  it('names a long text by its first line', () => {
    expect(shortText('réponds à l’agent\n\nCourriel reçu : « Bonjour… »')).toBe(
      'réponds à l’agent…',
    );
  });
});
