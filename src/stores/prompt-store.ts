import { create } from 'zustand';

type PromptState = {
  /** Slug of the idea whose "Copy prompt" sheet is open, or null if closed. */
  slug: string | null;
  open: (slug: string) => void;
  close: () => void;
};

export const usePromptStore = create<PromptState>((set) => ({
  slug: null,
  open: (slug) => set({ slug }),
  close: () => set({ slug: null }),
}));
