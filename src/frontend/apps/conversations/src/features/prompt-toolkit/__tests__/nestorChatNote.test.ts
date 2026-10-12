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
});
