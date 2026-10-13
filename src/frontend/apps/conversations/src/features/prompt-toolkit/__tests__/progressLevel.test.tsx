import { fireEvent, render, screen, within } from '@testing-library/react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { MessageView } from '../chat/NestorMessages';
import type { NestorMessage } from '../chat/types';
import type { NestorChat } from '../chat/useNestorChat';
import { casesOf } from '../jobs/jobs';
import { JourneyView } from '../learn/cases/JourneyView';
import { attestationText } from '../learn/cases/attestation';
import { useCasesStore } from '../learn/cases/casesProgress';
import {
  FULL_QUIZ,
  useLearnProgressStore,
} from '../learn/useLearnProgressStore';
import { UsageFacts, computeProgress } from '../rewards/progress';
import { useRewardsStore } from '../rewards/useRewardsStore';
import { useProfileStore } from '../stores/useProfileStore';

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const NONE: UsageFacts = {
  counts: {},
  rewardPoints: 0,
  casesDone: 0,
  lessonsDone: 0,
  lessonsTotal: 8,
  lessonQuizzesPassed: 0,
  fullQuizBest: null,
  challengesDone: 0,
};

const KEPT_NOTHING = { level: 'beginner', badges: [] } as const;

describe('level and badges', () => {
  it('starts as a beginner, with the points to the next level', () => {
    const progress = computeProgress(NONE, KEPT_NOTHING);
    expect(progress).toMatchObject({
      points: 0,
      level: { id: 'beginner' },
      next: { id: 'operational', from: 100 },
      earned: [],
    });
    expect(progress.missing).toHaveLength(8);
  });

  it('counts the cases done with the points recorded', () => {
    const progress = computeProgress(
      { ...NONE, rewardPoints: 60, casesDone: 2 },
      KEPT_NOTHING,
    );
    expect(progress.points).toBe(100);
    expect(progress.level.id).toBe('operational');
    expect(progress.next?.id).toBe('expert');
  });

  it('a level reached never goes down', () => {
    const progress = computeProgress(NONE, { level: 'expert', badges: [] });
    expect(progress.level.id).toBe('expert');
    expect(progress.next).toBeNull();
  });

  it('badges come from what was really done, and stay once earned', () => {
    const progress = computeProgress(
      {
        ...NONE,
        counts: { analysis: 1, improvement: 3, fill: 5, review: 1 },
        casesDone: 1,
        lessonsDone: 8,
        fullQuizBest: 85,
        challengesDone: 3,
      },
      KEPT_NOTHING,
    );
    expect(progress.earned).toEqual([
      'first-step',
      'first-case',
      'rewriter',
      'librarian',
      'diligent',
      'quiz-master',
      'reflective',
      'challenger',
    ]);
    expect(progress.missing).toEqual([]);

    const kept = computeProgress(NONE, {
      level: 'beginner',
      badges: ['challenger'],
    });
    expect(kept.earned).toEqual(['challenger']);
  });

  it('the lessons badge needs every lesson of the course', () => {
    expect(
      computeProgress({ ...NONE, lessonsDone: 7 }, KEPT_NOTHING).earned,
    ).toEqual([]);
  });
});

describe('rewards store: what is kept', () => {
  beforeEach(() => useRewardsStore.getState().reset());

  it('a session review counts once, however often it is shown', () => {
    const { noteReview } = useRewardsStore.getState();
    noteReview('r1');
    noteReview('r1');
    noteReview('r2');
    expect(useRewardsStore.getState().counts.review).toBe(2);
    expect(useRewardsStore.getState().points).toBe(30);
  });

  it('keeps the level and the badges reached, never lower', () => {
    const { keep } = useRewardsStore.getState();
    keep('operational', ['first-step']);
    keep('beginner', []);
    expect(useRewardsStore.getState()).toMatchObject({
      levelReached: 'operational',
      badges: ['first-step'],
    });
  });
});

describe('the certificate', () => {
  beforeAll(async () => {
    await i18n.use(initReactI18next).init({
      lng: 'en',
      resources: { en: { translation: {} } },
      nsSeparator: false,
      keySeparator: false,
      interpolation: { escapeValue: false },
    });
  });

  it('states the real use, the level, and what it is', () => {
    const facts: UsageFacts = {
      ...NONE,
      counts: { analysis: 12, improvement: 4 },
      rewardPoints: 120,
      casesDone: 2,
      lessonsDone: 5,
      lessonQuizzesPassed: 3,
      fullQuizBest: 85,
    };
    const { title, lines, note } = attestationText({
      t: i18n.t,
      language: 'en',
      job: 'Gestionnaire RH',
      casesLevel: 2,
      facts,
      progress: computeProgress(facts, KEPT_NOTHING),
      date: new Date(2026, 9, 13),
    });
    expect(title).toBe('Certificate of use of Nestor — the Assistant');
    expect(lines).toEqual([
      'Job: Gestionnaire RH',
      'Level reached: Operational (160 points), out of three levels: Beginner, Operational, Expert',
      'Practical cases done: 2',
      'Level reached in the practical cases: 2 of 3',
      'Lessons of the course finished: 5 of 8',
      'Lesson quizzes passed (80% or more): 3',
      'Full quiz: best score 85%',
      'Requests analysed by Nestor: 12',
      'Requests improved by Nestor: 4',
      'Badges earned: First step, First practical case, Rewriter, and Quiz master',
      'Date: October 13, 2026',
    ]);
    expect(note).toBe(
      'Made from the use recorded in this browser, on this computer, for this account. It is not checked by anyone else: it describes a use, it does not certify a skill.',
    );
  });

  it('says plainly what is not done yet', () => {
    const { lines } = attestationText({
      t: i18n.t,
      language: 'en',
      job: null,
      casesLevel: 0,
      facts: NONE,
      progress: computeProgress(NONE, KEPT_NOTHING),
      date: new Date(2026, 9, 13),
    });
    expect(lines).toContain('Full quiz: not taken yet');
    expect(lines).toContain('Badges earned: none yet');
    expect(lines.some((line) => line.startsWith('Job:'))).toBe(false);
  });
});

