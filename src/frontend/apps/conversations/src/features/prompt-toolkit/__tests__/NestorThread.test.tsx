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
    choosePiste: vi.fn(),
    askAbout: vi.fn(),
    usePrompt: vi.fn(),
  }) as unknown as NestorChat;

describe('<NestorThread />', () => {
  beforeAll(async () => {
    // A real English instance: the texts are checked with their values.
    await i18n.use(initReactI18next).init({
      lng: 'en',
      resources: { en: { translation: {} } },
      nsSeparator: false,
      keySeparator: false,
      interpolation: { escapeValue: false },
    });
    Element.prototype.scrollIntoView = vi.fn();
  });

  it('shows the welcome and "Voir des exemples" on an empty thread', () => {
    render(<NestorThread chat={chatWith([])} pistes={[]} />);
    expect(
      screen.getByText(/Write your request in the Assistant’s field/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'See examples' }),
    ).toBeInTheDocument();
  });

  it('folds a past step into one line that reopens', () => {
    render(
      <NestorThread
        chat={chatWith(
          [
            {
              id: 'a',
              action: 1,
              kind: 'analysis',
              draft: 'x',
              check: {
                present: ['La tâche'],
                missing: [
                  { short: 'date', question: 'Quelle date ?', choices: [] },
                ],
                message: 'Il manque la date.',
              },
            },
            { id: 'b', action: 2, kind: 'reply', text: 'Maintenant' },
          ],
          2,
        )}
        pistes={[]}
      />,
    );
    const line = screen.getByText('Analysis: missing date');
    expect(screen.getByText('Il manque la date.')).not.toBeVisible();
    fireEvent.click(line);
    expect(screen.getByText('Il manque la date.')).toBeVisible();
  });

  it('shows the rounds of the last message only, and sends the click', () => {
    const chat = chatWith([
      {
        id: 'v',
        action: 9,
        kind: 'version',
        original: 'Fais un courriel',
        version: 'Rédige un courriel court',
        missing: ['date', 'salle'],
        rounds: [{ id: 'redo-with-missing', primary: true }, { id: 'shorter' }],
      },
    ]);
    render(<NestorThread chat={chat} pistes={[]} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Redo with date and salle' }),
    );
    expect(chat.runRound).toHaveBeenCalledWith('v', {
      id: 'redo-with-missing',
      primary: true,
    });
  });

  it('"Redo with…" names what is missing, even under the ways to go on', () => {
    const chat = chatWith([
      {
        id: 'v',
        action: 7,
        kind: 'version',
        original: 'a',
        version: 'b',
        missing: ['date', 'salle'],
      },
      {
        id: 's',
        action: 9,
        kind: 'suites',
        answerId: 'm1',
        groups: [
          { kind: 'extra', label: 'x', questions: ['Donne un exemple'] },
        ],
        rounds: [{ id: 'redo-with-missing', primary: true }],
      },
    ]);
    render(<NestorThread chat={chat} pistes={[]} />);
    expect(
      screen.getByRole('button', { name: 'Redo with date and salle' }),
    ).toBeInTheDocument();
  });

  it('examples are introduced as examples', () => {
    render(
      <NestorThread
        chat={chatWith([
          {
            id: 'e',
            action: 9,
            kind: 'pistes',
            phrases: ['Résume ceci'],
            examples: true,
          },
        ])}
        pistes={[]}
      />,
    );
    expect(
      screen.getByText(
        'A few everyday requests. One click puts it in the Assistant’s field.',
      ),
    ).toBeInTheDocument();
  });

  it('only the latest version can be put in the field', () => {
    render(
      <NestorThread
        chat={chatWith([
          {
            id: 'v1',
            action: 9,
            kind: 'version',
            original: 'a',
            version: 'Ancienne version',
            missing: [],
          },
          {
            id: 'v2',
            action: 9,
            kind: 'version',
            original: 'b',
            version: 'Nouvelle version',
            missing: [],
          },
        ])}
        pistes={[]}
      />,
    );
    expect(
      screen.getAllByRole('button', {
        name: 'Put it in the Assistant’s field',
      }),
    ).toHaveLength(1);
  });

  it('one piece of advice is said in the singular', () => {
    render(
      <NestorThread
        chat={chatWith([
          {
            id: 'r',
            action: 9,
            kind: 'review',
            advised: 1,
            applied: 0,
            answerId: 'm',
            review: {
              summary: 'Bien.',
              strengths: [],
              habits: [],
              tips: [],
              grades: [],
            },
          },
        ])}
        pistes={[]}
      />,
    );
    expect(
      screen.getByText('Out of 1 piece of advice, you applied 0'),
    ).toBeInTheDocument();
  });

  it('under the version, the lesson: what to write oneself next time', () => {
    render(
      <NestorThread
        chat={chatWith([
          {
            id: 'v',
            action: 9,
            kind: 'version',
            original: 'a',
            version: 'b',
            missing: [],
            lesson: 'Dites pour qui dès le début.',
          },
        ])}
        pistes={[]}
      />,
    );
    expect(
      screen.getByText('Next time, write it yourself:'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Dites pour qui dès le début.'),
    ).toBeInTheDocument();
  });

  it('a question: "Question 1 of 3", the choices, "I don’t know", stop', () => {
    const items = [
      {
        short: 'équipe',
        question: 'Quelle équipe ?',
        choices: ['Tout mon service', 'Mon bureau'],
      },
      { short: 'date', question: 'Quelle date ?', choices: [] },
      { short: 'salle', question: 'Quelle salle ?', choices: [] },
    ];
    const chat = chatWith([
      { id: 'q', action: 9, kind: 'question', index: 0, items },
    ]);
    chat.questions = {
      items,
      current: { id: 'q', action: 9, kind: 'question', index: 0, items },
      answers: [],
      skipped: [],
      done: false,
    };
    render(<NestorThread chat={chat} pistes={[]} />);
    expect(screen.getByText('Question 1 of 3')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Mon bureau' }));
    expect(chat.answerQuestion).toHaveBeenCalledWith('Mon bureau', 'choice');
    fireEvent.click(screen.getByRole('button', { name: 'I don’t know' }));
    expect(chat.answerQuestion).toHaveBeenCalledWith('I don’t know', 'skip');
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Stop the questions and write the version',
      }),
    );
    expect(chat.answerQuestion).toHaveBeenCalledWith(
      'Stop the questions and write the version',
      'stop',
    );
  });

  it('the version marks what Nestor added and what is left out', () => {
    render(
      <NestorThread
        chat={chatWith([
          {
            id: 'v',
            action: 9,
            kind: 'version',
            original: 'inviter l’équipe',
            version: 'inviter toute l’équipe',
            missing: ['date', 'salle'],
          },
        ])}
        pistes={[]}
      />,
    );
    expect(screen.getByText('Suggested by Nestor')).toBeInTheDocument();
    expect(
      screen.getByText(
        '⚠ To add when you know it: {{items}}.'.replace(
          '{{items}}',
          'date and salle',
        ),
      ),
    ).toBeInTheDocument();
  });

  const scrolledTo = (scrollTop: number) => {
    const scroll = vi.fn();
    Element.prototype.scrollIntoView = scroll;
    const { rerender } = render(
      <NestorThread chat={chatWith([])} pistes={[]} />,
    );
    // The thread scrolls by itself.
    const box = screen.getByTestId('nestor-thread');
    Object.defineProperty(box, 'scrollHeight', { value: 2000 });
    Object.defineProperty(box, 'clientHeight', { value: 100 });
    box.scrollTop = scrollTop;
    fireEvent.scroll(box);
    scroll.mockClear();
    rerender(
      <NestorThread
        chat={chatWith([
          { id: 'n', action: 9, kind: 'reply', text: 'nouveau' },
        ])}
        pistes={[]}
      />,
    );
    return scroll;
  };

  it('does not pull the reader down when they scrolled up', () => {
    expect(scrolledTo(0)).not.toHaveBeenCalled();
  });

  it('follows a new message when the reader is at the bottom', () => {
    expect(scrolledTo(1900)).toHaveBeenCalled();
  });
});
