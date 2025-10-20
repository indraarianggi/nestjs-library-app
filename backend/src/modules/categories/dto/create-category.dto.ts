import { z } from 'zod';

/**
 * Zod schema for creating a category
 * Validates category name (required, unique) and optional description
 */
export const createCategorySchema = z.object({
  name: z
    .string('Name is required')
    .min(1, 'Name is required')
    .max(255, 'Name must not exceed 255 characters')
    .trim()
    .describe('Category name (unique)'),

  description: z
    .string()
    .trim()
    .optional()
    .nullable()
    .describe('Category description'),
});

/**
 * TypeScript type derived from the Zod schema
 */
export type CreateCategoryDto = z.infer<typeof createCategorySchema>;
