import { z } from 'zod';

/**
 * Zod schema for updating a category
 * All fields are optional for partial updates
 */
export const updateCategorySchema = z.object({
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(255, 'Name must not exceed 255 characters')
    .trim()
    .optional()
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
export type UpdateCategoryDto = z.infer<typeof updateCategorySchema>;
