import { z } from 'zod';
import { CopyStatus } from '@prisma/client';

/**
 * Zod schema for updating a book copy
 * All fields are optional
 */
export const updateCopySchema = z.object({
  status: z
    .nativeEnum(CopyStatus)
    .optional()
    .describe('Copy status (AVAILABLE, ON_LOAN, LOST, DAMAGED)'),

  locationCode: z
    .string()
    .max(50, 'Location code must not exceed 50 characters')
    .trim()
    .optional()
    .nullable()
    .describe('Physical location code for the copy (e.g., shelf number)'),
});

/**
 * TypeScript type derived from the Zod schema
 */
export type UpdateCopyDto = z.infer<typeof updateCopySchema>;
