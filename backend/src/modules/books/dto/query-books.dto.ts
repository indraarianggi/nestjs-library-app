import { z } from 'zod';

/**
 * Zod schema for query parameters when listing books
 * Supports pagination, search, filtering, and sorting
 */
export const queryBooksSchema = z.object({
  q: z
    .string()
    .trim()
    .optional()
    .describe(
      'Search query for book title and author name (case-insensitive partial match)',
    ),

  authorId: z
    .string()
    .uuid('Author ID must be a valid UUID')
    .optional()
    .describe('Filter by author UUID'),

  categoryId: z
    .string()
    .uuid('Category ID must be a valid UUID')
    .optional()
    .describe('Filter by category UUID'),

  availability: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .optional()
    .describe('Filter by availability (true = has available copies, false = no available copies)'),

  sortBy: z
    .enum(['title', 'createdAt', 'relevance'])
    .default('relevance')
    .describe('Field to sort by'),

  sortOrder: z
    .enum(['asc', 'desc'])
    .default('desc')
    .describe('Sort direction'),

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
export type QueryBooksDto = z.infer<typeof queryBooksSchema>;
