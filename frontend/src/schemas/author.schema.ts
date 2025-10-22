import { z } from 'zod';

export const createAuthorSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must not exceed 200 characters'),
  bio: z.string().optional().nullable(),
});

export const updateAuthorSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must not exceed 200 characters')
    .optional(),
  bio: z.string().optional().nullable(),
});

export type CreateAuthorInput = z.infer<typeof createAuthorSchema>;
export type UpdateAuthorInput = z.infer<typeof updateAuthorSchema>;
