import { z } from 'zod';

/**
 * ISBN regex pattern
 * Validates both ISBN-10 and ISBN-13 formats
 * Supports formats with or without hyphens
 */
const ISBN_REGEX =
  /^(?:ISBN(?:-1[03])?:?\s?)?(?=[0-9X]{10}$|(?=(?:[0-9]+[- ]){3})[- 0-9X]{13}$|97[89][0-9]{10}$|(?=(?:[0-9]+[- ]){4})[- 0-9]{17}$)(?:97[89][- ]?)?[0-9]{1,5}[- ]?[0-9]+[- ]?[0-9]+[- ]?[0-9X]$/;

/**
 * Zod schema for creating a book
 * Validates all required book fields and relationships
 */
export const createBookSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(500, 'Title must not exceed 500 characters')
    .trim()
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
    .min(1, 'ISBN is required')
    .regex(
      ISBN_REGEX,
      'Invalid ISBN format. Must be a valid ISBN-10 or ISBN-13',
    )
    .trim()
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
    .describe('Array of author UUIDs'),

  categoryIds: z
    .array(z.string().uuid('Each category ID must be a valid UUID'))
    .min(1, 'At least one category is required')
    .describe('Array of category UUIDs'),
});

/**
 * TypeScript type derived from the Zod schema
 */
export type CreateBookDto = z.infer<typeof createBookSchema>;
