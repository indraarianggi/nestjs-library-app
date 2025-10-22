import { z } from 'zod';

export const createLoanSchema = z.object({
  bookId: z.string().uuid('Invalid book ID format'),
  copyId: z.string().uuid('Invalid copy ID format').optional().nullable(),
});

export type CreateLoanInput = z.infer<typeof createLoanSchema>;
