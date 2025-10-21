import { z } from 'zod';
import { Currency, SmtpProvider } from '@prisma/client';

/**
 * Zod schema for updating system settings
 * All fields are optional - only provided fields will be updated
 */
export const updateSettingsSchema = z.object({
  approvalsRequired: z
    .boolean()
    .optional()
    .describe('Whether loans require admin approval'),

  loanDays: z
    .number()
    .int('Loan days must be an integer')
    .min(1, 'Loan days must be at least 1')
    .max(90, 'Loan days must not exceed 90')
    .optional()
    .describe('Default loan period in days'),

  renewalDays: z
    .number()
    .int('Renewal days must be an integer')
    .min(1, 'Renewal days must be at least 1')
    .max(90, 'Renewal days must not exceed 90')
    .optional()
    .describe('Extension period for renewals in days'),

  renewalMinDaysBeforeDue: z
    .number()
    .int('Renewal min days before due must be an integer')
    .min(0, 'Renewal min days before due must be at least 0')
    .max(30, 'Renewal min days before due must not exceed 30')
    .optional()
    .describe('Minimum days before due date to request renewal'),

  maxRenewals: z
    .number()
    .int('Max renewals must be an integer')
    .min(0, 'Max renewals must be at least 0')
    .max(10, 'Max renewals must not exceed 10')
    .optional()
    .describe('Maximum number of renewals per loan'),

  overdueFeePerDay: z
    .number()
    .min(0, 'Overdue fee per day must be non-negative')
    .optional()
    .describe('Overdue penalty per day'),

  overdueFeeCapPerLoan: z
    .number()
    .min(0, 'Overdue fee cap per loan must be non-negative')
    .optional()
    .describe('Maximum overdue penalty per loan'),

  currency: z.nativeEnum(Currency).optional().describe('Currency for fees'),

  maxConcurrentLoans: z
    .number()
    .int('Max concurrent loans must be an integer')
    .min(1, 'Max concurrent loans must be at least 1')
    .max(50, 'Max concurrent loans must not exceed 50')
    .optional()
    .describe('Maximum number of concurrent active loans per member'),

  notificationsEnabled: z
    .boolean()
    .optional()
    .describe('Whether email notifications are enabled'),

  dueSoonDays: z
    .number()
    .int('Due soon days must be an integer')
    .min(1, 'Due soon days must be at least 1')
    .max(14, 'Due soon days must not exceed 14')
    .optional()
    .describe('Days before due date to send reminder notification'),

  dueDateNotificationsEnabled: z
    .boolean()
    .optional()
    .describe('Whether due date reminder notifications are enabled'),

  fromEmail: z
    .string()
    .email('From email must be a valid email address')
    .max(255, 'From email must not exceed 255 characters')
    .optional()
    .describe('Email address to send notifications from'),

  smtpProvider: z
    .nativeEnum(SmtpProvider)
    .optional()
    .describe('SMTP email provider'),

  sendHourUTC: z
    .number()
    .int('Send hour UTC must be an integer')
    .min(0, 'Send hour UTC must be at least 0')
    .max(23, 'Send hour UTC must not exceed 23')
    .optional()
    .describe('Hour in UTC to send scheduled notifications'),

  timeZone: z
    .string()
    .max(255, 'Time zone must not exceed 255 characters')
    .optional()
    .describe('Time zone for scheduling'),
});

/**
 * TypeScript type derived from the Zod schema
 */
export type UpdateSettingsDto = z.infer<typeof updateSettingsSchema>;
