import { act, render, renderHook, screen } from '@testing-library/react';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { NestorThread } from '../chat/NestorThread';
import {
  FIELD_CHECK_DELAY_MS,
  useFieldSensitive,
} from '../chat/useFieldSensitive';
import type { NestorChat } from '../chat/useNestorChat';
import { detectSensitiveData } from '../coach/sensitiveData';

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const chat = {
  messages: [],
  action: 1,
  busy: null,
  questions: {
    items: [],
    current: null,
    answers: [],
    skipped: [],
    done: false,
  },
} as unknown as NestorChat;

describe('personal data typed for the Assistant', () => {
  beforeAll(async () => {
    // A real English instance: the texts are checked with their values.
    await i18n.use(initReactI18next).init({
      lng: 'en',
      resources: { en: { translation: {} } },
      nsSeparator: false,
      keySeparator: false,
    });
  });

  it('a SIREN is recognised by its check digit, not any nine digits', () => {
    expect(detectSensitiveData('Société 732 829 320, Paris')).toContain(
      'siren',
    );
    expect(detectSensitiveData('Montant : 123 456 789 euros')).not.toContain(
      'siren',
    );
  });

  it('noticed after a pause in typing, never on each key', () => {
    vi.useFakeTimers();
    const { result, rerender } = renderHook(
      ({ text }) => useFieldSensitive(text),
      { initialProps: { text: 'Appeler M. X au 06 12 34 56 78' } },
    );
    expect(result.current).toEqual([]);
    act(() => {
      vi.advanceTimersByTime(FIELD_CHECK_DELAY_MS);
    });
    expect(result.current).toEqual(['phone']);
    rerender({ text: 'Appeler M. X' });
    act(() => {
      vi.advanceTimersByTime(FIELD_CHECK_DELAY_MS);
    });
    expect(result.current).toEqual([]);
    vi.useRealTimers();
  });

  it('Nestor warns in his thread, before anything is sent', () => {
    render(<NestorThread chat={chat} pistes={[]} fieldSensitive={['phone']} />);
    expect(
      screen.getByText(/Your request for the Assistant holds a phone number/),
    ).toBeInTheDocument();
  });

  it('suggests a neutral marker instead: the task often works without the data', () => {
    render(<NestorThread chat={chat} pistes={[]} fieldSensitive={['phone']} />);
    expect(
      screen.getByText(/replace it with a neutral marker/),
    ).toBeInTheDocument();
  });
});
