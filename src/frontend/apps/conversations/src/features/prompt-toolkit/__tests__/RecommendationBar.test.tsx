import { act, fireEvent, render, screen } from '@testing-library/react';

import { LIBRARY_EN } from '../library/content/en';
import { RecommendationBar } from '../library/RecommendationBar';
import { libraryToSuggestions, toCatalog } from '../library/useRecommendations';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

const completion = (content: object) =>
  new Response(
    JSON.stringify({
      choices: [{ message: { content: JSON.stringify(content) } }],
    }),
    { status: 200 },
  );

describe('<RecommendationBar />', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    usePromptToolkitStore.setState({ chatInput: '', fill: null });
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it('describes every prompt to the model with its keywords', () => {
    const catalog = toCatalog(libraryToSuggestions(LIBRARY_EN));
    expect(catalog).toHaveLength(LIBRARY_EN.prompts.length);
    expect(catalog[0].summary).toContain(LIBRARY_EN.prompts[0].keywords[0]);
  });

  it('suggests prompts after a pause, and starts Robin with the draft', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      completion({
        ids: ['meeting-minutes', 'unknown', 'tool-translate'],
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const draft = 'my notes from the steering committee need tidying';
    usePromptToolkitStore.setState({ chatInput: draft });

    render(<RecommendationBar isActive />);
    expect(fetchMock).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(1600));

    expect(
      await screen.findByRole('button', { name: /Translate/ }),
    ).toBeInTheDocument();
    fireEvent.click(
      screen.getByRole('button', { name: /^.*Meeting minutes$/ }),
    );
    expect(usePromptToolkitStore.getState().fill).toMatchObject({
      title: 'Meeting minutes',
      context: draft,
    });
  });

  it('stays silent on short drafts', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    usePromptToolkitStore.setState({ chatInput: 'hello' });

    render(<RecommendationBar isActive />);
    await act(() => vi.advanceTimersByTimeAsync(2000));

    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByRole('region')).not.toBeInTheDocument();
  });

  it('opens a suggested tool directly', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(completion({ ids: ['tool-translate'] })),
    );
    usePromptToolkitStore.setState({
      chatInput: 'translate this letter for a member of the public',
    });
    render(<RecommendationBar isActive />);
    await act(() => vi.advanceTimersByTimeAsync(1600));

    fireEvent.click(await screen.findByRole('button', { name: /Translate/ }));
    expect(usePromptToolkitStore.getState()).toMatchObject({
      mode: 'tools',
      toolRequest: 'translate',
    });
  });

  it('keeps keys unique across prompts, tools and lessons', async () => {
    const { libraryToSuggestions: toSuggestions } =
      await import('../library/useRecommendations');
    const keys = toSuggestions(LIBRARY_EN).map((s) => s.key);
    expect(keys.some((key) => /^(tool-|lesson-)/.test(key))).toBe(false);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('always offers to improve the text with Robin', () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(completion({ ids: [] })));
    usePromptToolkitStore.setState({
      chatInput: 'write something to my team about Monday',
    });
    render(<RecommendationBar isActive />);

    fireEvent.click(
      screen.getByRole('button', { name: /Improve my text with Robin/ }),
    );
    expect(usePromptToolkitStore.getState().fill).toMatchObject({
      template: 'write something to my team about Monday',
      mode: 'draft',
    });
  });
});
