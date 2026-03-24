import { create } from 'zustand';

export type ViewMode = 'today' | 'tomorrow' | 'this_week' | 'all';

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
