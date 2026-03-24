import type { Category, CreateCategoryDto, UpdateCategoryDto } from '@ohright/shared';
import { getDatabase, generateUUID } from '../lib/database';
import { emit, EVENTS } from '../lib/events';

interface CategoryRow {
  id: string;
  name: string;
  color: string;
  icon: string;
  is_favorite: number;
  usage_count: number;
  created_at: string;
}

function mapRow(row: CategoryRow): Category {
  return {
    id: row.id,
    userId: '',
    name: row.name,
    color: row.color,
    icon: row.icon,
    isFavorite: row.is_favorite === 1,
    usageCount: row.usage_count,
    createdAt: row.created_at,
  };
}

export async function getCategories(): Promise<Category[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CategoryRow>(
    'SELECT * FROM categories ORDER BY is_favorite DESC, usage_count DESC, name ASC',
  );
  return rows.map(mapRow);
}

export async function getCategory(id: string): Promise<Category | null> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<CategoryRow>('SELECT * FROM categories WHERE id = ?', [id]);
  if (rows.length === 0) return null;
  return mapRow(rows[0]!);
}

export async function createCategory(data: CreateCategoryDto): Promise<Category> {
  const db = await getDatabase();
  const id = generateUUID();
  const now = new Date().toISOString();

  await db.runAsync(
    'INSERT INTO categories (id, name, color, icon, created_at) VALUES (?, ?, ?, ?, ?)',
    [id, data.name, data.color, data.icon, now],
  );

  emit(EVENTS.CATEGORIES_CHANGED);
  const cat = await getCategory(id);
  return cat!;
}

export async function updateCategory(
  id: string,
  data: UpdateCategoryDto,
): Promise<Category | null> {
  const db = await getDatabase();
  const updates: string[] = [];
  const params: unknown[] = [];

  if (data.name !== undefined) {
    updates.push('name = ?');
    params.push(data.name);
  }
  if (data.color !== undefined) {
    updates.push('color = ?');
    params.push(data.color);
  }
  if (data.icon !== undefined) {
    updates.push('icon = ?');
    params.push(data.icon);
  }
  if (data.isFavorite !== undefined) {
    updates.push('is_favorite = ?');
    params.push(data.isFavorite ? 1 : 0);
  }

  if (updates.length === 0) return getCategory(id);

  params.push(id);
  await db.runAsync(`UPDATE categories SET ${updates.join(', ')} WHERE id = ?`, params);

  emit(EVENTS.CATEGORIES_CHANGED);
  return getCategory(id);
}

export async function deleteCategory(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('UPDATE reminders SET category_id = NULL WHERE category_id = ?', [id]);
  await db.runAsync('DELETE FROM categories WHERE id = ?', [id]);
  emit(EVENTS.CATEGORIES_CHANGED);
  emit(EVENTS.REMINDERS_CHANGED);
}

export async function toggleFavorite(id: string): Promise<Category | null> {
  const db = await getDatabase();
  const cat = await getCategory(id);
  if (!cat) return null;

  await db.runAsync('UPDATE categories SET is_favorite = ? WHERE id = ?', [
    cat.isFavorite ? 0 : 1,
    id,
  ]);

  emit(EVENTS.CATEGORIES_CHANGED);
  return getCategory(id);
}

export async function getCategoryReminderCount(categoryId: string): Promise<number> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM reminders WHERE category_id = ?',
    [categoryId],
  );
  return rows[0]?.count ?? 0;
}
