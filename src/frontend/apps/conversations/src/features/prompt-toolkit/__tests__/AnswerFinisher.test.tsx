import { fireEvent, render, screen } from '@testing-library/react';

import { AnswerFinisher } from '../components/AnswerFinisher';

const mockRemove = vi.fn();
vi.mock('../coach/coachApi', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../coach/coachApi')>()),
  removeUnsupportedFacts: (...args: unknown[]) =>
    mockRemove(...args) as Promise<string>,
}));
vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const REQUEST = 'Réponds à ce courriel.\n"""\nOù en est ma carte grise ?\n"""';
const ANSWER =
  'Bonjour,\nVotre dossier est bloqué par un afflux de demandes.\nCordialement,\n[Votre nom]';
const CORRECTED =
  'Bonjour,\nVotre dossier : À COMPLÉTER (état du dossier).\nCordialement,\n[Votre nom]';

describe('<AnswerFinisher />, making an answer ready', () => {
  beforeEach(() => mockRemove.mockReset());

  it('takes out the facts, then asks for each part, then lets copy', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    mockRemove.mockResolvedValue(CORRECTED);
    render(
      <AnswerFinisher
        request={REQUEST}
        answer={ANSWER}
        claims={['« afflux de demandes »']}
        language="French"
      />,
    );
    // Nothing to copy before the facts are dealt with.
    expect(
      screen.queryByRole('button', { name: 'Copy the answer' }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Take them out' }));
    expect(
      await screen.findByText(
        'What changed: struck out, taken away; in green, added.',
      ),
    ).toBeInTheDocument();
    const copy = screen.getByRole('button', { name: 'Copy the answer' });
    expect(copy).toBeDisabled();

    fireEvent.change(screen.getByLabelText('état du dossier'), {
      target: { value: 'en cours d’instruction' },
    });
    fireEvent.change(screen.getByLabelText('Votre nom'), {
      target: { value: 'Martine Leroy' },
    });
    expect(screen.getByText('Your answer is ready')).toBeInTheDocument();
    fireEvent.click(copy);
    expect(writeText).toHaveBeenCalledWith(
      'Bonjour,\nVotre dossier : en cours d’instruction.\nCordialement,\nMartine Leroy',
    );
  });

  it('takes away the sentence of a fact the user does not have', async () => {
    mockRemove.mockResolvedValue(CORRECTED);
    render(
      <AnswerFinisher
        request={REQUEST}
        answer={ANSWER}
        claims={['« afflux de demandes »']}
        language="French"
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Take them out' }));
    await screen.findByText(
      'What changed: struck out, taken away; in green, added.',
    );
    fireEvent.click(
      screen.getAllByRole('button', { name: 'I do not have it' })[0],
    );
    expect(
      screen.getByText('This sentence is taken away.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('{{count}} parts still to complete'),
    ).toBeInTheDocument();
  });

  it('keeps facts the user checked', () => {
    render(
      <AnswerFinisher
        request={REQUEST}
        answer={ANSWER}
        claims={['« afflux de demandes »']}
        language="French"
      />,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'They are right, I checked' }),
    );
    expect(mockRemove).not.toHaveBeenCalled();
    expect(screen.getByLabelText('Votre nom')).toBeInTheDocument();
  });
});
