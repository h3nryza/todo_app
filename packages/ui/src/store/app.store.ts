import { create } from 'zustand';

/** View modes for the Home page reminder grouping */
export type ViewMode = 'today' | 'tomorrow' | 'this_week' | 'this_month' | 'this_year' | 'all';

interface AppState {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string | null;
  setSelectedCategory: (categoryId: string | null) => void;
  view: ViewMode;
  setView: (view: ViewMode) => void;
}

export const useAppStore = create<AppState>((set) => ({
  searchQuery: '',
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  selectedCategory: null,
  setSelectedCategory: (selectedCategory) => set({ selectedCategory }),
  view: 'today',
  setView: (view) => set({ view }),
}));
