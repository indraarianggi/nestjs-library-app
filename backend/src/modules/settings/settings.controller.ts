import {
  Controller,
  Get,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import type { UpdateSettingsDto } from './dto';
import { updateSettingsSchema } from './dto';
import { Role, Setting } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

/**
 * SettingsController - Handles HTTP requests for system settings management
 * Admin only - all endpoints require ADMIN role
 */
@ApiTags('Settings')
@Controller('settings')
@UseGuards(RolesGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  /**
   * GET /api/settings
   * Get current system settings
   * Admin only
   *
   * Returns all system configuration including borrowing policy,
   * notification settings, and operational parameters.
   *
   * @returns Settings object
   */
  @ApiOperation({
    summary: 'Get system settings',
    description:
      'Retrieves current system configuration including borrowing policy, notification settings, and operational parameters. Admin only.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        approvalsRequired: { type: 'boolean', example: false },
        loanDays: { type: 'number', example: 14 },
        renewalDays: { type: 'number', example: 7 },
        renewalMinDaysBeforeDue: { type: 'number', example: 3 },
        maxRenewals: { type: 'number', example: 2 },
        overdueFeePerDay: { type: 'number', example: 1.0 },
        overdueFeeCapPerLoan: { type: 'number', example: 50.0 },
        currency: {
          type: 'string',
          enum: ['USD', 'EUR', 'GBP', 'IDR'],
          example: 'USD',
        },
        maxConcurrentLoans: { type: 'number', example: 5 },
        notificationsEnabled: { type: 'boolean', example: true },
        dueSoonDays: { type: 'number', example: 3 },
        dueDateNotificationsEnabled: { type: 'boolean', example: true },
        fromEmail: {
          type: 'string',
          format: 'email',
          example: 'noreply@library.com',
        },
        smtpProvider: {
          type: 'string',
          enum: ['GMAIL', 'SENDGRID', 'MAILGUN', 'CUSTOM'],
          example: 'GMAIL',
        },
        sendHourUTC: { type: 'number', example: 9 },
        timeZone: { type: 'string', example: 'UTC' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Not authorized (ADMIN only)',
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  async getSettings(): Promise<Setting> {
    return this.settingsService.getSettings();
  }

  /**
   * PATCH /api/settings
   * Update system settings
   * Admin only
   *
   * Updates system configuration. All fields are optional.
   * Changes are logged in audit logs.
   * Changes to notification settings take effect immediately.
   * Changes to borrowing policy apply to new loans only (existing loans retain original terms).
   *
   * @param updateSettingsDto Settings data to update
   * @param user Current authenticated user (from JWT)
   * @returns Updated settings object
   */
  @ApiOperation({
    summary: 'Update system settings',
    description:
      'Updates system configuration. All fields are optional. Changes are logged and take effect based on the setting type. Admin only.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({
    description: 'Settings data to update (all fields optional)',
    schema: {
      type: 'object',
      properties: {
        approvalsRequired: {
          type: 'boolean',
          description: 'Whether loans require admin approval',
          example: false,
        },
        loanDays: {
          type: 'number',
          minimum: 1,
          maximum: 90,
          description: 'Default loan period in days',
          example: 14,
        },
        renewalDays: {
          type: 'number',
          minimum: 1,
          maximum: 90,
          description: 'Extension period for renewals in days',
          example: 7,
        },
        renewalMinDaysBeforeDue: {
          type: 'number',
          minimum: 0,
          maximum: 30,
          description: 'Minimum days before due date to request renewal',
          example: 3,
        },
        maxRenewals: {
          type: 'number',
          minimum: 0,
          maximum: 10,
          description: 'Maximum number of renewals per loan',
          example: 2,
        },
        overdueFeePerDay: {
          type: 'number',
          minimum: 0,
          description: 'Overdue penalty per day',
          example: 1.0,
        },
        overdueFeeCapPerLoan: {
          type: 'number',
          minimum: 0,
          description: 'Maximum overdue penalty per loan',
          example: 50.0,
        },
        currency: {
          type: 'string',
          enum: ['USD', 'EUR', 'GBP', 'IDR'],
          description: 'Currency for fees',
          example: 'USD',
        },
        maxConcurrentLoans: {
          type: 'number',
          minimum: 1,
          maximum: 50,
          description: 'Maximum number of concurrent active loans per member',
          example: 5,
        },
        notificationsEnabled: {
          type: 'boolean',
          description: 'Whether email notifications are enabled',
          example: true,
        },
        dueSoonDays: {
          type: 'number',
          minimum: 1,
          maximum: 14,
          description: 'Days before due date to send reminder notification',
          example: 3,
        },
        dueDateNotificationsEnabled: {
          type: 'boolean',
          description: 'Whether due date reminder notifications are enabled',
          example: true,
        },
        fromEmail: {
          type: 'string',
          format: 'email',
          maxLength: 255,
          description: 'Email address to send notifications from',
          example: 'noreply@library.com',
        },
        smtpProvider: {
          type: 'string',
          enum: ['GMAIL', 'SENDGRID', 'MAILGUN', 'CUSTOM'],
          description: 'SMTP email provider',
          example: 'GMAIL',
        },
        sendHourUTC: {
          type: 'number',
          minimum: 0,
          maximum: 23,
          description: 'Hour in UTC to send scheduled notifications',
          example: 9,
        },
        timeZone: {
          type: 'string',
          maxLength: 255,
          description: 'Time zone for scheduling',
          example: 'UTC',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Settings updated successfully',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        approvalsRequired: { type: 'boolean' },
        loanDays: { type: 'number' },
        renewalDays: { type: 'number' },
        renewalMinDaysBeforeDue: { type: 'number' },
        maxRenewals: { type: 'number' },
        overdueFeePerDay: { type: 'number' },
        overdueFeeCapPerLoan: { type: 'number' },
        currency: { type: 'string', enum: ['USD', 'EUR', 'GBP', 'IDR'] },
        maxConcurrentLoans: { type: 'number' },
        notificationsEnabled: { type: 'boolean' },
        dueSoonDays: { type: 'number' },
        dueDateNotificationsEnabled: { type: 'boolean' },
        fromEmail: { type: 'string', format: 'email' },
        smtpProvider: {
          type: 'string',
          enum: ['GMAIL', 'SENDGRID', 'MAILGUN', 'CUSTOM'],
        },
        sendHourUTC: { type: 'number' },
        timeZone: { type: 'string' },
        createdAt: { type: 'string', format: 'date-time' },
        updatedAt: { type: 'string', format: 'date-time' },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Not authorized (ADMIN only)',
  })
  @Patch()
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  async updateSettings(
    @Body(new ZodValidationPipe(updateSettingsSchema))
    updateSettingsDto: UpdateSettingsDto,
    @CurrentUser() user: { userId: string; role: Role },
  ): Promise<Setting> {
    return this.settingsService.updateSettings(updateSettingsDto, user.userId);
  }
}
