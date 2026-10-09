import { describe, expect, it } from 'vitest';

import {
  fillTemplate,
  readSharedPrompt,
  shareLink,
  templateVars,
} from '../library/templateVars';

describe('saved prompts with blanks', () => {
  it('finds the blanks and fills them', () => {
    const text =
      'Écris à {{destinataire}} pour le {{date}}. Signé {{destinataire}}.';
    expect(templateVars(text)).toEqual(['destinataire', 'date']);
    expect(
      fillTemplate(text, { destinataire: 'Mme Dupont', date: '12 mai' }),
    ).toBe('Écris à Mme Dupont pour le 12 mai. Signé Mme Dupont.');
  });
});

describe('sharing a prompt as a link', () => {
  it('keeps the title and the text, accents included', () => {
    const link = shareLink('Relance', 'Rédige une relance à {{nom}} — merci !');
    const shared = readSharedPrompt(link.slice(link.indexOf('#')));
    expect(shared).toEqual({
      title: 'Relance',
      prompt: 'Rédige une relance à {{nom}} — merci !',
    });
  });

  it('ignores other addresses', () => {
    expect(readSharedPrompt('#something-else')).toBeNull();
    expect(readSharedPrompt('#robin-prompt=@@@')).toBeNull();
  });
});
