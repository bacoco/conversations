import {
  checkFix,
  parseCheckFix,
  parseRequestAdvice,
  parseStarter,
  starterFor,
  writeChoices,
} from '../chat/nestorChatApi';
import { COACH_MODEL } from '../coach/coachApi';

const completion = (content: object) =>
  new Response(
    JSON.stringify({
      choices: [{ message: { content: JSON.stringify(content) } }],
    }),
    { status: 200 },
  );

const body = (fetchMock: ReturnType<typeof vi.spyOn>) =>
  JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string) as {
    model: string;
    messages: { role: string; content: string }[];
  };

beforeEach(() => vi.restoreAllMocks());

describe('a task of the job: the start of a request and one good reflex', () => {
  it('keeps the request whole, never a blank', () => {
    expect(
      parseStarter({
        request: 'Rédige une fiche de poste d’une page pour [poste].',
        reflex: 'Dites toujours qui va lire.',
      }),
    ).toEqual({
      request: '',
      reflex: 'Dites toujours qui va lire.',
    });
    expect(() => parseStarter({ request: '', reflex: '' })).toThrow();
  });

  it('asks for the task the user chose', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue(
      completion({
        request: 'Rédige une fiche de poste d’une page.',
        reflex: 'Dites qui va lire.',
      }),
    );
    const starter = await starterFor('rédiger une fiche de poste', 'French');
    expect(starter.request).toBe('Rédige une fiche de poste d’une page.');
    expect(body(fetchMock).messages.at(-1)?.content).toContain(
      'rédiger une fiche de poste',
    );
  });
});

describe('advice the user can add with one click', () => {
  it('each piece of advice keeps the words to add and its line', () => {
    expect(
      parseRequestAdvice({
        good: [],
        tips: [
          {
            text: 'Dites la longueur voulue.',
            why: 'Sinon une page.',
            add: 'en 5 lignes',
            part: 'form',
          },
          { text: 'Collez la note.', why: '', add: '', part: 'nothing' },
        ],
      }).tips,
    ).toEqual([
      {
        text: 'Dites la longueur voulue.',
        why: 'Sinon une page.',
        add: 'en 5 lignes',
        part: 'form',
      },
      { text: 'Collez la note.', why: '' },
    ]);
  });
});

describe('Nestor looks at the user’s own correction', () => {
  it('one answer per piece of advice, nothing else', () => {
    expect(
      parseCheckFix({ done: [true, 'oui', false], message: 'Bien.' }, 2),
    ).toEqual({ done: [true, false], message: 'Bien.' });
  });

  it('asks the quick model, with the field and the advice', async () => {
    const fetchMock = vi
      .spyOn(global, 'fetch')
      .mockResolvedValue(completion({ done: [true], message: 'Bien.' }));
    await checkFix(
      'Réponds en 5 lignes à l’agent.',
      ['Dites la longueur voulue.'],
      'French',
    );
    const sent = body(fetchMock);
    expect(sent.model).toBe(COACH_MODEL);
    expect(sent.messages.at(-1)?.content).toContain('en 5 lignes');
    expect(sent.messages.at(-1)?.content).toContain(
      'Dites la longueur voulue.',
    );
  });
});

describe('a version that changes a figure says so', () => {
  it('flags the figures added or lost', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue(
      completion({
        versions: [
          {
            title: 'Courte',
            text: 'Réponds au fournisseur : facture de 4 680 euros.',
          },
        ],
      }),
    );
    const [choice] = await writeChoices(
      {
        draft: 'réponds au fournisseur, facture de 4 860 euros',
        count: 1,
        tips: [],
      },
      'French',
    );
    expect(choice.changed).toEqual({ added: ['4680'], removed: ['4860'] });
  });
});
