import { z } from 'zod';
import { CopyStatus } from '@prisma/client';

/**
 * Zod schema for querying book copies
 * Supports pagination and filtering by status
 */
export const queryCopiesSchema = z.object({
  status: z
    .nativeEnum(CopyStatus)
    .optional()
    .describe('Filter by copy status (AVAILABLE, ON_LOAN, LOST, DAMAGED)'),

  page: z.coerce
    .number()
    .int()
    .positive('Page must be a positive integer')
    .default(1)
    .describe('Page number for pagination (default: 1)'),

  pageSize: z.coerce
    .number()
    .int()
    .positive('Page size must be a positive integer')
    .min(1)
    .max(100, 'Page size must not exceed 100')
    .default(20)
    .describe('Number of items per page (default: 20, max: 100)'),
});

/**
 * TypeScript type derived from the Zod schema
 */
export type QueryCopiesDto = z.infer<typeof queryCopiesSchema>;
