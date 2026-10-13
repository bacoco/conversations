import { fireEvent, render, screen, within } from '@testing-library/react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { NestorThread } from '../chat/NestorThread';
import type { NestorMessage } from '../chat/types';
import type { NestorChat } from '../chat/useNestorChat';
import { useCoachPrefsStore } from '../stores/useCoachPrefsStore';
import { useProfileStore } from '../stores/useProfileStore';
import { useTrainerStore } from '../stores/useTrainerStore';

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
    startTask: vi.fn(),
    tipAction: vi.fn(),
    keepText: vi.fn(),
    setSheetOpen: vi.fn(),
    choosePiste: vi.fn(),
    askAbout: vi.fn(),
    usePrompt: vi.fn(),
    tryExample: vi.fn(),
  }) as unknown as NestorChat;

const NOTE = {
  upTo: 2,
  exchanges: 1,
  fromStart: true,
  followUp: '',
  applied: null,
  worked: 'Vous avez donné la note.',
  issue: '',
  tryNow: 'Dites le ton.',
  tryWhy: '',
  prompt: '',
  habit: '',
  competency: null,
};

describe('the coach, as the agent sees it', () => {
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
  beforeEach(() => {
    useCoachPrefsStore.getState().reset();
    useProfileStore.setState({ job: null });
  });

  it('without a job, Nestor asks it first, « Later » possible', () => {
    render(<NestorThread chat={chatWith([])} pistes={[]} />);
    expect(screen.getByText('What is your job?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Gestionnaire RH' }));
    expect(useProfileStore.getState().job?.id).toBe('rh');
  });

  it('« Later »: the usual welcome, never asked again', () => {
    render(<NestorThread chat={chatWith([])} pistes={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Later' }));
    expect(useCoachPrefsStore.getState().jobLater).toBe(true);
    expect(screen.queryByText('What is your job?')).toBeNull();
  });

  it('with a job: « What do you want to do? », three tasks and « + »', () => {
    useProfileStore.setState({ job: { id: 'rh', label: 'Gestionnaire RH' } });
    const chat = chatWith([]);
    render(<NestorThread chat={chat} pistes={[]} />);
    expect(screen.getByText('What do you want to do?')).toBeInTheDocument();
    expect(
      screen.getAllByRole('button', { name: /^(Répondre|Rédiger|Expliquer)/ }),
    ).toHaveLength(3);
    fireEvent.click(screen.getByRole('button', { name: /Other tasks/ }));
    expect(
      screen.getByRole('button', { name: /Préparer un courriel de rappel/ }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Rédiger une fiche de poste' }),
    );
    expect(chat.startTask).toHaveBeenCalledWith('rédiger une fiche de poste');
  });

  it('a task: the start of a request, the reflex, the field and the star', () => {
    const chat = chatWith([
      {
        id: 's',
        action: 9,
        kind: 'starter',
        task: 'rédiger une fiche de poste',
        request: 'Rédige une fiche de poste d’une page.',
        reflex: 'Dites qui va lire.',
      },
    ]);
    render(<NestorThread chat={chat} pistes={[]} />);
    expect(
      screen.getByText('Rédige une fiche de poste d’une page.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Dites qui va lire.')).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Put it in the Assistant’s field' }),
    );
    expect(chat.placeChoice).toHaveBeenCalledWith('s', 0);
  });

  it('under each piece of advice: « Add », « Ignore », « I already do it »', () => {
    const chat = chatWith([
      {
        id: 'c',
        action: 9,
        kind: 'counsel',
        draft: 'x',
        advice: {
          good: [],
          tips: [
            {
              text: 'Dites la longueur.',
              why: '',
              add: 'en 5 lignes',
              part: 'form',
            },
            { text: 'Collez la note.', why: '' },
          ],
        },
        tipStates: { 1: 'ignored' },
      },
    ]);
    render(<NestorThread chat={chat} pistes={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(chat.tipAction).toHaveBeenCalledWith('c', 0, 'added');
    fireEvent.click(screen.getByRole('button', { name: 'I already do it' }));
    expect(chat.tipAction).toHaveBeenCalledWith('c', 0, 'known');
    // Nothing to add when only the user knows it; done tips say what they became.
    expect(screen.getAllByRole('button', { name: 'Add' })).toHaveLength(1);
    expect(screen.getByText('Ignored')).toBeInTheDocument();
  });

  it('« I have corrected it »: each piece of advice, done or not', () => {
    render(
      <NestorThread
        chat={chatWith([
          {
            id: 'f',
            action: 9,
            kind: 'fixcheck',
            tips: ['Dites la longueur.', 'Dites le ton.'],
            done: [true, false],
            message: 'Il manque le ton.',
          },
        ])}
        pistes={[]}
      />,
    );
    expect(screen.getByText('Il manque le ton.')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')[0]).toHaveAttribute(
      'data-done',
      'true',
    );
  });

  it('personal data: what was found, and that nothing left', () => {
    render(
      <NestorThread
        chat={chatWith([
          {
            id: 'p',
            action: 9,
            kind: 'sensitive',
            kinds: ['nir'],
            pending: { bar: 'improve' },
          },
        ])}
        pistes={[]}
      />,
    );
    expect(screen.getByText(/a social security number/)).toBeInTheDocument();
    expect(screen.getByText(/Nothing has been sent/)).toBeInTheDocument();
  });

  it('a version that changes a figure says which, and « Keep my text »', () => {
    const chat = chatWith([
      {
        id: 'v',
        action: 9,
        kind: 'versions',
        draft: 'facture de 4 860 euros',
        items: [
          {
            title: 'Courte',
            text: 'Réponds : facture de 4 680 euros.',
            changed: { added: ['4680'], removed: ['4860'] },
          },
        ],
      },
    ]);
    render(<NestorThread chat={chat} pistes={[]} />);
    expect(
      screen.getByText(/This version changes a figure of your text/),
    ).toBeInTheDocument();
    expect(screen.getByText(/4680/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Keep my text' }));
    expect(chat.keepText).toHaveBeenCalled();
  });

  it('after an answer, one remark: a figure not in the note comes first', () => {
    render(
      <NestorThread
        chat={chatWith([
          {
            id: 'a',
            action: 9,
            kind: 'advice',
            note: NOTE,
            missing: [],
            unfound: ['72'],
            answerId: 'm1',
          },
        ])}
        pistes={[]}
      />,
    );
    expect(screen.getByText(/Not in what you gave: 72/)).toBeInTheDocument();
    // The rest waits behind « See the full advice ».
    expect(
      within(screen.getByRole('group')).getByText(/Vous avez donné la note/),
    ).toBeInTheDocument();
  });

  it('the review: what was said, a request to keep, a case to practise', () => {
    useProfileStore.setState({ job: { id: 'rh', label: 'Gestionnaire RH' } });
    render(
      <NestorThread
        chat={chatWith([
          {
            id: 'r',
            action: 9,
            kind: 'review',
            review: {
              summary: 'Bien.',
              strengths: [],
              tips: ['Dites le ton.'],
              habits: [],
              grades: [],
            },
            advised: 0,
            applied: 0,
            answerId: 'm1',
            progress: [{ part: 'form', said: 2, total: 3 }],
            favorite: 'Réponds en 5 lignes à l’agent.',
            caseId: 'rh-1',
          },
        ])}
        pistes={[]}
      />,
    );
    expect(
      screen.getByText(/The form: in 2 requests out of 3/),
    ).toBeInTheDocument();
    expect(
      screen.getByText('Réponds en 5 lignes à l’agent.'),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Practise on a case/ }));
    expect(useTrainerStore.getState().caseId).toBe('rh-1');
    useTrainerStore.getState().stop();
  });

  it('examples come with « Say it »', () => {
    const chat = chatWith([
      {
        id: 'e',
        action: 9,
        kind: 'examples',
        pairs: [
          {
            caseId: 'rh-1',
            title: 'T',
            before: 'avant',
            after: 'après',
            rule: 'règle',
          },
        ],
      },
    ]);
    render(<NestorThread chat={chat} pistes={[]} />);
    fireEvent.click(screen.getByRole('button', { name: /Say it/ }));
    expect(chat.setSheetOpen).toHaveBeenCalledWith(true);
  });
});
