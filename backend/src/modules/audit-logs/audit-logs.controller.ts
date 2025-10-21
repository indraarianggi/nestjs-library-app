import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
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
@ApiTags('Audit Logs')
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
  @ApiOperation({
    summary: 'List audit logs',
    description:
      'Retrieves system audit trail with filtering by user, action, entity, and date range. Returns paginated results with audit log details. Admin only.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiQuery({
    name: 'userId',
    required: false,
    type: String,
    format: 'uuid',
    description: 'Filter by user ID',
  })
  @ApiQuery({
    name: 'action',
    required: false,
    type: String,
    description: 'Filter by action (e.g., "book.created", "loan.approved")',
    example: 'book.created',
  })
  @ApiQuery({
    name: 'entityType',
    required: false,
    type: String,
    description: 'Filter by entity type (e.g., "Book", "Loan", "Member")',
    example: 'Book',
  })
  @ApiQuery({
    name: 'entityId',
    required: false,
    type: String,
    format: 'uuid',
    description: 'Filter by entity ID',
  })
  @ApiQuery({
    name: 'dateFrom',
    required: false,
    type: String,
    format: 'date-time',
    description: 'Filter logs created after this date (ISO 8601 format)',
    example: '2024-01-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'dateTo',
    required: false,
    type: String,
    format: 'date-time',
    description: 'Filter logs created before this date (ISO 8601 format)',
    example: '2024-12-31T23:59:59Z',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['createdAt'],
    description: 'Field to sort by (default: createdAt)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort direction (default: desc)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Items per page (default: 50, max: 100)',
    example: 50,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Audit logs retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        logs: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              userId: { type: 'string', format: 'uuid' },
              action: { type: 'string', example: 'book.created' },
              entityType: { type: 'string', example: 'Book' },
              entityId: { type: 'string', format: 'uuid' },
              changes: {
                type: 'object',
                nullable: true,
                description: 'JSON object containing the changes made',
              },
              ipAddress: {
                type: 'string',
                nullable: true,
                example: '192.168.1.1',
              },
              userAgent: { type: 'string', nullable: true },
              createdAt: { type: 'string', format: 'date-time' },
              user: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  email: { type: 'string', format: 'email' },
                  role: { type: 'string', enum: ['ADMIN', 'MEMBER'] },
                },
              },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            pageSize: { type: 'number', example: 50 },
            totalItems: { type: 'number', example: 250 },
            totalPages: { type: 'number', example: 5 },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid query parameters',
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
  async findAll(
    @Query(new ZodValidationPipe(queryAuditLogsSchema))
    query: QueryAuditLogsDto,
  ): Promise<PaginatedAuditLogsResponse> {
    return this.auditLogsService.findAll(query);
  }
}
