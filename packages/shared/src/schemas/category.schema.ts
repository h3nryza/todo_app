import { z } from 'zod';

const hexColorSchema = z
  .string()
  .regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color (e.g., #FF5733)');

export const createCategorySchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be at most 50 characters'),
  color: hexColorSchema,
  icon: z.string().min(1, 'Icon is required'),
});

export const updateCategorySchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: hexColorSchema.optional(),
  icon: z.string().min(1).optional(),
  isFavorite: z.boolean().optional(),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
