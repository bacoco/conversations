import { act, renderHook } from '@testing-library/react';

import { suggestPistes } from '../chat/nestorChatApi';
import { PISTES_DELAY_MS, usePistes } from '../chat/usePistes';

vi.mock('../chat/nestorChatApi', () => ({
  suggestPistes: vi.fn(),
}));

describe('usePistes', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('thinking from the first key, through the pause, until the ideas come', async () => {
    let answer: (found: string[]) => void = () => undefined;
    vi.mocked(suggestPistes).mockReturnValue(
      new Promise((resolve) => {
        answer = resolve;
      }),
    );
    const { result } = renderHook(() =>
      usePistes('Rédiger une réponse à un agent', true),
    );
    // Seen at once: no silent wait during the pause.
    expect(result.current.isSearching).toBe(true);
    act(() => {
      vi.advanceTimersByTime(PISTES_DELAY_MS);
    });
    expect(result.current.isSearching).toBe(true);
    await act(() => {
      answer(['Une idée']);
      return Promise.resolve();
    });
    expect(result.current.isSearching).toBe(false);
    expect(result.current.phrases).toEqual(['Une idée']);
  });

  it('not thinking on a text too short to start from', () => {
    const { result } = renderHook(() => usePistes('Bonjour', true));
    expect(result.current.isSearching).toBe(false);
  });
});
