import { versionParts } from '../chat/versionParts';

describe('versionParts', () => {
  it('one green block for what Nestor added, the user’s words left plain', () => {
    expect(
      versionParts(
        'Fais un courriel pour inviter l’équipe',
        'Fais un courriel court et cordial pour inviter l’équipe',
      ),
    ).toEqual([
      { kind: 'same', text: 'Fais un courriel ' },
      { kind: 'added', text: 'court et cordial ' },
      { kind: 'same', text: 'pour inviter l’équipe' },
    ]);
  });

  it('a request written again almost entirely is shown plain, no patchwork', () => {
    expect(
      versionParts(
        'faire un mail pour la reunion de service de jeudi',
        'Rédiger un courriel pour convoquer l’ensemble du service à une réunion de point d’avancement jeudi en salle B12.',
      ),
    ).toEqual([
      {
        kind: 'same',
        text: 'Rédiger un courriel pour convoquer l’ensemble du service à une réunion de point d’avancement jeudi en salle B12.',
      },
    ]);
  });
});
