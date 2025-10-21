import { z } from 'zod';
import { MembershipStatus } from '@prisma/client';

/**
 * Zod schema for querying members
 * Supports pagination, search, filtering by status, and sorting
 */
export const queryMembersSchema = z.object({
  // Search query
  q: z
    .string()
    .optional()
    .describe('Search by first name, last name, or email'),

  // Filter by status
  status: z
    .nativeEnum(MembershipStatus)
    .optional()
    .describe('Filter by membership status (PENDING, ACTIVE, SUSPENDED)'),

  // Sorting
  sortBy: z
    .enum(['firstName', 'lastName', 'email', 'createdAt'])
    .default('createdAt')
    .describe('Field to sort by'),

  sortOrder: z.enum(['asc', 'desc']).default('desc').describe('Sort direction'),

  // Pagination
  page: z
    .string()
    .optional()
    .default('1')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive())
    .describe('Page number (1-indexed)'),

  pageSize: z
    .string()
    .optional()
    .default('20')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive().max(100))
    .describe('Number of items per page (max 100)'),
});

/**
 * TypeScript type derived from the Zod schema
 */
export type QueryMembersDto = z.infer<typeof queryMembersSchema>;
