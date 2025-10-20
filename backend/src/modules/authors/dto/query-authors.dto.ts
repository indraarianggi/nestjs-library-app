import { z } from 'zod';

/**
 * Zod schema for query parameters when listing authors
 * Supports pagination, search, and sorting
 */
export const queryAuthorsSchema = z.object({
  q: z
    .string()
    .trim()
    .optional()
    .describe('Search query for author name (case-insensitive partial match)'),

  sortBy: z
    .enum(['name', 'createdAt'])
    .default('name')
    .describe('Field to sort by'),

  sortOrder: z.enum(['asc', 'desc']).default('asc').describe('Sort direction'),

  page: z.coerce
    .number()
    .int()
    .positive('Page must be a positive integer')
    .default(1)
    .describe('Page number'),

  pageSize: z.coerce
    .number()
    .int()
    .positive('Page size must be a positive integer')
    .min(1)
    .max(100, 'Page size must not exceed 100')
    .default(20)
    .describe('Number of items per page'),
});

/**
 * TypeScript type derived from the Zod schema
 */
export type QueryAuthorsDto = z.infer<typeof queryAuthorsSchema>;
