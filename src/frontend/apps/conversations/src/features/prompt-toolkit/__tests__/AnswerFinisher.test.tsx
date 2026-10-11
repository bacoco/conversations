import { fireEvent, render, screen } from '@testing-library/react';

import { AnswerFinisher } from '../components/AnswerFinisher';

const mockShowToast = vi.fn();
vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: mockShowToast }),
}));

const ANSWER =
  '**Objet** : Votre carte grise\nBonjour,\nVotre dossier est bloqué par un afflux de demandes. Suivez-le sur À COMPLÉTER (vérifier le site officiel).\nRevenez sur À COMPLÉTER (vérifier le site officiel) demain.\nCordialement,\n[Votre nom]';
const CLAIM = 'La cause du retard : « afflux de demandes »';

describe('<AnswerFinisher />, making an answer ready', () => {
  beforeEach(() => mockShowToast.mockReset());

  it('lists the points to settle, then lets copy exactly the answer', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    render(<AnswerFinisher answer={ANSWER} claims={[CLAIM]} />);

    expect(
      screen.getByText('Nestor found {{count}} things to check or complete'),
    ).toBeInTheDocument();
    const copy = screen.getByRole('button', { name: 'Copy the message' });
    expect(copy).toBeDisabled();

    fireEvent.click(
      screen.getByRole('button', { name: 'Take this sentence away' }),
    );
    // The same thing asked twice is given once.
    expect(screen.getAllByLabelText('vérifier le site officiel')).toHaveLength(
      1,
    );
    fireEvent.change(screen.getByLabelText('vérifier le site officiel'), {
      target: { value: 'ants.gouv.fr' },
    });
    fireEvent.change(screen.getByLabelText('Votre nom'), {
      target: { value: 'Martine Leroy' },
    });
    // The last word is the user's: a read again, before the copy.
    expect(
      screen.getByText(
        'The points found are settled: read the answer once more',
      ),
    ).toBeInTheDocument();
    expect(copy).toBeDisabled();
    fireEvent.click(
      screen.getByLabelText(
        'I read it again: it matches what my service does and can do.',
      ),
    );
    expect(
      screen.getByText('Ready to copy into your email'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Copy the subject' }));
    expect(writeText).toHaveBeenLastCalledWith('Votre carte grise');
    fireEvent.click(copy);
    expect(writeText).toHaveBeenLastCalledWith(
      'Bonjour,\nSuivez-le sur ants.gouv.fr.\nRevenez sur ants.gouv.fr demain.\nCordialement,\nMartine Leroy',
    );
  });

  it('keeps a fact the user checked', () => {
    render(<AnswerFinisher answer={ANSWER} claims={[CLAIM]} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'It is right, I checked' }),
    );
    expect(screen.getByText('Kept: you checked it.')).toBeInTheDocument();
    // In the point, and still in the answer as it will be pasted.
    expect(screen.getAllByText(/afflux de demandes/)).toHaveLength(3);
  });

  it('selects the text when the browser refuses to copy', async () => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error('no')) },
    });
    Object.assign(document, { execCommand: vi.fn().mockReturnValue(false) });
    render(<AnswerFinisher answer="Bonjour, tout est prêt." claims={[]} />);
    fireEvent.click(
      screen.getByLabelText(
        'I read it again: it matches what my service does and can do.',
      ),
    );
    fireEvent.click(screen.getByRole('button', { name: 'Copy the answer' }));
    await vi.waitFor(() =>
      expect(mockShowToast).toHaveBeenCalledWith(
        'info',
        'The text is selected below: press Ctrl+C to copy it.',
        undefined,
        6000,
      ),
    );
  });
});
