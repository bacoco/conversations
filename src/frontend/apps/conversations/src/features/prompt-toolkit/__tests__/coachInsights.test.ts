import type { PromptAnalysis } from '../coach/coachApi';
import {
  comebackSkill,
  requestsPerConversation,
  startOfWeek,
  weekRecap,
  weeklyFocus,
} from '../coach/coachInsights';
import type { CoachHistoryEntry } from '../stores/useCoachHistoryStore';

const grades = (
  overrides: Partial<CoachHistoryEntry['competencies']> = {},
) => ({
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

const entry = (
  sentAt: number,
  overrides: Partial<CoachHistoryEntry> = {},
): CoachHistoryEntry => ({
  excerpt: 'Résume…',
  score: 60,
  competencies: grades(),
  sentAt,
  ...overrides,
});

describe('what the coach tells from the requests it read', () => {
  it('picks one habit to work on, from a trend, never from one request', () => {
    const noAudience = grades({ audience: 10 });
    expect(weeklyFocus([entry(3, { competencies: noAudience })])).toBeNull();
    const entries = [
      entry(5, { competencies: noAudience }),
      entry(4, { competencies: noAudience }),
      entry(3, { competencies: grades({ audience: 10, format: 20 }) }),
      entry(2),
    ];
    expect(weeklyFocus(entries)).toBe('audience');
    // Every habit mostly there: nothing to work on.
    expect(weeklyFocus([entry(3), entry(2), entry(1)])).toBeNull();
  });

  it('notices a habit that came back since last time', () => {
    const previous = entry(1, { competencies: grades({ format: 20 }) });
    const current = { competencies: grades() } as PromptAnalysis;
    expect(comebackSkill(previous, current)).toBe('format');
    expect(comebackSkill(undefined, current)).toBeNull();
  });

  it('counts the requests needed per conversation', () => {
    const entries = [
      entry(1, { turn: 1 }),
      entry(2, { turn: 2 }),
      entry(3, { turn: 3 }),
      entry(4, { turn: 1 }),
      entry(5, { turn: 1 }),
      entry(6),
    ];
    // Conversations of 3, 1 and 1 requests; the unranked one is left out.
    expect(requestsPerConversation(entries)).toBe(1.7);
  });

  it('sums up the week against the week before', () => {
    const now = new Date(2026, 9, 9, 12).getTime();
    const monday = startOfWeek(now);
    const day = 24 * 60 * 60 * 1000;
    const entries = [
      entry(monday + 3 * day, { score: 90, excerpt: 'La meilleure', turn: 1 }),
      entry(monday + 2 * day, { score: 70, turn: 1 }),
      entry(monday + day, { score: 60, turn: 1 }),
      entry(monday - day, {
        competencies: grades({ audience: 10 }),
        turn: 1,
      }),
      entry(monday - day + 1, {
        competencies: grades({ audience: 10 }),
        turn: 2,
      }),
    ];
    const recap = weekRecap(entries, now);
    expect(recap.count).toBe(3);
    expect(recap.best?.excerpt).toBe('La meilleure');
    expect(recap.allBricks).toBe(true);
    expect(recap.growing).toBe('audience');
    expect(recap.perConversation).toBe(1);
    expect(recap.perConversationBefore).toBe(2);
  });
});
