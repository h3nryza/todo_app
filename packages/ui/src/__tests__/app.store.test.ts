import { describe, it, expect, beforeEach } from 'vitest';
import { useAppStore } from '../store/app.store';

describe('useAppStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    useAppStore.setState({
      searchQuery: '',
      selectedCategory: null,
      view: 'today',
    });
  });

  describe('initial state', () => {
    it('starts with empty search query', () => {
      expect(useAppStore.getState().searchQuery).toBe('');
    });

    it('starts with no selected category', () => {
      expect(useAppStore.getState().selectedCategory).toBeNull();
    });

    it('starts with "today" view', () => {
      expect(useAppStore.getState().view).toBe('today');
    });
  });

  describe('setSearchQuery', () => {
    it('updates the search query', () => {
      useAppStore.getState().setSearchQuery('medication');
      expect(useAppStore.getState().searchQuery).toBe('medication');
    });

    it('can set an empty query', () => {
      useAppStore.getState().setSearchQuery('something');
      useAppStore.getState().setSearchQuery('');
      expect(useAppStore.getState().searchQuery).toBe('');
    });

    it('does not affect other state', () => {
      useAppStore.getState().setSelectedCategory('cat-123');
      useAppStore.getState().setSearchQuery('test');
      expect(useAppStore.getState().selectedCategory).toBe('cat-123');
    });
  });

  describe('setSelectedCategory', () => {
    it('sets the selected category', () => {
      useAppStore.getState().setSelectedCategory('cat-abc');
      expect(useAppStore.getState().selectedCategory).toBe('cat-abc');
    });

    it('can clear the selected category with null', () => {
      useAppStore.getState().setSelectedCategory('cat-abc');
      useAppStore.getState().setSelectedCategory(null);
      expect(useAppStore.getState().selectedCategory).toBeNull();
    });

    it('does not affect other state', () => {
      useAppStore.getState().setSearchQuery('test');
      useAppStore.getState().setSelectedCategory('cat-abc');
      expect(useAppStore.getState().searchQuery).toBe('test');
    });
  });

  describe('setView', () => {
    it('sets the view to "tomorrow"', () => {
      useAppStore.getState().setView('tomorrow');
      expect(useAppStore.getState().view).toBe('tomorrow');
    });

    it('sets the view to "this_week"', () => {
      useAppStore.getState().setView('this_week');
      expect(useAppStore.getState().view).toBe('this_week');
    });

    it('sets the view to "this_month"', () => {
      useAppStore.getState().setView('this_month');
      expect(useAppStore.getState().view).toBe('this_month');
    });

    it('sets the view to "this_year"', () => {
      useAppStore.getState().setView('this_year');
      expect(useAppStore.getState().view).toBe('this_year');
    });

    it('sets the view to "all"', () => {
      useAppStore.getState().setView('all');
      expect(useAppStore.getState().view).toBe('all');
    });

    it('can switch back to "today"', () => {
      useAppStore.getState().setView('all');
      useAppStore.getState().setView('today');
      expect(useAppStore.getState().view).toBe('today');
    });

    it('does not affect other state', () => {
      useAppStore.getState().setSearchQuery('test');
      useAppStore.getState().setSelectedCategory('cat-abc');
      useAppStore.getState().setView('all');
      expect(useAppStore.getState().searchQuery).toBe('test');
      expect(useAppStore.getState().selectedCategory).toBe('cat-abc');
    });
  });
});
