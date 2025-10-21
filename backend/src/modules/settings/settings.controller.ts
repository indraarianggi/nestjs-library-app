import {
  Controller,
  Get,
  Patch,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
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
