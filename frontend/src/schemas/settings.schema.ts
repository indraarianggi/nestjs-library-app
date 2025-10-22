import { z } from 'zod';

export const updateSettingsSchema = z.object({
  approvalsRequired: z.boolean().optional(),
  loanDays: z
    .number()
    .int('Loan days must be a whole number')
    .min(1, 'Loan days must be at least 1')
    .max(90, 'Loan days must not exceed 90')
    .optional(),
  renewalDays: z
    .number()
    .int('Renewal days must be a whole number')
    .min(1, 'Renewal days must be at least 1')
    .max(90, 'Renewal days must not exceed 90')
    .optional(),
  renewalMinDaysBeforeDue: z
    .number()
    .int('Renewal minimum days must be a whole number')
    .min(0, 'Renewal minimum days must be at least 0')
    .max(30, 'Renewal minimum days must not exceed 30')
    .optional(),
  maxRenewals: z
    .number()
    .int('Max renewals must be a whole number')
    .min(0, 'Max renewals must be at least 0')
    .max(10, 'Max renewals must not exceed 10')
    .optional(),
  overdueFeePerDay: z
    .number()
    .min(0, 'Overdue fee per day must be at least 0')
    .optional(),
  overdueFeeCapPerLoan: z
    .number()
    .min(0, 'Overdue fee cap per loan must be at least 0')
    .optional(),
  currency: z
    .enum(['IDR'], {
      message: 'Currency must be IDR',
    })
    .optional(),
  maxConcurrentLoans: z
    .number()
    .int('Max concurrent loans must be a whole number')
    .min(1, 'Max concurrent loans must be at least 1')
    .max(50, 'Max concurrent loans must not exceed 50')
    .optional(),
  notificationsEnabled: z.boolean().optional(),
  dueSoonDays: z
    .number()
    .int('Due soon days must be a whole number')
    .min(1, 'Due soon days must be at least 1')
    .max(14, 'Due soon days must not exceed 14')
    .optional(),
  dueDateNotificationsEnabled: z.boolean().optional(),
  fromEmail: z.string().email('Invalid email format').optional(),
  smtpProvider: z
    .enum(['MAILTRAP'], {
      message: 'SMTP provider must be MAILTRAP',
    })
    .optional(),
  sendHourUTC: z
    .number()
    .int('Send hour UTC must be a whole number')
    .min(0, 'Send hour UTC must be at least 0')
    .max(23, 'Send hour UTC must not exceed 23')
    .optional(),
  timeZone: z.string().optional(),
});

export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
