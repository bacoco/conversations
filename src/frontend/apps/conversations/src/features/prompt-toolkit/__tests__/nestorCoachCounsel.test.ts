import {
  adviseRequest,
  coachChat,
  parseCoachReply,
  parseRequestAdvice,
  writeChoices,
} from '../chat/nestorChatApi';
import { FILL_MODEL } from '../coach/coachApi';

const completion = (content: object) =>
  new Response(
    JSON.stringify({
      choices: [{ message: { content: JSON.stringify(content) } }],
    }),
    { status: 200 },
  );

const sentBody = (fetchMock: ReturnType<typeof vi.spyOn>, call = 0) =>
  JSON.parse((fetchMock.mock.calls[call][1] as RequestInit).body as string) as {
    model: string;
    messages: { role: string; content: string }[];
  };

beforeEach(() => vi.restoreAllMocks());

const EMAIL =
  '« Bonjour, je suis en télétravail le mardi et le jeudi. La semaine prochaine, j’ai une formation le mardi : est-ce que je peux mettre mon télétravail le mercredi à la place ? Merci. »';
const DRAFT = `réponds à l'agent pour son télétravail\n\nCourriel reçu :\n${EMAIL}`;

describe('parseRequestAdvice', () => {
  it('keeps what is good and the tips, each with its reason', () => {
    const advice = parseRequestAdvice({
      good: ['Vous avez collé le courriel.', '', 'Le sujet est clair.', 'trop'],
      tips: [
        { text: 'Dites la longueur voulue.', why: 'Sinon il écrit une page.' },
        { text: '', why: 'vide' },
        { text: 'Dites le ton.' },
      ],
    });
    expect(advice.good).toEqual([
      'Vous avez collé le courriel.',
      'Le sujet est clair.',
    ]);
    expect(advice.tips).toEqual([
      { text: 'Dites la longueur voulue.', why: 'Sinon il écrit une page.' },
      { text: 'Dites le ton.', why: '' },
    ]);
  });

  it('nothing to say is an error, never an empty bubble', () => {
    expect(() => parseRequestAdvice({ good: [], tips: [] })).toThrow();
  });
});

describe('adviseRequest', () => {
  it('reads the request with the stronger model and asks no question', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      completion({
        good: ['Vous avez collé le courriel.'],
        tips: [{ text: 'Dites la longueur voulue.', why: 'Sinon une page.' }],
      }),
    );
    const advice = await adviseRequest(DRAFT, 'French');
    expect(advice.tips).toHaveLength(1);
    const body = sentBody(fetchMock);
    expect(body.model).toBe(FILL_MODEL);
    expect(body.messages.at(-1)?.content).toContain(EMAIL);
    expect(body.messages[0].content).toMatch(/never ask/i);
  });
});

