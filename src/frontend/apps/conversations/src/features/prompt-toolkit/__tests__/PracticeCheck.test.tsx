import { fireEvent, render, screen } from '@testing-library/react';

import type { PromptAnalysis } from '../coach/coachApi';
import { RetainTip } from '../components/CoachParts';
import { PracticeCheck } from '../components/PracticeCheck';
import { useLearnProgressStore } from '../learn/useLearnProgressStore';
import { useCoachTipsStore } from '../stores/useCoachTipsStore';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const analysis = (grades: Partial<PromptAnalysis['competencies']>) =>
  ({
    score: 70,
    competencies: {
      task: 0,
      context: 0,
      audience: 0,
      format: 0,
      constraints: 0,
      sources: 0,
      examples: 0,
      verification: 0,
      ...grades,
    },
  }) as PromptAnalysis;

describe('the bridge between the coach and the course', () => {
  beforeEach(() => {
    useLearnProgressStore.getState().reset();
    useCoachTipsStore.setState({ shown: {} });
  });

  it('says when a real request applies the step tried', () => {
    useLearnProgressStore.getState().setPendingPractice({
      lessonId: 'lesson-3',
      skills: ['context', 'format'],
      since: Date.now(),
    });
    render(<PracticeCheck result={analysis({ context: 80, format: 70 })} />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'You applied the step “{{title}}”.',
    );
    expect(useLearnProgressStore.getState().pendingPractice).toBeNull();
  });

  it('names what is still missing, and keeps the step to try', () => {
    useLearnProgressStore.getState().setPendingPractice({
      lessonId: 'lesson-3',
      skills: ['context', 'format'],
      since: Date.now(),
    });
    render(<PracticeCheck result={analysis({ context: 80 })} />);
    expect(screen.getByRole('status')).toHaveTextContent(
      'Still missing: {{skills}}.',
    );
    expect(useLearnProgressStore.getState().pendingPractice).not.toBeNull();
  });

  it('says nothing without a step to try', () => {
    const { container } = render(
      <PracticeCheck result={analysis({ context: 80 })} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it('opens the lesson screen behind a tip of the coach', () => {
    render(
      <RetainTip
        tipKey="rule-format"
        lesson={{ lessonId: 'lesson-3', slide: 4 }}
      >
        Say the expected form.
      </RetainTip>,
    );
    fireEvent.click(
      screen.getByRole('button', { name: 'See the lesson · 1 min' }),
    );
    expect(usePromptToolkitStore.getState().lessonRequest).toEqual({
      lessonId: 'lesson-3',
      slide: 4,
    });
    expect(usePromptToolkitStore.getState().mode).toBe('learn');
  });
});
