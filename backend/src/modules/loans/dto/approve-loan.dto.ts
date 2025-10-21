import { z } from 'zod';

/**
 * Zod schema for approving or rejecting a loan request
 * Admin must specify action (approve/reject)
 * - For approve: copyId is required
 * - For reject: rejectionReason is optional
 */
export const approveLoanSchema = z
  .object({
    action: z
      .enum(['approve', 'reject'], {
        message: 'Action must be either "approve" or "reject"',
      })
      .describe('Action to perform: approve or reject the loan request'),

    copyId: z
      .string()
      .uuid('Copy ID must be a valid UUID')
      .optional()
      .describe(
        'UUID of the book copy to assign (required for approve action)',
      ),

    rejectionReason: z
      .string()
      .min(1, 'Rejection reason cannot be empty')
      .max(500, 'Rejection reason must be at most 500 characters')
      .optional()
      .describe(
        'Reason for rejecting the loan request (optional for reject action)',
      ),
  })
  .refine(
    (data) => {
      // If action is 'approve', copyId is required
      if (data.action === 'approve' && !data.copyId) {
        return false;
      }
      return true;
    },
    {
      message: 'Copy ID is required when approving a loan',
      path: ['copyId'],
    },
  );

/**
 * TypeScript type derived from the Zod schema
 */
export type ApproveLoanDto = z.infer<typeof approveLoanSchema>;
