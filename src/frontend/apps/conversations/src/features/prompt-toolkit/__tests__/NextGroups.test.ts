import { parseNextGroups } from '../coach/coachApi';

describe('the next questions by axis', () => {
  it('keeps the standard axes in their order, then up to two extra ones', () => {
    const groups = parseNextGroups({
      step_back: ['C', 'C2', 'C3'],
      deepen: ['A', 'A2'],
      reshape: ['B'],
      extra: [
        { label: 'Budget', questions: ['D'] },
        { label: 'Calendrier', questions: ['E'] },
        { label: 'Risques juridiques', questions: ['F'] },
      ],
    });
    expect(groups).toEqual([
      { kind: 'standard', axis: 'deepen', questions: ['A', 'A2'] },
      { kind: 'standard', axis: 'reshape', questions: ['B'] },
      { kind: 'standard', axis: 'step_back', questions: ['C', 'C2'] },
      { kind: 'extra', label: 'Budget', questions: ['D'] },
      { kind: 'extra', label: 'Calendrier', questions: ['E'] },
    ]);
  });

  it('leaves out empty axes, repeated questions and an extra axis named like a standard one', () => {
    const groups = parseNextGroups(
      {
        deepen: ['Détaille le point 2.'],
        reshape: [],
        step_back: ['détaille le point 2 !', 'Quels risques ?'],
        extra: [
          { label: 'Approfondir', questions: ['Encore plus ?'] },
          { label: 'Budget', questions: ['Quels risques ?'] },
          { label: 'Budget', questions: ['Chiffre-le.'] },
          { label: '  ', questions: ['Rien.'] },
          'not an axis',
        ],
      },
      ['Approfondir', 'Mettre en forme', 'Prendre du recul'],
    );
    expect(groups).toEqual([
      { kind: 'standard', axis: 'deepen', questions: ['Détaille le point 2.'] },
      { kind: 'standard', axis: 'step_back', questions: ['Quels risques ?'] },
      { kind: 'extra', label: 'Budget', questions: ['Chiffre-le.'] },
    ]);
  });

  it('gives nothing for a broken answer', () => {
    expect(parseNextGroups({ questions: ['old shape'] })).toEqual([]);
  });
});
