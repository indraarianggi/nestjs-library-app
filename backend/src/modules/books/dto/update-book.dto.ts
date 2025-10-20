import { z } from 'zod';

/**
 * ISBN regex pattern
 * Validates both ISBN-10 and ISBN-13 formats
 * Supports formats with or without hyphens
 */
const ISBN_REGEX =
  /^(?:ISBN(?:-1[03])?:?\s?)?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/;

/**
 * Zod schema for updating a book
 * All fields are optional for partial updates
 */
export const updateBookSchema = z.object({
  title: z
    .string()
    .min(1, 'Title cannot be empty')
    .max(500, 'Title must not exceed 500 characters')
    .trim()
    .optional()
    .describe('Book title'),

  subtitle: z
    .string()
    .max(500, 'Subtitle must not exceed 500 characters')
    .trim()
    .optional()
    .nullable()
    .describe('Book subtitle'),

  description: z
    .string()
    .trim()
    .optional()
    .nullable()
    .describe('Book description'),

  isbn: z
    .string()
    .min(1, 'ISBN cannot be empty')
    .regex(
      ISBN_REGEX,
      'Invalid ISBN format. Must be a valid ISBN-10 or ISBN-13',
    )
    .trim()
    .optional()
    .describe('International Standard Book Number (ISBN-10 or ISBN-13)'),

  publicationYear: z
    .number()
    .int('Publication year must be an integer')
    .min(1000, 'Publication year must be 1000 or later')
    .max(
      new Date().getFullYear(),
      `Publication year cannot be later than ${new Date().getFullYear()}`,
    )
    .optional()
    .nullable()
    .describe('Year the book was published'),

  language: z
    .string()
    .max(50, 'Language must not exceed 50 characters')
    .trim()
    .optional()
    .nullable()
    .describe('Language of the book'),

  coverImageUrl: z
    .string()
    .url('Cover image URL must be a valid URL')
    .trim()
    .optional()
    .nullable()
    .describe('URL to the book cover image'),

  authorIds: z
    .array(z.string().uuid('Each author ID must be a valid UUID'))
    .min(1, 'At least one author is required')
    .optional()
    .describe('Array of author UUIDs to replace existing relationships'),

  categoryIds: z
    .array(z.string().uuid('Each category ID must be a valid UUID'))
    .min(1, 'At least one category is required')
    .optional()
    .describe('Array of category UUIDs to replace existing relationships'),
});

/**
 * TypeScript type derived from the Zod schema
 */
export type UpdateBookDto = z.infer<typeof updateBookSchema>;
