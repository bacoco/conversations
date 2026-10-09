import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';

import { PromptAddOns } from '../components/PromptAddOns';
import { useMyStyleStore } from '../stores/useMyStyleStore';

const Harness = () => {
  const [prompt, setPrompt] = useState('Write the minutes.');
  return (
    <>
      <output>{prompt}</output>
      <PromptAddOns prompt={prompt} onChange={setPrompt} />
    </>
  );
};

const shown = () => screen.getByRole('status').textContent ?? '';

describe('<PromptAddOns />', () => {
  beforeEach(() => useMyStyleStore.setState({ style: '' }));

  it('adds a sentence, then takes it out again', () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: 'Make it cautious' }));
    expect(shown()).toContain('say so instead of guessing');

    fireEvent.click(screen.getByRole('button', { name: 'Make it cautious' }));
    expect(shown()).toBe('Write the minutes.');
  });

  it('keeps one reading level at a time', () => {
    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: 'Expert' }));
    fireEvent.click(screen.getByRole('button', { name: 'Very simple' }));

    expect(shown()).toContain('people who find reading hard');
    expect(shown()).not.toContain('specialists');
    expect(screen.getByRole('button', { name: 'Very simple' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });

  it('offers the saved writing style', () => {
    useMyStyleStore.setState({ style: 'Short, warm sentences.' });
    render(<Harness />);

    fireEvent.click(screen.getByRole('button', { name: 'My writing style' }));

    expect(shown()).toContain('Write in this style: Short, warm sentences.');
  });
});
