import { act, fireEvent, render, screen } from '@testing-library/react';

import { getChallenges } from '../learn/challenges';
import { ChallengeView } from '../learn/ChallengeView';
import { useLearnProgressStore } from '../learn/useLearnProgressStore';
import { useRewardsStore } from '../rewards/useRewardsStore';

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const grade = (competencies: Record<string, number>) =>
  new Response(
    JSON.stringify({
      choices: [
        {
          message: {
            content: JSON.stringify({
              score: 70,
              verdict: 'ok',
              competencies,
              strengths: [],
              suggestions: ['Précisez le format.'],
            }),
          },
        },
      ],
    }),
    { status: 200 },
  );

describe('<ChallengeView />', () => {
  const challenge = getChallenges('en')[0]; // targets: task, format

  beforeEach(() => {
    useLearnProgressStore.getState().reset();
    useRewardsStore.getState().reset();
  });
  afterEach(() => vi.unstubAllGlobals());

  it('has the same challenges in both languages', () => {
    expect(getChallenges('fr').map((c) => c.id)).toEqual(
      getChallenges('en').map((c) => c.id),
    );
  });

  it('passes only when every target competency is reached', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(grade({ task: 80, format: 30 }))
        .mockResolvedValueOnce(grade({ task: 80, format: 75 })),
    );
    render(<ChallengeView challenge={challenge} onBack={vi.fn()} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Have it graded/ }));
    });
    expect(await screen.findByText(/Almost there/)).toBeInTheDocument();
    expect(useLearnProgressStore.getState().completedChallenges).toEqual([]);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /Have it graded/ }));
    });
    expect(await screen.findByText(/Challenge succeeded/)).toBeInTheDocument();
    expect(useLearnProgressStore.getState().completedChallenges).toEqual([
      challenge.id,
    ]);
    expect(useRewardsStore.getState().points).toBe(20);
  });
});
