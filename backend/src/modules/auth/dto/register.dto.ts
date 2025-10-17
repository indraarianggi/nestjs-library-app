import { z } from 'zod';

/**
 * Zod schema for user registration validation
 * Defines validation rules for email, password, and profile information
 */
export const registerSchema = z.object({
  email: z
    .string('Email is required')
    .email('Invalid email format')
    .toLowerCase()
    .describe('Valid email address for the user account'),

  password: z
    .string('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/\d/, 'Password must contain at least one digit')
    .regex(
      /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
      'Password must contain at least one special character',
    )
    .describe('Password with complexity requirements'),

  firstName: z
    .string('First name is required')
    .min(1, 'First name is required')
    .max(100, 'First name must not exceed 100 characters')
    .describe('Member first name'),

  lastName: z
    .string('Last name is required')
    .min(1, 'Last name is required')
    .max(100, 'Last name must not exceed 100 characters')
    .describe('Member last name'),

  phone: z.string().optional().nullable().describe('Optional phone number'),

  address: z
    .string()
    .optional()
    .nullable()
    .describe('Optional residential address'),
});

/**
 * TypeScript type derived from the Zod schema
 * Used for type checking and IDE autocomplete
 */
export type RegisterDto = z.infer<typeof registerSchema>;

/**
 * Validation errors type for registration
 */
export type ValidationError = {
  field: string;
  message: string;
};
