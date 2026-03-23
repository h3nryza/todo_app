import { useState, useEffect, useCallback } from 'react';
import type { Category, CreateCategoryDto, UpdateCategoryDto } from '@wiwf/shared';
import {
  getCategories as fetchCategories,
  createCategory as createCategoryService,
  updateCategory as updateCategoryService,
  deleteCategory as deleteCategoryService,
  toggleFavorite as toggleFavoriteService,
} from '@/services/categories.service';
import { on, off, EVENTS } from '@/lib/events';

interface UseCategoriesResult {
  data: Category[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useCategories(): UseCategoriesResult {
  const [data, setData] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const categories = await fetchCategories();
      setData(categories);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    on(EVENTS.CATEGORIES_CHANGED, load);
    return () => off(EVENTS.CATEGORIES_CHANGED, load);
  }, [load]);

  return { data, loading, error, refetch: load };
}

export function useCreateCategory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (data: CreateCategoryDto): Promise<Category> => {
    setLoading(true);
    setError(null);
    try {
      return await createCategoryService(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to create category';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error };
}

export function useUpdateCategory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(
    async (id: string, data: UpdateCategoryDto): Promise<Category | null> => {
      setLoading(true);
      setError(null);
      try {
        return await updateCategoryService(id, data);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to update category';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  return { mutate, loading, error };
}

export function useDeleteCategory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await deleteCategoryService(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete category';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error };
}

export function useToggleFavorite() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useCallback(async (id: string): Promise<Category | null> => {
    setLoading(true);
    setError(null);
    try {
      return await toggleFavoriteService(id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to toggle favorite';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return { mutate, loading, error };
}
