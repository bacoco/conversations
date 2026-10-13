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

describe('the grid of a request', () => {
  const draft =
    'Rédigez une réponse simple et cordiale à un agent sur ses RTT.';

  it('keeps only the words really written in the request', () => {
    const check = parseRequestCheck(
      {
        grid: {
          task: 'une réponse',
          reader: 'à un agent',
          material: 'la note de service',
          form: '',
          tone: 'simple et cordiale',
        },
        missing: [],
        message: 'Claire.',
      },
      draft,
    );
    expect(check.grid).toEqual([
      { part: 'task', words: 'une réponse' },
      { part: 'reader', words: 'à un agent' },
      { part: 'material', words: '' },
      { part: 'form', words: '' },
      { part: 'tone', words: 'simple et cordiale' },
    ]);
  });

  it('never offers ready answers to a fact only the user knows', () => {
    const check = parseRequestCheck(
      {
        missing: [
          {
            short: 'règles RTT',
            question: 'Quelles sont les règles pour les RTT ?',
            fact: true,
            choices: ['Les RTT se posent librement.'],
          },
          {
            short: 'décision',
            question: 'Vous acceptez ou vous refusez ?',
            fact: false,
            choices: ['J’accepte', 'Je refuse'],
          },
        ],
        message: 'Je n’invente pas ce que vous seul savez.',
      },
      draft,
    );
    expect(check.missing[0].choices).toEqual([]);
    expect(check.missing[1].choices).toEqual(['J’accepte', 'Je refuse']);
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
    expect(version.version).toBe('Invite l’équipe.');
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
    expect(version.version).toContain('bureau 3');
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
    expect(version.version).not.toContain('Pourquoi refuser ?');
  });
});

describe('writeVersion — shorter and other really change', () => {
  afterEach(() => vi.restoreAllMocks());
  const draft =
    'Rédigez un article pour l’intranet à destination des employés sur la journée portes ouvertes du samedi 18 octobre, de 10 h à 17 h, sur un ton informatif.';

  it('"Plus court" not shorter: asked again with a length to keep under', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(completion({ version: draft }))
      .mockResolvedValueOnce(
        completion({
          version:
            'Article intranet : portes ouvertes samedi 18 octobre, 10 h-17 h, ton informatif.',
        }),
      );
    const version = await writeVersion(
      { draft, answers: [], skipped: [], style: 'shorter' },
      'French',
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(version.version.length).toBeLessThan(draft.length);
  });

  it('"Autre version" identical: asked again', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(completion({ version: draft }))
      .mockResolvedValueOnce(
        completion({
          version:
            'Pour l’intranet, écrivez aux employés un article sur les portes ouvertes du samedi 18 octobre (10 h-17 h), ton informatif.',
        }),
      );
    await writeVersion(
      { draft, answers: [], skipped: [], style: 'other' },
      'French',
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('writeVersion — the lesson under the version', () => {
  afterEach(() => vi.restoreAllMocks());

  it('brings back what to write oneself next time', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      completion({
        version: 'Rédige un courriel court pour inviter tout le service jeudi.',
        lesson:
          'Dites dès le début pour qui et quel jour : « pour tout le service, jeudi ».',
      }),
    );
    const result = await writeVersion(
      { draft: 'Fais un courriel pour inviter', answers: [], skipped: [] },
      'French',
    );
    expect(result).toEqual({
      version: 'Rédige un courriel court pour inviter tout le service jeudi.',
      lesson:
        'Dites dès le début pour qui et quel jour : « pour tout le service, jeudi ».',
    });
  });
});

describe('a pasted text', () => {
  afterEach(() => vi.restoreAllMocks());

  it('always reaches the Assistant, word for word, under the version', async () => {
    const pasted =
      'Courriel reçu :\n« Bonjour, je suis en télétravail le mardi et le jeudi. La semaine prochaine, j’ai une formation le mardi : est-ce que je peux mettre mon télétravail le mercredi à la place ? Merci. »';
    vi.spyOn(global, 'fetch').mockResolvedValue(
      completion({
        version: 'Répondez à l’agent en acceptant le changement.',
        lesson: '',
      }),
    );
    const { version } = await writeVersion(
      { draft: `réponds à l'agent\n\n${pasted}`, answers: [], skipped: [] },
      'French',
    );
    expect(version).toBe(
      `Répondez à l’agent en acceptant le changement.\n\n${pasted}`,
    );
  });
});

describe('a fact the user does not know', () => {
  afterEach(() => vi.restoreAllMocks());

  it('is never stated: the assistant is asked not to state it either', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      completion({
        version: 'Rédige une réponse à un agent sur ses RTT.',
        lesson: '',
      }),
    );
    await writeVersion(
      { draft: 'Réponds sur les RTT', answers: [], skipped: ['règles RTT'] },
      'French',
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
    expect(body.messages[1].content).toContain(
      'The user does not know these yet: règles RTT',
    );
    expect(body.messages[1].content).toContain('not to state them either');
  });
});

describe('the lesson under a version', () => {
  afterEach(() => vi.restoreAllMocks());

  it('is about what the request did not say', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      completion({
        version: 'Rédige un courriel court pour le service.',
        lesson: 'x',
      }),
    );
    await writeVersion(
      {
        draft: 'Fais un courriel',
        answers: [],
        skipped: [],
        gaps: ['reader', 'form'],
      },
      'French',
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
    expect(body.messages[1].content).toContain('Not said: reader, form');
  });
});

describe('checkRequest', () => {
  afterEach(() => vi.restoreAllMocks());

  it('reads the request with the conversation so far: what it says is not missing', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      completion({
        present: ['Les bénévoles'],
        missing: [],
        message: 'Claire.',
      }),
    );
    await checkRequest(
      'Remercie les bénévoles de la journée',
      'French',
      undefined,
      [
        {
          role: 'user',
          text: 'Article sur la journée portes ouvertes du 18 octobre',
        },
        { role: 'assistant', text: 'Voici l’article…' },
      ],
    );
    const body = JSON.parse(fetchMock.mock.calls[0][1]?.body as string);
    expect(body.messages[1].content).toContain(
      'journée portes ouvertes du 18 octobre',
    );
  });

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
