import { fireEvent, render, screen, within } from '@testing-library/react';

import { AskNestorSheet } from '../chat/AskNestorSheet';
import { NestorBar } from '../chat/NestorBar';
import type { NestorChat } from '../chat/useNestorChat';

vi.mock('@/components/ToastProvider', () => ({
  useToast: () => ({ showToast: vi.fn() }),
}));

const chat = (over: Partial<NestorChat> = {}) =>
  ({
    runBar: vi.fn(),
    busy: null,
    sheetOpen: false,
    setSheetOpen: vi.fn(),
    askNestor: vi.fn(),
    ...over,
  }) as unknown as NestorChat;

describe('<NestorBar />', () => {
  it('four buttons, always the same order, never disabled, even while Nestor works', () => {
    render(<NestorBar chat={chat({ busy: 'analyse' })} />);
    const buttons = within(screen.getByRole('toolbar')).getAllByRole('button');
    // The icon names are hidden from screen readers: one label per button.
    [
      'Analyse my text',
      'Improve my text',
      'Do the review',
      'Ask Nestor',
    ].forEach((label, index) =>
      expect(buttons[index]).toHaveAccessibleName(label),
    );
    buttons.forEach((button) => expect(button).not.toBeDisabled());
  });

  it('each button calls its action', () => {
    const c = chat();
    render(<NestorBar chat={c} />);
    fireEvent.click(screen.getByRole('button', { name: 'Ask Nestor' }));
    expect(c.runBar).toHaveBeenCalledWith('ask');
  });
});

describe('<AskNestorSheet />', () => {
  it('opens on the red button, keyboard only on demand', () => {
    const c = chat({ sheetOpen: true });
    render(<AskNestorSheet chat={c} />);
    expect(
      screen.getByRole('dialog', { name: 'Ask Nestor' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Press to speak' }),
    ).toBeInTheDocument();
    expect(screen.queryByRole('textbox')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Or type it' }));
    fireEvent.change(screen.getByRole('textbox'), {
      target: { value: 'Comment dire qui va lire ?' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Send to Nestor' }));
    expect(c.askNestor).toHaveBeenCalledWith(
      'Comment dire qui va lire ?',
      'keyboard',
    );
  });

  it('Escape closes it', () => {
    const c = chat({ sheetOpen: true });
    render(<AskNestorSheet chat={c} />);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(c.setSheetOpen).toHaveBeenCalledWith(false);
  });
});
