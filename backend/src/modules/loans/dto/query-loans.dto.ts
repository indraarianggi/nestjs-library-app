import { z } from 'zod';
import { LoanStatus } from '@prisma/client';

/**
 * Zod schema for querying all loans (Admin only)
 * Supports pagination, filtering by multiple criteria, and sorting
 */
export const queryLoansSchema = z.object({
  // Filter by loan status
  status: z.nativeEnum(LoanStatus).optional().describe('Filter by loan status'),

  // Filter by member
  memberId: z
    .string()
    .uuid('Member ID must be a valid UUID')
    .optional()
    .describe('Filter by member user ID'),

  // Filter by book
  bookId: z
    .string()
    .uuid('Book ID must be a valid UUID')
    .optional()
    .describe('Filter by book ID'),

  // Filter by due date range
  dueBefore: z.coerce
    .date()
    .optional()
    .describe('Filter loans with due date before this date (ISO 8601 format)'),

  dueAfter: z.coerce
    .date()
    .optional()
    .describe('Filter loans with due date after this date (ISO 8601 format)'),

  // Sorting
  sortBy: z
    .enum(['dueDate', 'borrowedAt', 'createdAt', 'status'])
    .default('dueDate')
    .describe('Field to sort by'),

  sortOrder: z.enum(['asc', 'desc']).default('asc').describe('Sort direction'),

  // Pagination
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
export type QueryLoansDto = z.infer<typeof queryLoansSchema>;
