import { z } from 'zod';

/**
 * Zod schema for creating a new loan
 * Member provides bookId (required) and optionally copyId
 * If copyId not provided, system auto-selects an available copy
 */
export const createLoanSchema = z.object({
  bookId: z
    .string()
    .uuid('Book ID must be a valid UUID')
    .describe('UUID of the book to borrow'),

  copyId: z
    .string()
    .uuid('Copy ID must be a valid UUID')
    .optional()
    .describe(
      'Optional UUID of specific copy to borrow (auto-selected if not provided)',
    ),
});

/**
 * TypeScript type derived from the Zod schema
 */
export type CreateLoanDto = z.infer<typeof createLoanSchema>;
