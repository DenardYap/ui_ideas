import { create } from 'zustand';

type GalleryState = {
  query: string;
  setQuery: (q: string) => void;
  clearQuery: () => void;
};

export const useGalleryStore = create<GalleryState>((set) => ({
  query: '',
  setQuery: (query) => set({ query }),
  clearQuery: () => set({ query: '' }),
}));
