import { create } from 'zustand';
import type { Concept, Usage } from '@/lib/ideas';

type GalleryState = {
  query: string;
  setQuery: (q: string) => void;
  clearQuery: () => void;

  concepts: Concept[];
  usages: Usage[];
  toggleConcept: (c: Concept) => void;
  toggleUsage: (u: Usage) => void;
  clearFilters: () => void;
  clearAll: () => void;

  filtersOpen: boolean;
  setFiltersOpen: (open: boolean) => void;
  toggleFiltersOpen: () => void;
};

const without = <T,>(arr: T[], v: T) => arr.filter((x) => x !== v);
const toggle = <T,>(arr: T[], v: T): T[] =>
  arr.includes(v) ? without(arr, v) : [...arr, v];

export const useGalleryStore = create<GalleryState>((set) => ({
  query: '',
  setQuery: (query) => set({ query }),
  clearQuery: () => set({ query: '' }),

  concepts: [],
  usages: [],
  toggleConcept: (c) =>
    set((s) => ({ concepts: toggle(s.concepts, c) })),
  toggleUsage: (u) => set((s) => ({ usages: toggle(s.usages, u) })),
  clearFilters: () => set({ concepts: [], usages: [] }),
  clearAll: () => set({ query: '', concepts: [], usages: [] }),

  filtersOpen: false,
  setFiltersOpen: (filtersOpen) => set({ filtersOpen }),
  toggleFiltersOpen: () => set((s) => ({ filtersOpen: !s.filtersOpen })),
}));
