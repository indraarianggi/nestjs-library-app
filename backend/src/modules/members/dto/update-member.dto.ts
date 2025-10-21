import { z } from 'zod';

/**
 * Zod schema for updating member profile
 * All fields are optional
 * Email and status changes not allowed (use dedicated endpoints)
 */
export const updateMemberSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must not exceed 100 characters')
    .trim()
    .optional()
    .describe("Member's first name"),

  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must not exceed 100 characters')
    .trim()
    .optional()
    .describe("Member's last name"),

  phone: z
    .string()
    .trim()
    .optional()
    .nullable()
    .describe("Member's phone number"),

  address: z.string().trim().optional().nullable().describe("Member's address"),

  notes: z
    .string()
    .trim()
    .optional()
    .nullable()
    .describe('Admin-only notes about the member'),
});

/**
 * TypeScript type derived from the Zod schema
 */
export type UpdateMemberDto = z.infer<typeof updateMemberSchema>;
