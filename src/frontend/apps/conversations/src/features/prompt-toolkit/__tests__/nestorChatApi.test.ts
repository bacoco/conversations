import {
  adviceCount,
  checkRequest,
  hasHoles,
  parseRequestCheck,
  suggestPistes,
  withoutHoles,
  writeVersion,
} from '../chat/nestorChatApi';
import type { NestorMessage } from '../chat/types';

const completion = (content: object) =>
  new Response(
    JSON.stringify({
      choices: [{ message: { content: JSON.stringify(content) } }],
    }),
    { status: 200 },
  );

describe('parseRequestCheck', () => {
  it('keeps three missing pieces at most, each with a question', () => {
    const check = parseRequestCheck({
      present: ['La tâche', 'Le contexte'],
      missing: [
        {
          short: 'équipe',
          question: 'Quelle équipe ?',
          choices: [
            'Tout mon service',
            'Mon bureau',
            'Une équipe projet',
            'trop',
          ],
        },
        { short: 'date', question: 'Quelle date ?', choices: [] },
        { short: 'salle', question: 'Quelle salle ?' },
        { short: 'heure', question: 'Quelle heure ?' },
        { short: '', question: 'vide' },
      ],
      message: '« L’équipe » reste vague : laquelle ?',
    });
    expect(check.missing.map((item) => item.short)).toEqual([
      'équipe',
      'date',
      'salle',
    ]);
    expect(check.missing[0].choices).toHaveLength(3);
    expect(check.present).toEqual(['La tâche', 'Le contexte']);
  });
});

describe('holes', () => {
  it('finds brackets and blanks', () => {
    expect(hasHoles('Date : [date].')).toBe(true);
    expect(hasHoles('Salle : ___.')).toBe(true);
    expect(hasHoles('Écris au [service')).toBe(true);
    expect(hasHoles('Remplis ceci : []')).toBe(true);
    expect(hasHoles('Rédige un courriel court.')).toBe(false);
  });

  it('removes the sentences that hold a hole, nothing else', () => {
    expect(
      withoutHoles(
        'Rédige un courriel court. La réunion a lieu le [date]. Ton cordial.',
      ),
    ).toBe('Rédige un courriel court. Ton cordial.');
  });
});

describe('writeVersion', () => {
  afterEach(() => vi.restoreAllMocks());

  it('asks again once when the model leaves a hole, then removes it', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        completion({ version: 'Invite l’équipe. Date : [date].' }),
      )
      .mockResolvedValueOnce(
        completion({ version: 'Invite l’équipe. Salle : [salle].' }),
      );
    const version = await writeVersion(
      {
        draft: 'Fais un courriel pour inviter l’équipe',
        answers: [],
        skipped: ['date', 'salle'],
      },
      'French',
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(version).toBe('Invite l’équipe.');
  });

  it('asks again when an answer of the user is left out', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        completion({ version: 'Rédige un courriel pour inviter l’équipe.' }),
      )
      .mockResolvedValueOnce(
        completion({
          version:
            'Rédige un courriel pour inviter toute l’équipe du bureau 3.',
        }),
      );
    const version = await writeVersion(
      {
        draft: 'Fais un courriel pour inviter l’équipe',
        answers: [
          { question: 'Quelle équipe ?', answer: 'toute l’équipe du bureau 3' },
        ],
        skipped: [],
      },
      'French',
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(version).toContain('bureau 3');
  });
});

describe('writeVersion — the answers woven in', () => {
  afterEach(() => vi.restoreAllMocks());

  it('asks again when the version copies a question instead of using the answer', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        completion({
          version: 'Réponds à l’agent. Pourquoi refuser ? besoin de présence.',
        }),
      )
      .mockResolvedValueOnce(
        completion({
          version:
            'Rédige un refus courtois : le service a besoin de présence sur place.',
        }),
      );
    const version = await writeVersion(
      {
        draft: 'Réponds non à l’agent',
        answers: [
          { question: 'Pourquoi refuser ?', answer: 'besoin de présence' },
        ],
        skipped: [],
      },
      'French',
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(version).not.toContain('Pourquoi refuser ?');
  });
});

describe('checkRequest', () => {
  afterEach(() => vi.restoreAllMocks());

  it('sends the draft as data and reads the answer', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(
        completion({ present: ['La tâche'], missing: [], message: 'Claire.' }),
      );
    const check = await checkRequest('Traduis ce texte en anglais', 'French');
    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
    expect(body.messages[1].content).toContain('<prompt>');
    expect(check.missing).toEqual([]);
  });
});

describe('adviceCount', () => {
  const advice = (applied: boolean | null) =>
    ({
      id: String(Math.random()),
      action: 0,
      kind: 'advice',
      missing: [],
      answerId: 'a',
      note: { applied },
    }) as unknown as NestorMessage;

  it('counts the advice that could be checked, and the applied ones', () => {
    expect(adviceCount([advice(null), advice(true), advice(false)])).toEqual({
      advised: 2,
      applied: 1,
    });
  });
});

describe('suggestPistes', () => {
  afterEach(() => vi.restoreAllMocks());

  it('keeps the user’s own task: three versions, no blank, not the draft itself', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      completion({
        pistes: [
          'Fais un courriel pour inviter l’équipe',
          'Rédige un courriel court pour inviter l’équipe à une réunion',
          'Invite l’équipe le [date] en salle [salle]',
          'Rédige un courriel cordial pour inviter toute l’équipe',
          'Rédige un courriel court pour inviter l’équipe à une réunion',
          'Écris une invitation à l’équipe, avec une demande de confirmation',
          'Une quatrième de trop',
        ],
      }),
    );
    const pistes = await suggestPistes(
      'Fais un courriel pour inviter l’équipe',
      'French',
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
    expect(body.messages[1].content).toContain('Fais un courriel pour inviter');
    expect(pistes).toEqual([
      'Rédige un courriel court pour inviter l’équipe à une réunion',
      'Rédige un courriel cordial pour inviter toute l’équipe',
      'Écris une invitation à l’équipe, avec une demande de confirmation',
    ]);
  });
});
