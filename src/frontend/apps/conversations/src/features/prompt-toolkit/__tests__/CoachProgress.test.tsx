import { fireEvent, render, screen } from '@testing-library/react';

import type { PromptAnalysis } from '../coach/coachApi';
import { RetainTip } from '../components/CoachParts';
import {
  AskFirst,
  CoachSettings,
  FeltCheck,
  ProgressNote,
  WeekRecapView,
  WeeklyFocusBox,
} from '../components/CoachProgress';
import { useLearnProgressStore } from '../learn/useLearnProgressStore';
import { useCoachHistoryStore } from '../stores/useCoachHistoryStore';
import { coachRules, useCoachPrefsStore } from '../stores/useCoachPrefsStore';
import { useCoachTipsStore } from '../stores/useCoachTipsStore';
import { useProfileStore } from '../stores/useProfileStore';

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const grades = (overrides: Partial<PromptAnalysis['competencies']> = {}) => ({
  task: 80,
  context: 80,
  audience: 80,
  format: 80,
  sources: 80,
  constraints: 80,
  examples: 0,
  verification: 0,
  ...overrides,
});

const noAudience = (sentAt: number) => ({
  excerpt: 'Résume le rapport.',
  score: 50,
  competencies: grades({ audience: 10 }),
  sentAt,
});

describe('the coach over time', () => {
  beforeEach(() => {
    useCoachHistoryStore.setState({ entries: [] });
    useCoachPrefsStore.getState().reset();
    useCoachTipsStore.setState({ shown: {} });
    useLearnProgressStore.getState().reset();
    useProfileStore.setState({ isBeginner: false });
  });

  it('shows one point to work on this week, with why and the lesson', () => {
    const now = Date.now();
    useCoachHistoryStore.setState({
      entries: [noAudience(now), noAudience(now - 1), noAudience(now - 2)],
    });
    render(<WeeklyFocusBox />);
    expect(screen.getByText('Say who it is for')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Why?' }));
    expect(
      screen.getByText(/The same content is not written the same way/),
    ).toBeInTheDocument();
  });

  it('shows nothing to work on before a few requests', () => {
    const { container } = render(<WeeklyFocusBox />);
    expect(container).toBeEmptyDOMElement();
  });

  it('celebrates the point of the week when a request has it', () => {
    const now = Date.now();
    useCoachHistoryStore.setState({
      entries: [noAudience(now), noAudience(now - 1), noAudience(now - 2)],
    });
    render(
      <ProgressNote result={{ competencies: grades() } as PromptAnalysis} />,
    );
    expect(screen.getByRole('status')).toHaveTextContent(
      'Your point of the week is there: {{skill}}. Well done!',
    );
  });

  it('folds the week recap, and prepares a text for a trainer', () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, { clipboard: { writeText } });
    const now = Date.now();
    useCoachHistoryStore.setState({
      entries: [noAudience(now), noAudience(now - 1), noAudience(now - 2)],
    });
    render(<WeekRecapView />);
    fireEvent.click(screen.getByRole('button', { name: 'My week' }));
    expect(
      screen.getByText('{{count}} requests read by the coach'),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: 'Prepare a talk with my trainer' }),
    );
    expect(writeText).toHaveBeenCalledWith(
      expect.stringContaining('My week with the coach'),
    );
  });

  it('stops giving a tip the user says is not needed for such requests', () => {
    const onDismiss = vi.fn();
    render(
      <RetainTip tipKey="rule-audience" why="Because." onDismiss={onDismiss}>
        Say who it is for.
      </RetainTip>,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Not needed here' }));
    expect(onDismiss).toHaveBeenCalled();
    expect(
      screen.getByText(
        'Noted: I will not say it again for this kind of request.',
      ),
    ).toBeInTheDocument();
    useCoachPrefsStore.getState().dismissTip('mail', 'audience');
    useCoachPrefsStore.getState().dismissTip('mail', 'audience');
    expect(useCoachPrefsStore.getState().dismissedTips).toEqual({
      mail: ['audience'],
    });
  });

  it('asks the user first, then says whether they saw it', () => {
    const onDone = vi.fn();
    render(
      <AskFirst
        result={{ competencies: grades({ audience: 10 }) } as PromptAnalysis}
        onDone={onDone}
      />,
    );
    fireEvent.click(screen.getByRole('button', { name: 'Who it is for' }));
    expect(screen.getByText('Well seen, I think so too.')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'See my reading' }));
    expect(onDone).toHaveBeenCalled();
  });

  it('adapts to "too complicated", and asks at most once a day', () => {
    const { unmount } = render(<FeltCheck />);
    fireEvent.click(screen.getByRole('button', { name: 'Too complicated' }));
    expect(useProfileStore.getState().isBeginner).toBe(true);
    expect(useCoachPrefsStore.getState().length).toBe('short');
    unmount();
    const { container } = render(<FeltCheck />);
    expect(container).toBeEmptyDOMElement();
  });

  it('tells the model the coach style and the usual readers', () => {
    render(<CoachSettings />);
    fireEvent.click(screen.getByRole('button', { name: 'My coach' }));
    fireEvent.change(screen.getByLabelText('How the coach speaks'), {
      target: { value: 'direct' },
    });
    fireEvent.change(screen.getByLabelText('I mostly write to'), {
      target: { value: 'public' },
    });
    expect(coachRules()).toContain('direct coach');
    expect(coachRules()).toContain('members of the public');
  });
});
