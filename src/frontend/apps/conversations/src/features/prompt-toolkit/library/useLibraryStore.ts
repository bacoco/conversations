import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface LibraryState {
  /** Ids of the prompts the user starred, kept in this browser. */
  favorites: string[];
  toggleFavorite: (id: string) => void;
}

export const useLibraryStore = create<LibraryState>()(
  persist(
    (set) => ({
      favorites: [],
      toggleFavorite: (id) =>
        set((state) => ({
          favorites: state.favorites.includes(id)
            ? state.favorites.filter((favorite) => favorite !== id)
            : [...state.favorites, id],
        })),
    }),
    { name: 'prompt-library' },
  ),
);
