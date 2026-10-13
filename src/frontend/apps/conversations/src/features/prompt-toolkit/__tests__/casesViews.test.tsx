import { fireEvent, render, screen } from '@testing-library/react';

import { casesOf } from '../jobs/jobs';
import { CaseView } from '../learn/cases/CaseView';
import { CasesView } from '../learn/cases/CasesView';
import { JourneyView } from '../learn/cases/JourneyView';
import { WeeklyCase } from '../learn/cases/WeeklyCase';
import { useCasesStore } from '../learn/cases/casesProgress';
import { useProfileStore } from '../stores/useProfileStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';
import { useTrainerStore } from '../stores/useTrainerStore';

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const [one, two] = casesOf('rh');

describe('practical cases of my job', () => {
  const setChatInput = vi.fn();
  beforeEach(() => {
    useCasesStore.setState({ done: {} });
    useProfileStore.setState({ job: { id: 'rh', label: 'Gestionnaire RH' } });
    usePromptToolkitStore.setState({ chatInput: '', setChatInput });
    setChatInput.mockClear();
  });

  it('without a job, asks for it first', () => {
    useProfileStore.setState({ job: null });
    render(<CasesView onBack={vi.fn()} onOpen={vi.fn()} />);
    expect(
      screen.getByRole('combobox', { name: 'My field' }),
    ).toBeInTheDocument();
  });

  it('shows the three cases of the job; level 2 opens after level 1', () => {
    const onOpen = vi.fn();
    const { rerender } = render(<CasesView onBack={vi.fn()} onOpen={onOpen} />);
    expect(screen.getByText(one.title)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: new RegExp(two.title) }),
    ).toBeDisabled();
    fireEvent.click(
      screen.getByRole('button', { name: new RegExp(one.title) }),
    );
    expect(onOpen).toHaveBeenCalledWith(one.id);
    useCasesStore.getState().markDone(one.id);
    rerender(<CasesView onBack={vi.fn()} onOpen={onOpen} />);
    expect(
      screen.getByRole('button', { name: new RegExp(two.title) }),
    ).toBeEnabled();
  });

  it('a case: the starting request goes into the field, with the text to work from', () => {
    render(<CaseView caseId={one.id} onBack={vi.fn()} onDone={vi.fn()} />);
    expect(screen.getByText(one.situation)).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', {
        name: 'Put the starting request in the Assistant’s field',
      }),
    );
    const placed = setChatInput.mock.calls[0][0] as string;
    expect(placed.startsWith(one.startingRequest)).toBe(true);
    expect(placed).toContain(one.material.slice(0, 40));
  });

  it('a case: check the answer, compare with a good request, then done', () => {
    const onDone = vi.fn();
    render(<CaseView caseId={one.id} onBack={vi.fn()} onDone={onDone} />);
    one.checkAnswer.forEach((point) =>
      expect(screen.getByRole('checkbox', { name: point })).toBeInTheDocument(),
    );
    const good = () => screen.getByText(`« ${one.goodRequest} »`);
    expect(good()).not.toBeVisible();
    fireEvent.click(screen.getByText('See a good request'));
    expect(good()).toBeVisible();
    expect(screen.getByText(one.lesson)).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'I have finished this case' }),
    );
    expect(useCasesStore.getState().done[one.id]).toBeTruthy();
    expect(onDone).toHaveBeenCalled();
  });

  it('my journey: the level reached, the weekly slot and the certificate', () => {
    useCasesStore.getState().markDone(one.id);
    const createObjectURL = vi.fn(() => 'blob:ics');
    Object.assign(URL, { createObjectURL, revokeObjectURL: vi.fn() });
    render(<JourneyView onBack={vi.fn()} onOpen={vi.fn()} />);
    expect(
      screen.getByText('Level reached: {{level}} of 3'),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Book 20 minutes a week' }),
    );
    expect(createObjectURL).toHaveBeenCalled();
    expect(
      screen.getByRole('button', { name: 'Print my certificate' }),
    ).toBeEnabled();
  });

  it('the case of the week, on the home page: one click opens the trainer', () => {
    const openSection = vi.fn();
    usePromptToolkitStore.setState({ openSection });
    render(<WeeklyCase />);
    expect(screen.getByText('The case of the week')).toBeInTheDocument();
    expect(screen.getByText(one.title)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Start this case' }));
    expect(useTrainerStore.getState()).toMatchObject({
      caseId: one.id,
      step: 'read',
    });
    expect(openSection).toHaveBeenCalledWith('coach');
    useTrainerStore.getState().stop();
  });

  it('the case of the week asks for the job first', () => {
    useProfileStore.setState({ job: null });
    render(<WeeklyCase />);
    expect(
      screen.getByText('Choose your job below: each week, a case of your job.'),
    ).toBeInTheDocument();
  });

  it('the case of the week can be hidden, and comes back from the settings', () => {
    useCasesStore.setState({ weeklyHidden: false });
    const { container } = render(<WeeklyCase />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Hide the case of the week' }),
    );
    expect(useCasesStore.getState().weeklyHidden).toBe(true);
    expect(container).toBeEmptyDOMElement();
    useCasesStore.getState().setWeeklyHidden(false);
    expect(useCasesStore.getState().weeklyHidden).toBe(false);
  });
});
