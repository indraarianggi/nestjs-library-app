import { z } from 'zod';

/**
 * Zod schema for adding copies to a book
 * Validates count and location code
 */
export const addCopiesSchema = z.object({
  count: z
    .number()
    .int('Count must be an integer')
    .min(1, 'Count must be at least 1')
    .max(100, 'Count must not exceed 100')
    .describe('Number of copies to add'),

  locationCode: z
    .string()
    .max(50, 'Location code must not exceed 50 characters')
    .trim()
    .optional()
    .nullable()
    .describe('Physical location code for the copies (e.g., shelf number)'),
});

/**
 * TypeScript type derived from the Zod schema
 */
export type AddCopiesDto = z.infer<typeof addCopiesSchema>;
