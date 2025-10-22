import { z } from 'zod';

const isbnPattern = /^[0-9-]{10,17}$/;

export const createBookSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(500, 'Title must not exceed 500 characters'),
  subtitle: z
    .string()
    .max(500, 'Subtitle must not exceed 500 characters')
    .optional()
    .nullable(),
  description: z.string().optional().nullable(),
  isbn: z
    .string()
    .min(1, 'ISBN is required')
    .regex(isbnPattern, 'ISBN must be 10-17 digits (hyphens allowed)'),
  publicationYear: z
    .number()
    .int('Publication year must be a whole number')
    .min(1000, 'Publication year must be at least 1000')
    .max(2100, 'Publication year must not exceed 2100')
    .optional()
    .nullable(),
  language: z
    .string()
    .max(50, 'Language must not exceed 50 characters')
    .optional()
    .nullable(),
  coverImageUrl: z.string().url('Invalid URL format').optional().nullable(),
  authorIds: z
    .array(z.string().uuid('Invalid author ID format'))
    .min(1, 'At least one author is required'),
  categoryIds: z
    .array(z.string().uuid('Invalid category ID format'))
    .min(1, 'At least one category is required'),
});

export const updateBookSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(500, 'Title must not exceed 500 characters')
    .optional(),
  subtitle: z
    .string()
    .max(500, 'Subtitle must not exceed 500 characters')
    .optional()
    .nullable(),
  description: z.string().optional().nullable(),
  isbn: z
    .string()
    .regex(isbnPattern, 'ISBN must be 10-17 digits (hyphens allowed)')
    .optional(),
  publicationYear: z
    .number()
    .int('Publication year must be a whole number')
    .min(1000, 'Publication year must be at least 1000')
    .max(2100, 'Publication year must not exceed 2100')
    .optional()
    .nullable(),
  language: z
    .string()
    .max(50, 'Language must not exceed 50 characters')
    .optional()
    .nullable(),
  coverImageUrl: z.string().url('Invalid URL format').optional().nullable(),
  status: z.enum(['ACTIVE', 'ARCHIVED'], {
    message: 'Status must be ACTIVE or ARCHIVED',
  }).optional(),
  authorIds: z
    .array(z.string().uuid('Invalid author ID format'))
    .optional(),
  categoryIds: z
    .array(z.string().uuid('Invalid category ID format'))
    .optional(),
});

export const bookFilterSchema = z.object({
  q: z.string().optional(),
  categoryId: z.string().uuid('Invalid category ID format').optional(),
  authorId: z.string().uuid('Invalid author ID format').optional(),
  availability: z.boolean().optional(),
  sortBy: z
    .enum(['relevance', 'title', 'createdAt'], {
      message: 'Invalid sort field',
    })
    .optional(),
  sortOrder: z
    .enum(['asc', 'desc'], {
      message: 'Sort order must be asc or desc',
    })
    .optional(),
  page: z
    .number()
    .int('Page must be a whole number')
    .min(1, 'Page must be at least 1')
    .optional(),
  pageSize: z
    .number()
    .int('Page size must be a whole number')
    .min(1, 'Page size must be at least 1')
    .max(100, 'Page size must not exceed 100')
    .optional(),
});

export type CreateBookInput = z.infer<typeof createBookSchema>;
export type UpdateBookInput = z.infer<typeof updateBookSchema>;
export type BookFilterInput = z.infer<typeof bookFilterSchema>;
