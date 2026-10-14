import { coachThreadNote } from '../coach/coachApi';

const completion = (content: object) =>
  new Response(
    JSON.stringify({
      choices: [{ message: { content: JSON.stringify(content) } }],
    }),
    { status: 200 },
  );

describe('coachThreadNote', () => {
  afterEach(() => vi.restoreAllMocks());

  it('tells the coach what the user left out, to say it first', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        completion({ issue: 'Il manque la date.', try: 'Ajoutez-la.' }),
      );
    await coachThreadNote(
      [
        { role: 'user', text: 'Fais un courriel pour inviter l’équipe' },
        { role: 'assistant', text: 'Bonjour à tous, …' },
      ],
      null,
      'French',
      undefined,
      [],
      ['date', 'salle'],
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
    expect(body.messages[1].content).toContain(
      'sent without them: date, salle',
    );
  });

  it('blanks to fill are a calm reminder, never « not ready »', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        completion({ try: 'Avant d’envoyer : remplacez [Votre nom].' }),
      );
    await coachThreadNote(
      [
        { role: 'user', text: 'Réponds à l’agent' },
        { role: 'assistant', text: 'Bonjour, … Cordialement, [Votre nom]' },
      ],
      null,
      'French',
      undefined,
      ['Votre nom'],
    );
    const content = JSON.parse(fetchMock.mock.calls[0][1]?.body as string)
      .messages[1].content as string;
    expect(content).toContain('Votre nom');
    expect(content).toContain('Avant d’envoyer');
    expect(content).not.toMatch(/not ready/);
  });

  it('a request written by Nestor is never praised as the user’s', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(completion({ try: 'Dites le ton vous-même.' }));
    await coachThreadNote(
      [
        { role: 'user', text: 'Rédige une réponse de 5 lignes à l’agent.' },
        { role: 'assistant', text: 'Bonjour, …' },
      ],
      null,
      'French',
      undefined,
      [],
      [],
      'nestor',
    );
    const content = JSON.parse(fetchMock.mock.calls[0][1]?.body as string)
      .messages[1].content as string;
    expect(content).toContain('written by Nestor');
  });

  it('a cited text of law is to be checked at its source, never from memory', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(completion({ try: 'Vérifiez l’article.' }));
    await coachThreadNote(
      [
        { role: 'user', text: 'Quelle règle pour les congés ?' },
        { role: 'assistant', text: 'Selon le décret n° 84-972, …' },
      ],
      null,
      'French',
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
    expect(body.messages[0].content).toMatch(/Légifrance/);
  });
});
