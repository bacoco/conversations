import {
  asPlainText,
  numberPrompts,
  extractJson,
  parseAnalysis,
  parseImprovement,
} from '../coach/coachApi';

describe('coachApi parsing', () => {
  it('extracts JSON wrapped in a fence or a sentence', () => {
    expect(extractJson('```json\n{"score": 42}\n```')).toEqual({ score: 42 });
    expect(extractJson('Voici : {"a": 1} merci')).toEqual({ a: 1 });
    expect(() => extractJson('no json here')).toThrow();
  });

  it('clamps scores and fills missing competencies', () => {
    const analysis = parseAnalysis({
      score: 140,
      verdict: '  Précisez le format.  ',
      competencies: { task: 80, context: -5, format: '55' },
      strengths: ['clear', 3, ''],
      suggestions: ['a', 'b', 'c', 'd'],
    });

    expect(analysis.score).toBe(100);
    expect(analysis.verdict).toBe('Précisez le format.');
    expect(analysis.competencies).toEqual({
      task: 80,
      context: 0,
      format: 55,
      audience: 0,
      constraints: 0,
      verification: 0,
      sources: 0,
      examples: 0,
    });
    expect(analysis.strengths).toEqual(['clear']);
    expect(analysis.suggestions).toEqual(['a', 'b', 'c']);
  });

  it('rejects an improvement without a rewritten prompt', () => {
    expect(() => parseImprovement({ changes: ['x'] })).toThrow();
    expect(
      parseImprovement({ improved_prompt: ' Résume. ', changes: ['x'] }),
    ).toEqual({ improvedPrompt: 'Résume.', changes: ['x'] });
  });
});

describe('asPlainText', () => {
  it('turns a structured prompt back into readable text', () => {
    const text = asPlainText({
      contexte: 'Réunion lundi.',
      tâches: [
        { numéro: 1, description: 'Rédiger le message.' },
        { numéro: 2, description: 'Ajouter l’ordre du jour.' },
      ],
      contraintes: { ton: 'formel', longueur: null },
    });
    expect(text).toContain('Contexte : Réunion lundi.');
    expect(text).toContain('1. Rédiger le message.');
    expect(text).toContain('2. Ajouter l’ordre du jour.');
    expect(text).toContain('Ton : formel');
    expect(text).not.toContain('null');
  });
});

describe('numberPrompts', () => {
  it('numbers the pasted prompts in order', () => {
    expect(numberPrompts('Résume.\n\nTraduis.\n---\nCorrige.')).toBe(
      '<prompt n="1">\nRésume.\n</prompt>\n<prompt n="2">\nTraduis.\n</prompt>\n<prompt n="3">\nCorrige.\n</prompt>',
    );
  });
});
