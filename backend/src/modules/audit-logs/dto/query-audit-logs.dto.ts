import { z } from 'zod';

/**
 * Zod schema for querying audit logs (Admin only)
 * Supports pagination, filtering by multiple criteria, and sorting
 */
export const queryAuditLogsSchema = z.object({
  // Filter by user
  userId: z
    .string()
    .uuid('User ID must be a valid UUID')
    .optional()
    .describe('Filter by user ID'),

  // Filter by action
  action: z
    .string()
    .min(1, 'Action must not be empty')
    .optional()
    .describe('Filter by action (e.g., "book.created")'),

  // Filter by entity type
  entityType: z
    .string()
    .min(1, 'Entity type must not be empty')
    .optional()
    .describe('Filter by entity type (e.g., "Book", "Loan")'),

  // Filter by entity ID
  entityId: z
    .string()
    .uuid('Entity ID must be a valid UUID')
    .optional()
    .describe('Filter by entity ID'),

  // Filter by date range
  dateFrom: z.coerce
    .date()
    .optional()
    .describe('Filter logs created after this date (ISO 8601 format)'),

  dateTo: z.coerce
    .date()
    .optional()
    .describe('Filter logs created before this date (ISO 8601 format)'),

  // Sorting (default: createdAt desc)
  sortBy: z
    .enum(['createdAt'])
    .default('createdAt')
    .describe('Field to sort by'),

  sortOrder: z.enum(['asc', 'desc']).default('desc').describe('Sort direction'),

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
    .default(50)
    .describe('Number of items per page'),
});

/**
 * TypeScript type derived from the Zod schema
 */
export type QueryAuditLogsDto = z.infer<typeof queryAuditLogsSchema>;
