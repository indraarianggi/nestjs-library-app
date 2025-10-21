import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Setting, Prisma } from '@prisma/client';
import { UpdateSettingsDto } from './dto';

/**
 * SettingsService - Handles system settings management
 * Implements singleton pattern for settings (only one row exists)
 */
@Injectable()
export class SettingsService {
  private readonly logger = new Logger(SettingsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * Get system settings
   * Returns the singleton settings record
   * Admin only endpoint
   *
   * @returns Settings object
   */
  async getSettings(): Promise<Setting> {
    // Get the first (and only) settings record
    const settings = await this.prisma.setting.findFirst();

    // If no settings exist, return default values from Prisma schema
    // This should not happen in production as settings are seeded
    if (!settings) {
      this.logger.warn('No settings found, creating default settings');
      return this.prisma.setting.create({
        data: {},
      });
    }

    return settings;
  }

  /**
   * Update system settings
   * Updates the singleton settings record
   * All fields in UpdateSettingsDto are optional
   * Admin only endpoint
   *
   * @param updateSettingsDto Settings data to update
   * @param userId User ID of the actor (for audit logging)
   * @returns Updated settings object
   */
  async updateSettings(
    updateSettingsDto: UpdateSettingsDto,
    userId: string,
  ): Promise<Setting> {
    // Get current settings for audit log
    const currentSettings = await this.getSettings();

    // Update settings and create audit log in a transaction
    const updatedSettings = await this.prisma.$transaction(async (tx) => {
      // Update the settings
      const updated = await tx.setting.update({
        where: { id: currentSettings.id },
        data: updateSettingsDto,
      });

      // Extract only fields that actually changed
      const changedFields = this.getChangedFields(
        currentSettings,
        updated,
        updateSettingsDto,
      );

      // Create audit log only if there are actual changes
      if (Object.keys(changedFields.before).length > 0) {
        await tx.auditLog.create({
          data: {
            userId,
            action: 'settings.updated',
            entityType: 'Setting',
            entityId: currentSettings.id,
            metadata: {
              before: changedFields.before,
              after: changedFields.after,
              changes: Object.keys(changedFields.before),
            } as Prisma.JsonObject,
          },
        });
      }

      return updated;
    });

    const actualChanges = this.getChangedFields(
      currentSettings,
      updatedSettings,
      updateSettingsDto,
    );
    const changedFieldNames = Object.keys(actualChanges.before);

    if (changedFieldNames.length > 0) {
      this.logger.log(
        `Settings updated by user ${userId}. Changed fields: ${changedFieldNames.join(', ')}`,
      );
    } else {
      this.logger.log(
        `Settings update request by user ${userId} with no actual changes`,
      );
    }

    return updatedSettings;
  }

  /**
   * Get only the fields that actually changed between before and after
   * Compares values and returns only fields with different values
   *
   * @param before Settings object before update
   * @param after Settings object after update
   * @param providedFields DTO fields that were provided in the request
   * @returns Object with before/after values for only the changed fields
   */
  private getChangedFields(
    before: Setting,
    after: Setting,
    providedFields: UpdateSettingsDto,
  ): { before: Record<string, unknown>; after: Record<string, unknown> } {
    const result = {
      before: {} as Record<string, unknown>,
      after: {} as Record<string, unknown>,
    };

    const keys = Object.keys(providedFields) as (keyof UpdateSettingsDto)[];

    for (const key of keys) {
      if (key in before && key in after) {
        const beforeValue = before[key as keyof Setting];
        const afterValue = after[key as keyof Setting];

        // Only include if the value actually changed
        // Use JSON.stringify for reliable comparison across all types
        if (JSON.stringify(beforeValue) !== JSON.stringify(afterValue)) {
          result.before[key] = beforeValue;
          result.after[key] = afterValue;
        }
      }
    }

    return result;
  }
}