describe('shown to the agent', () => {
  const [one] = casesOf('rh');

  beforeAll(async () => {
    await i18n.use(initReactI18next).init({
      lng: 'en',
      resources: { en: { translation: {} } },
      nsSeparator: false,
      keySeparator: false,
      interpolation: { escapeValue: false },
    });
  });

  beforeEach(() => {
    useRewardsStore.getState().reset();
    useLearnProgressStore.getState().reset();
    useCasesStore.setState({ done: {} });
    useProfileStore.setState({ job: { id: 'rh', label: 'Gestionnaire RH' } });
  });

  it('my journey: the level, the badges and how to earn the others', () => {
    useRewardsStore.setState({ points: 80, counts: { analysis: 1 } });
    useCasesStore.getState().markDone(one.id);
    render(<JourneyView onBack={vi.fn()} onOpen={vi.fn()} />);

    const level = screen.getByRole('region', { name: 'My level' });
    expect(within(level).getByText('Operational')).toBeInTheDocument();
    expect(
      within(level).getByText('100 points · 200 more to reach Expert'),
    ).toBeInTheDocument();
    expect(within(level).getByText('My badges: 2 of 8')).toBeInTheDocument();
    expect(within(level).getByText('First step')).toBeInTheDocument();
    expect(
      within(level).getByText('Ask Nestor to improve 3 requests.'),
    ).toBeInTheDocument();
    expect(
      within(level).getByText('Finish the 8 lessons of the course.'),
    ).toBeInTheDocument();
    // No ranking, no one else.
    expect(screen.queryByText(/rank|other agents/i)).toBeNull();
    // What was reached is kept.
    expect(useRewardsStore.getState()).toMatchObject({
      levelReached: 'operational',
      badges: ['first-step', 'first-case'],
    });
  });

  it('my journey: the certificate prints the real use', () => {
    useRewardsStore.setState({ points: 5, counts: { analysis: 1 } });
    useLearnProgressStore.setState({
      completedLessons: ['lesson-1'],
      bestQuizScores: { 'lesson-1': 90, [FULL_QUIZ]: 70 },
    });
    const sheet = document.implementation.createHTMLDocument('');
    const print = vi.fn();
    const open = vi
      .spyOn(window, 'open')
      .mockReturnValue({ document: sheet, focus: vi.fn(), print } as never);
    render(<JourneyView onBack={vi.fn()} onOpen={vi.fn()} />);
    fireEvent.click(
      screen.getByRole('button', { name: 'Print my certificate' }),
    );
    expect(print).toHaveBeenCalled();
    const text = sheet.body.textContent ?? '';
    expect(text).toContain('Level reached: Beginner (5 points)');
    expect(text).toContain('Lessons of the course finished: 1 of 8');
    expect(text).toContain('Lesson quizzes passed (80% or more): 1');
    expect(text).toContain('Full quiz: best score 70%');
    expect(text).toContain('Requests analysed by Nestor: 1');
    expect(text).toContain('It is not checked by anyone else');
    open.mockRestore();
  });

  it('my journey: nothing to certify before any use', () => {
    render(<JourneyView onBack={vi.fn()} onOpen={vi.fn()} />);
    expect(
      screen.getByRole('button', { name: 'Print my certificate' }),
    ).toBeDisabled();
  });

  it('the session review: one line, the level and the badges; counted once', () => {
    const review: NestorMessage = {
      id: 'review-1',
      action: 1,
      kind: 'review',
      advised: 0,
      applied: 0,
      answerId: 'm',
      review: {
        summary: 'Bien.',
        strengths: [],
        habits: [],
        tips: [],
        grades: [],
      },
    };
    const chat = {} as NestorChat;
    const { rerender } = render(<MessageView message={review} chat={chat} />);
    rerender(<MessageView message={review} chat={chat} />);
    expect(useRewardsStore.getState().counts.review).toBe(1);
    expect(
      screen.getByText('Your level: Beginner · badges: 1 of 8'),
    ).toBeInTheDocument();
  });
});
