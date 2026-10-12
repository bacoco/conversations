import { parseCoachNote } from '../coach/coachApi';

const covered = { upTo: 4, exchanges: 2, fromStart: false };

describe('the coach thread', () => {
  it('reads a note, with the check of the previous advice', () => {
    expect(
      parseCoachNote(
        {
          follow_up: 'Vous avez ajouté le public.',
          applied: true,
          worked: 'Bien.',
          issue: 'Trop long.',
          try: 'Demandez 5 lignes.',
          try_why: 'Une longueur chiffrée se respecte.',
          prompt: 'Résume en 5 lignes.',
          habit: 'Donnez la longueur.',
          competency: 'format',
        },
        covered,
      ),
    ).toEqual({
      ...covered,
      followUp: 'Vous avez ajouté le public.',
      applied: true,
      worked: 'Bien.',
      issue: 'Trop long.',
      tryNow: 'Demandez 5 lignes.',
      tryWhy: 'Une longueur chiffrée se respecte.',
      prompt: 'Résume en 5 lignes.',
      habit: 'Donnez la longueur.',
      competency: 'format',
    });
  });

  it('has nothing to check on the first note, and drops an unknown skill', () => {
    const note = parseCoachNote(
      {
        follow_up: 'Invented.',
        applied: false,
        worked: 'Bien.',
        competency: 'charisma',
      },
      { ...covered, fromStart: true },
    );
    expect(note.followUp).toBe('');
    expect(note.applied).toBeNull();
    expect(note.competency).toBeNull();
  });

  it('refuses an empty note', () => {
    expect(() => parseCoachNote({ habit: 'Seul.' }, covered)).toThrow();
  });
});