describe('writeChoices', () => {
  it('two versions written together, one short, one detailed', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      completion({
        versions: [
          {
            title: 'Courte : 5 lignes, ton simple',
            text: "Rédige une réponse de 5 lignes à l'agent.",
          },
          {
            title: 'Détaillée : 3 paragraphes, ton formel',
            text: "Rédige une réponse formelle à l'agent.",
          },
          { title: 'En trop', text: 'Une troisième.' },
        ],
      }),
    );
    const choices = await writeChoices(
      {
        draft: DRAFT,
        count: 2,
        tips: ['Dites la longueur voulue.', 'Dites le ton.'],
      },
      'French',
    );
    expect(choices.map((choice) => choice.title)).toEqual([
      'Courte : 5 lignes, ton simple',
      'Détaillée : 3 paragraphes, ton formel',
    ]);
    const body = sentBody(fetchMock);
    expect(body.messages.at(-1)?.content).toContain('Dites le ton.');
    // The length and tone of each version win over the advice.
    expect(body.messages[0].content).toMatch(/second is detailed and formal/);
  });

  it('a pasted text the model dropped comes back word for word', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      completion({
        versions: [
          { title: 'Courte', text: "Rédige une réponse courte à l'agent." },
        ],
      }),
    );
    const [choice] = await writeChoices(
      { draft: DRAFT, count: 1, tips: [] },
      'French',
    );
    expect(choice.text).toContain(EMAIL);
  });

  it('the request first, the pasted text last, even when the model mixed them', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      completion({
        versions: [
          {
            title: 'Courte',
            text: `Réponds à l'agent. Voici le courriel reçu :\n\nCourriel reçu :\n${EMAIL}\n\nRédige une réponse de 5 lignes, courtoise.`,
          },
        ],
      }),
    );
    const [choice] = await writeChoices(
      { draft: DRAFT, count: 1, tips: [] },
      'French',
    );
    expect(choice.text.indexOf('Rédige une réponse de 5 lignes')).toBeLessThan(
      choice.text.indexOf(EMAIL),
    );
    expect(choice.text.endsWith(EMAIL)).toBe(true);
    expect(choice.text.split(EMAIL)).toHaveLength(2);
  });

  it('never leaves a blank to fill', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      completion({
        versions: [
          {
            title: 'Courte',
            text: "Rédige une réponse à l'agent. Signe avec [Votre nom].",
          },
        ],
      }),
    );
    const [choice] = await writeChoices(
      { draft: 'réponds à l’agent', count: 1, tips: [] },
      'French',
    );
    expect(choice.text).not.toContain('[');
  });

  it('no version at all is an error, never an empty card', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(() =>
      Promise.resolve(completion({ versions: [] })),
    );
    await expect(
      writeChoices({ draft: DRAFT, count: 2, tips: [] }, 'French'),
    ).rejects.toThrow();
  });
});

describe('a version reads as whole sentences', () => {
  it('a sentence never starts with a small letter', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce(
      completion({
        versions: [
          {
            title: 'Courte',
            text: "Réponds à l'agent en 3 lignes. à partir du courriel ci-dessous.",
          },
        ],
      }),
    );
    const [choice] = await writeChoices(
      { draft: DRAFT, count: 1, tips: [] },
      'French',
    );
    expect(choice.text).toContain('3 lignes. À partir du courriel');
  });
});

describe('parseCoachReply', () => {
  it('keeps an action Nestor can run, nothing else', () => {
    expect(
      parseCoachReply({ message: 'Je regarde.', action: 'analyse' }),
    ).toEqual({ text: 'Je regarde.', action: 'analyse' });
    expect(
      parseCoachReply({ message: 'Vous parlez de quoi ?', action: 'clarify' }),
    ).toEqual({ text: 'Vous parlez de quoi ?', action: 'clarify' });
    expect(parseCoachReply({ message: 'Bonjour.', action: 'delete' })).toEqual({
      text: 'Bonjour.',
    });
  });

  it('keeps a ready request when Nestor proposes one', () => {
    expect(
      parseCoachReply({
        message: 'Par exemple :',
        prompt: 'Fais un tableau des règles de cette note.',
      }),
    ).toEqual({
      text: 'Par exemple :',
      prompt: 'Fais un tableau des règles de cette note.',
    });
  });

  it('an empty reply is an error', () => {
    expect(() => parseCoachReply({ message: '' })).toThrow();
  });
});

describe('coachChat', () => {
  it('Nestor sees the field, his own last steps and the conversation', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValueOnce(
        completion({ message: 'Je regarde.', action: 'analyse' }),
      );
    const reply = await coachChat(
      {
        history: [{ role: 'user', text: 'Regarde ce que j’ai écrit' }],
        draft: DRAFT,
        done: ['Mes conseils sur votre demande'],
      },
      'French',
      undefined,
      [{ role: 'assistant', text: 'Votre demande peut être acceptée.' }],
    );
    expect(reply.action).toBe('analyse');
    const system = sentBody(fetchMock).messages[0].content;
    expect(system).toContain(EMAIL);
    expect(system).toContain('Mes conseils sur votre demande');
    expect(system).toContain('Votre demande peut être acceptée.');
    expect(system).toMatch(/coach/i);
  });
});
