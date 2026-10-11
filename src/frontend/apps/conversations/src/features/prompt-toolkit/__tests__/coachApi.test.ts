import {
  asPlainText,
  extractJson,
  formatConversationContext,
  keepPastedTexts,
  numberPrompts,
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

describe('formatConversationContext', () => {
  it('keeps recent user and assistant turns in a bounded context', () => {
    const context = formatConversationContext([
      { role: 'user', text: 'Prépare une note sur le budget.' },
      { role: 'assistant', text: 'Voici un plan de note.' },
    ]);

    expect(context).toContain('User: Prépare une note sur le budget.');
    expect(context).toContain('Assistant: Voici un plan de note.');
  });
});

describe('the text the user pasted', () => {
  const template =
    'Rédige une réponse au courriel ci-dessous.\n\n"""\nBonjour, ma carte grise ?\n"""';

  it('comes back word for word when the model wrote over it', () => {
    const final =
      'Rédige une réponse cordiale au courriel ci-dessous.\n\n"""\nBonjour, nous avons bien reçu…\n"""';
    expect(keepPastedTexts(template, final)).toBe(
      'Rédige une réponse cordiale au courriel ci-dessous.\n\n"""\nBonjour, ma carte grise ?\n"""',
    );
  });

  it('is left as is when the model kept it', () => {
    const final =
      'Rédige une réponse cordiale.\n\n"""\nBonjour,  ma carte grise ?\n"""';
    expect(keepPastedTexts(template, final)).toBe(final);
  });

  it('may be pasted during the questions, for a block still blank', () => {
    const blank = 'Résume ce texte.\n\n"""\n[collez le texte ici]\n"""';
    const final = 'Résume ce texte en 5 lignes.\n\n"""\nLe compte rendu…\n"""';
    expect(keepPastedTexts(blank, final)).toBe(final);
  });
});

describe('the facts check of an answer', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('never counts the parts already left to complete', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            choices: [
              {
                message: {
                  content: JSON.stringify({
                    claims: [
                      'Délai : « toujours en cours »',
                      'Site officiel : « À COMPLÉTER »',
                      'Signature : « [Votre nom] »',
                    ],
                  }),
                },
              },
            ],
          }),
        ),
      ),
    );
    const { checkAnswerFacts } = await import('../coach/coachApi');
    expect(await checkAnswerFacts('demande', 'réponse', 'French')).toEqual([
      'Délai : « toujours en cours »',
    ]);
  });
});

describe('the answers the user gave to Nestor', () => {
  it('are all in the final prompt, or said missing', async () => {
    const { droppedAnswers } = await import('../coach/coachApi');
    const answers = [
      { question: 'Pour qui ?', answer: 'Mon équipe de 12 agents' },
      {
        question: 'Quel but ?',
        answer: 'Informer sur les nouvelles règles de télétravail',
      },
      { question: 'Quel délai ?', answer: 'Je ne sais pas, passe à la suite.' },
    ];
    expect(
      droppedAnswers(
        answers,
        'Rédige une note claire sur le télétravail pour mon équipe de 12 agents.',
      ),
    ).toEqual(['Informer sur les nouvelles règles de télétravail']);
    expect(
      droppedAnswers(
        answers,
        'Rédige une note pour mon équipe de 12 agents, pour les informer des nouvelles règles du télétravail.',
      ),
    ).toEqual([]);
  });
});
