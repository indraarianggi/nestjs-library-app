import { z } from 'zod';

/**
 * Zod schema for suspending a member
 * Optional reason field for storing suspension reason
 */
export const suspendMemberSchema = z.object({
  reason: z
    .string()
    .trim()
    .optional()
    .nullable()
    .describe('Optional reason for suspension (stored in notes)'),
});

/**
 * TypeScript type derived from the Zod schema
 */
export type SuspendMemberDto = z.infer<typeof suspendMemberSchema>;
