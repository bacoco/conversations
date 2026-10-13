import { fireEvent, render, screen } from '@testing-library/react';

import {
  FavoritesButton,
  favoritesCornerShown,
} from '../favorites/FavoritesButton';
import { usePromptToolkitStore } from '../stores/usePromptToolkitStore';

describe('<FavoritesButton />', () => {
  it('a round star at the bottom right opens my favorites', () => {
    usePromptToolkitStore.setState({ showHome: true, showFavorites: false });
    render(<FavoritesButton />);
    fireEvent.click(screen.getByRole('button', { name: 'My favorites' }));
    expect(usePromptToolkitStore.getState()).toMatchObject({
      showHome: false,
      showFavorites: true,
    });
  });
});

describe('favoritesCornerShown', () => {
  const base = {
    welcomeShown: false,
    isNestorChat: false,
    showFavorites: false,
  };
  it('on the home page, the course and the tools', () => {
    expect(favoritesCornerShown(base)).toBe(true);
  });
  it('not in the coach: its bar is there', () => {
    expect(favoritesCornerShown({ ...base, isNestorChat: true })).toBe(false);
  });
  it('not on the favorites page itself, nor during the welcome video', () => {
    expect(favoritesCornerShown({ ...base, showFavorites: true })).toBe(false);
    expect(favoritesCornerShown({ ...base, welcomeShown: true })).toBe(false);
  });
});
