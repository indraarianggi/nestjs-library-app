import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  AuditLogsService,
  PaginatedAuditLogsResponse,
} from './audit-logs.service';
import type { QueryAuditLogsDto } from './dto';
import { queryAuditLogsSchema } from './dto';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

/**
 * AuditLogsController - Handles HTTP requests for audit log viewing
 * Admin only - all endpoints require ADMIN role and authentication
 */
@Controller('audit-logs')
@UseGuards(RolesGuard)
export class AuditLogsController {
  constructor(private readonly auditLogsService: AuditLogsService) {}

  /**
   * GET /api/audit-logs (BE-7.1)
   * List all audit logs with filtering, sorting, and pagination
   * Admin only - requires ADMIN role
   *
   * Allows admin to view system audit trail with various filtering options:
   * - Filter by userId (UUID)
   * - Filter by action (string, e.g., 'book.created')
   * - Filter by entityType (string, e.g., 'Book')
   * - Filter by entityId (UUID)
   * - Filter by dateFrom (ISO date-time)
   * - Filter by dateTo (ISO date-time)
   *
   * Supports sorting by: createdAt (default: desc)
   * Returns paginated results with audit log details and user information.
   *
   * @param query Query parameters for filtering, sorting, and pagination
   * @returns Paginated list of audit logs with user details
   * @throws 401 if not authenticated
   * @throws 403 if not admin
   * @throws 400 for validation errors
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  async findAll(
    @Query(new ZodValidationPipe(queryAuditLogsSchema))
    query: QueryAuditLogsDto,
  ): Promise<PaginatedAuditLogsResponse> {
    return this.auditLogsService.findAll(query);
  }
}
