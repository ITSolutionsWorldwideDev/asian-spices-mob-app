// apps/web/store/useCategoryFilterStore.ts

import { create } from "zustand";

interface CategoryState {
  selectedCategories: string[];
  data: string[];
  loading: boolean;
  toggleCategory: ( categoryid: string) => void;
  clearCategories: () => void;
  fetchCategories: (slug: string) => Promise<void>;
}

export const useCategoryFilterStore = create<CategoryState>((set) => ({
  selectedCategories: [],
  data: [],
  loading: false,

  toggleCategory: (categoryid: string) =>
    set((state) => ({
      selectedCategories: state.selectedCategories.includes(categoryid)
        ? state.selectedCategories.filter((c) => c !== categoryid)
        : [...state.selectedCategories, categoryid],
    })),

  clearCategories: () => set({ selectedCategories: [] }),

  fetchCategories: async (slug: string) => {
    if (!slug) return;

    set({ loading: true });

    try {
      const res = await fetch(`/api/category/${slug}`);
      const json = await res.json();

      set({
        data: json.subcategories,
        loading: false,
      });
    } catch (error) {
      console.error("Failed to fetch categories:", error);
      set({ loading: false });
    }
  },
}));
