import type { TFunction } from 'i18next';

import { buildToolParts, getDailyTools } from '../tools/tools';

const t = ((key: string, values?: Record<string, string>) =>
  key.replace(
    /\{\{(\w+)\}\}/g,
    (_, name: string) => values?.[name] ?? '',
  )) as unknown as TFunction;

describe('the everyday tools: choices, then a request in parts', () => {
  const tools = getDailyTools(t);

  it('« Résumé » asks who reads and what to keep, by buttons', () => {
    const summary = tools.find((tool) => tool.id === 'summary')!;
    const groups = summary.options.map((group) => group.id);
    expect(groups).toEqual(expect.arrayContaining(['audience', 'focus']));
    const parts = buildToolParts(
      summary,
      { audience: 'team', focus: 'figures' },
      'Note de service.',
    );
    expect(parts.find((part) => part.kind === 'context')?.text).toMatch(
      /for my team/,
    );
    expect(parts.map((part) => part.text).join(' ')).toMatch(/key figures/);
    // The text to work on stays its own part, never mixed with the request.
    expect(parts.find((part) => part.kind === 'document')?.text).toContain(
      'Note de service.',
    );
  });

  it('each tool of the forms builds a request that never says « prompt »', () => {
    for (const id of ['summary', 'actions', 'plan', 'brainstorm']) {
      const tool = tools.find((item) => item.id === id)!;
      const text = buildToolParts(tool, {}, 'Texte.')
        .map((part) => part.text)
        .join(' ');
      expect(text.length).toBeGreaterThan(20);
      expect(text).not.toMatch(/prompt/i);
    }
  });
});
