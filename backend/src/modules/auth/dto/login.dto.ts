import { z } from 'zod';

/**
 * Zod schema for user login validation
 * Simpler than registration - only requires email and password
 */
export const loginSchema = z.object({
  email: z
    .string('Email is required')
    .email('Invalid email format')
    .toLowerCase()
    .describe('Valid email address for authentication'),

  password: z
    .string('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .describe('User password'),
});

/**
 * TypeScript type derived from the Zod schema
 * Used for type checking and IDE autocomplete
 */
export type LoginDto = z.infer<typeof loginSchema>;
