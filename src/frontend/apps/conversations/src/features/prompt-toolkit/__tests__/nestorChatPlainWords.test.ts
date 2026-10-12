import { plainWords } from '../chat/plainWords';

describe('plainWords', () => {
  it('says « demande » and « courriel » in French, never prompt or mail', () => {
    expect(
      plainWords(
        'Vos prompts et ce prompt donnent un email ; le prompt, un e-mail ou un mail.',
        'fr',
      ),
    ).toBe(
      'Vos demandes et cette demande donnent un courriel ; la demande, un courriel ou un courriel.',
    );
  });

  it('leaves other languages as they are', () => {
    expect(plainWords('Your prompt and email', 'en')).toBe(
      'Your prompt and email',
    );
  });

  it('keeps the plural', () => {
    expect(plainWords('Relisez vos e-mails et vos mails.', 'fr')).toBe(
      'Relisez vos courriels et vos courriels.',
    );
  });
});
