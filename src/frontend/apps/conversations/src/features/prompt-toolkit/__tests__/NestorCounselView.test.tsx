import { fireEvent, render, screen } from '@testing-library/react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { NestorThread } from '../chat/NestorThread';
import type { NestorMessage } from '../chat/types';
import type { NestorChat } from '../chat/useNestorChat';

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const chatWith = (messages: NestorMessage[], action = 9): NestorChat =>
  ({
    messages,
    action,
    busy: null,
    questions: {
      items: [],
      current: null,
      answers: [],
      skipped: [],
      done: false,
    },
    runRound: vi.fn(),
    answerQuestion: vi.fn(),
    placeVersion: vi.fn(),
    placeChoice: vi.fn(),
    choosePiste: vi.fn(),
    askAbout: vi.fn(),
    usePrompt: vi.fn(),
  }) as unknown as NestorChat;

describe('advice, then versions', () => {
  beforeAll(async () => {
    await i18n.use(initReactI18next).init({
      lng: 'en',
      resources: { en: { translation: {} } },
      nsSeparator: false,
      keySeparator: false,
      interpolation: { escapeValue: false },
    });
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('the advice says what is good, what to do and why', () => {
    render(
      <NestorThread
        chat={chatWith([
          {
            id: 'c',
            action: 9,
            kind: 'counsel',
            draft: 'x',
            advice: {
              good: ['Vous avez collé le courriel.'],
              tips: [
                { text: 'Dites la longueur voulue.', why: 'Sinon une page.' },
              ],
            },
            rounds: [{ id: 'give-text', primary: true }, { id: 'say' }],
          },
        ])}
        pistes={[]}
      />,
    );
    expect(screen.getByText('My advice on your request')).toBeInTheDocument();
    expect(
      screen.getByText('Vous avez collé le courriel.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Dites la longueur voulue.')).toBeInTheDocument();
    expect(screen.getByText('Sinon une page.')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /Give me the right text/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Say it/ })).toBeInTheDocument();
  });

  it('two versions: the whole request shown, the pasted texts folded', () => {
    const pasted =
      'Courriel reçu :\n« Bonjour, je voudrais changer mon jour de télétravail la semaine prochaine. »';
    const chat = chatWith([
      {
        id: 'v',
        action: 9,
        kind: 'versions',
        draft: `réponds à l’agent\n\n${pasted}`,
        items: [
          {
            title: 'Courte : 5 lignes, ton simple',
            text: `Rédige une réponse de 5 lignes, courtoise et simple, à l’agent qui m’écrit pour déplacer son jour de télétravail du mardi au mercredi, à partir du courriel ci-dessous.\n\n${pasted}`,
          },
          {
            title: 'Détaillée : ton formel',
            text: `Rédige une réponse formelle.\n\n${pasted}`,
          },
        ],
      },
    ]);
    render(<NestorThread chat={chat} pistes={[]} />);
    expect(
      screen.getByText('Courte : 5 lignes, ton simple'),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        /du mardi au mercredi, à partir du courriel ci-dessous\./,
      ),
    ).toBeInTheDocument();
    expect(screen.queryByText(/Courriel reçu/)).not.toBeInTheDocument();
    fireEvent.click(
      screen.getAllByRole('button', { name: 'Show the texts you pasted' })[0],
    );
    expect(screen.getByText(/Courriel reçu/)).toBeInTheDocument();
    const put = screen.getAllByRole('button', {
      name: 'Put it in the Assistant’s field',
    });
    expect(put).toHaveLength(2);
    fireEvent.click(put[1]);
    expect(chat.placeChoice).toHaveBeenCalledWith('v', 1);
  });

  it('a request Nestor proposes is shown before it is put in the field', () => {
    render(
      <NestorThread
        chat={chatWith([
          {
            id: 'r',
            action: 9,
            kind: 'reply',
            text: 'Demandez-le à l’Assistant.',
            prompt: 'Fais un tableau des règles de cette note.',
          },
        ])}
        pistes={[]}
      />,
    );
    expect(
      screen.getByText('Fais un tableau des règles de cette note.'),
    ).toBeInTheDocument();
  });

  it('« Je corrige moi-même » sends the user back to the field', () => {
    render(
      <NestorThread
        chat={chatWith([
          { id: 'h', action: 9, kind: 'hint', hint: 'fix-myself' },
        ])}
        pistes={[]}
      />,
    );
    expect(
      screen.getByText(/Correct your text in the Assistant’s field/),
    ).toBeInTheDocument();
  });

  it('blanks to fill are said calmly, never as an alarm', () => {
    render(
      <NestorThread
        chat={chatWith([
          {
            id: 'a',
            action: 9,
            kind: 'advice',
            answerId: 'm1',
            missing: [],
            gaps: ['Votre nom'],
            note: {
              upTo: 2,
              exchanges: 1,
              fromStart: true,
              followUp: '',
              applied: null,
              worked: '',
              issue: 'Il reste [Votre nom] à remplacer.',
              tryNow: 'Avant d’envoyer : remplacez [Votre nom].',
              tryWhy: '',
              prompt: '',
              habit: '',
              competency: null,
            },
          },
        ])}
        pistes={[]}
      />,
    );
    expect(
      screen.getByText(/Il reste \[Votre nom\]/).textContent,
    ).not.toContain('⚠');
  });

  it('« Le dire » looks apart from the other buttons', () => {
    render(
      <NestorThread
        chat={chatWith([
          {
            id: 'c',
            action: 9,
            kind: 'counsel',
            draft: 'x',
            advice: { good: ['Bien.'], tips: [] },
            rounds: [{ id: 'give-text', primary: true }, { id: 'say' }],
          },
        ])}
        pistes={[]}
      />,
    );
    expect(screen.getByRole('button', { name: /Say it/ })).toHaveAttribute(
      'data-voice',
      'true',
    );
  });
});
