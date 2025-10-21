import { Module } from '@nestjs/common';
import { MembersController } from './members.controller';
import { MembersService } from './members.service';

/**
 * MembersModule - Module for member management operations
 * Provides endpoints for admin to manage member profiles and status
 *
 * Features:
 * - List members with pagination, search, and filtering
 * - View member details with statistics
 * - Update member profile information
 * - Activate pending members
 * - Suspend active members
 *
 * All endpoints require ADMIN role.
 */
@Module({
  controllers: [MembersController],
  providers: [MembersService],
  exports: [MembersService],
})
export class MembersModule {}
