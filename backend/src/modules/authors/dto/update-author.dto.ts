import { z } from 'zod';

/**
 * Zod schema for updating an author
 * All fields are optional for partial updates
 */
export const updateAuthorSchema = z.object({
  name: z
    .string()
    .min(1, 'Name cannot be empty')
    .max(200, 'Name must not exceed 200 characters')
    .trim()
    .optional()
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
export type UpdateAuthorDto = z.infer<typeof updateAuthorSchema>;
