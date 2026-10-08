import { act, fireEvent, render, screen } from '@testing-library/react';

import { ImpactView } from '../components/ImpactView';

const answer = (content: string) =>
  new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status: 200,
  });

describe('<ImpactView />', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('shows the answers to both prompts', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(answer('A vague answer.'))
      .mockResolvedValueOnce(answer('A precise answer.'));
    vi.stubGlobal('fetch', fetchMock);

    render(
      <ImpactView original="Summarise" improved="Summarise in 5 points" />,
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: /See the impact/ }));
    });

    expect(await screen.findByText('A precise answer.')).toBeInTheDocument();
    expect(screen.getByText('A vague answer.')).toBeInTheDocument();
    const bodies = fetchMock.mock.calls.map((call) =>
      String((call as [string, RequestInit])[1].body),
    );
    expect(bodies[0]).toContain('"content":"Summarise"');
    expect(bodies[1]).toContain('Summarise in 5 points');
  });
});
