import { SetMetadata } from '@nestjs/common';
import { Role } from '@prisma/client';

/**
 * Metadata key for required roles
 */
export const ROLES_KEY = 'roles';

/**
 * Roles decorator - Set required roles for route access
 * Used with RolesGuard to enforce role-based access control
 * Must be used after JwtAuthGuard to ensure user is authenticated
 *
 * @param roles Array of roles that are allowed to access the route
 *
 * @example
 * ```typescript
 * @Roles('ADMIN')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * @Get('admin-only')
 * adminRoute() {
 *   return 'Admin only content';
 * }
 * ```
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
