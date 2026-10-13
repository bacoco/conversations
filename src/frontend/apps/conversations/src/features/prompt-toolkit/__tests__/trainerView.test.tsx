import { fireEvent, render, screen, within } from '@testing-library/react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { TrainerView } from '../chat/TrainerView';
import type { Trainer } from '../chat/useTrainer';
import { caseById } from '../jobs/jobs';

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const CASE = caseById('rh-1')!;

const trainerAt = (over: Partial<Trainer>): Trainer =>
  ({
    caseId: 'rh-1',
    item: CASE,
    step: 'read',
    from: 'learn',
    paused: false,
    advice: null,
    tipStates: {},
    mine: '',
    points: [],
    placed: null,
    unfound: [],
    checks: {},
    busy: false,
    notice: null,
    nextCaseId: 'rh-2',
    readDone: vi.fn(),
    useBeginnerRequest: vi.fn(),
    saidRequest: vi.fn(),
    myRequestDone: vi.fn(),
    tipAction: vi.fn(),
    corrected: vi.fn(),
    useGood: vi.fn(),
    useMine: vi.fn(),
    check: vi.fn(),
    verified: vi.fn(),
    nextCase: vi.fn(),
    leave: vi.fn(),
    ...over,
  }) as unknown as Trainer;

describe('<TrainerView />', () => {
  beforeAll(async () => {
    await i18n.use(initReactI18next).init({
      lng: 'en',
      resources: { en: { translation: {} } },
      nsSeparator: false,
      keySeparator: false,
      interpolation: { escapeValue: false },
    });
  });

  it('the band shows the five steps and where the user is', () => {
    render(
      <TrainerView trainer={trainerAt({ step: 'advice' })} onSay={vi.fn()} />,
    );
    const band = screen.getByRole('list', { name: 'Steps of the case' });
    expect(band).toHaveTextContent('Read');
    expect(screen.getByText(/Advice/)).toHaveAttribute('aria-current', 'step');
  });

  it('« Read »: the situation and the texts, then « I have read it »', () => {
    const trainer = trainerAt({ step: 'read' });
    render(<TrainerView trainer={trainer} onSay={vi.fn()} />);
    expect(screen.getByText(CASE.situation)).toBeInTheDocument();
    expect(screen.getByText(/bureau des achats/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /I have read it/ }));
    expect(trainer.readDone).toHaveBeenCalled();
  });

  it('« Ask »: write it in the field, or start from a beginner’s request', () => {
    const trainer = trainerAt({ step: 'ask', notice: 'write-first' });
    render(<TrainerView trainer={trainer} onSay={vi.fn()} />);
    expect(
      screen.getByText(/Write your request at the top of the field/),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: /Start from a beginner’s request/ }),
    );
    expect(trainer.useBeginnerRequest).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'This is my request' }));
    expect(trainer.myRequestDone).toHaveBeenCalled();
  });

  it('« Advice »: add, ignore, then « I have corrected it »', () => {
    const trainer = trainerAt({
      step: 'advice',
      advice: {
        good: ['Vous avez donné le courriel.'],
        tips: [
          {
            text: 'Citez ses deux questions.',
            why: 'Aucune oubliée.',
            add: 'x',
          },
        ],
      },
    });
    render(<TrainerView trainer={trainer} onSay={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Add' }));
    expect(trainer.tipAction).toHaveBeenCalledWith(0, 'added');
    fireEvent.click(
      screen.getByRole('button', { name: 'I have corrected it' }),
    );
    expect(trainer.corrected).toHaveBeenCalled();
  });

  it('« Compare »: mine beside a good one, the points done or not', () => {
    const trainer = trainerAt({
      step: 'compare',
      mine: 'Réponds à l’agent.',
      points: [true, false, false],
    });
    render(<TrainerView trainer={trainer} onSay={vi.fn()} />);
    expect(screen.getByText('Réponds à l’agent.')).toBeInTheDocument();
    expect(screen.getByText(CASE.goodRequest)).toBeInTheDocument();
    const points = within(
      screen.getByRole('list', { name: 'What makes the difference' }),
    ).getAllByRole('listitem');
    expect(points.map((item) => item.getAttribute('data-done'))).toEqual([
      'true',
      'false',
      'false',
    ]);
    fireEvent.click(
      screen.getByRole('button', { name: 'Put the good request in the field' }),
    );
    expect(trainer.useGood).toHaveBeenCalled();
  });

  it('once in the field: send it with the arrow', () => {
    render(
      <TrainerView
        trainer={trainerAt({ step: 'compare', placed: 'good', points: [] })}
        onSay={vi.fn()}
      />,
    );
    expect(screen.getByText(/send it with the arrow/)).toBeInTheDocument();
  });

  it('« Check »: what to check, yes or no, and what Nestor found', () => {
    const trainer = trainerAt({ step: 'verify', unfound: ['72'] });
    render(<TrainerView trainer={trainer} onSay={vi.fn()} />);
    expect(screen.getByText(CASE.checkAnswer[0])).toBeInTheDocument();
    fireEvent.click(screen.getAllByRole('button', { name: 'Yes' })[0]);
    expect(trainer.check).toHaveBeenCalledWith(0, true);
    expect(screen.getByText(/72/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'I have checked' }));
    expect(trainer.verified).toHaveBeenCalled();
  });

  it('« Done » with nothing found alone: no « 0 out of 3 », what was learned', () => {
    render(
      <TrainerView
        trainer={trainerAt({ step: 'done', points: [false, false, false] })}
        onSay={vi.fn()}
      />,
    );
    expect(screen.queryByText(/0 points/)).toBeNull();
    expect(
      screen.getByText(/The good request showed you the 3 points/),
    ).toBeInTheDocument();
  });

  it('« Done »: the reflex, another case, or back', () => {
    const trainer = trainerAt({ step: 'done', points: [true, true, false] });
    render(<TrainerView trainer={trainer} onSay={vi.fn()} />);
    expect(screen.getByText(CASE.lesson)).toBeInTheDocument();
    expect(screen.getByText(/2 of the 3 points/)).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Another case of my job' }),
    );
    expect(trainer.nextCase).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: 'Back to the course' }));
    expect(trainer.leave).toHaveBeenCalled();
  });
});
