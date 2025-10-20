import { z } from 'zod';

/**
 * Zod schema for creating an author
 * Validates author name (required, unique) and bio (optional)
 */
export const createAuthorSchema = z.object({
  name: z
    .string('Name is required')
    .min(1, 'Name is required')
    .max(200, 'Name must not exceed 200 characters')
    .trim()
    .describe("Author's full name (unique)"),

  bio: z
    .string()
    .max(2000, 'Bio must not exceed 2000 characters')
    .trim()
    .optional()
    .nullable()
    .describe("Author's biography"),
});

/**
 * TypeScript type derived from the Zod schema
 */
export type CreateAuthorDto = z.infer<typeof createAuthorSchema>;
