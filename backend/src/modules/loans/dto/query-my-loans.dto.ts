import { z } from 'zod';
import { LoanStatus } from '@prisma/client';

/**
 * Zod schema for querying member's own loans (Member only)
 * Automatically filters to current user's loans
 * Supports optional status filtering and sorting
 */
export const queryMyLoansSchema = z.object({
  // Filter by loan status (optional)
  status: z.nativeEnum(LoanStatus).optional().describe('Filter by loan status'),

  // Sorting
  sortBy: z
    .enum(['dueDate', 'borrowedAt', 'createdAt'])
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
export type QueryMyLoansDto = z.infer<typeof queryMyLoansSchema>;
