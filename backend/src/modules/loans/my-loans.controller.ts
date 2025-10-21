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
import { LoansService, PaginatedMyLoansResponse } from './loans.service';
import type { QueryMyLoansDto } from './dto';
import { queryMyLoansSchema } from './dto';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

/**
 * MyLoansController - Handles member's own loan requests
 * Member only - all endpoints require MEMBER role and authentication
 * Routes are prefixed with /my
 */
@ApiTags('My Loans')
@Controller('my/loans')
@UseGuards(RolesGuard)
export class MyLoansController {
  constructor(private readonly loansService: LoansService) {}

  /**
   * GET /api/my/loans (BE-5.8)
   * List current member's loans with sorting and pagination
   * Member only - requires MEMBER role
   *
   * Returns the authenticated member's loans with computed fields:
   * - canRenew: boolean indicating if loan can be renewed
   * - isOverdue: boolean indicating if loan is currently overdue
   * - daysUntilDue: number of days until due (negative if overdue)
   *
   * Automatically filters to current user's loans (from JWT token).
   * Optional filter by status (LoanStatus enum).
   * Supports sorting by: dueDate, borrowedAt, createdAt (default: dueDate asc).
   * Returns loans with book (including authors) and copy details.
   *
   * @param query Query parameters for filtering, sorting, and pagination
   * @param user Current authenticated user (from JWT)
   * @returns Paginated list of member's loans with computed fields
   * @throws 401 if not authenticated
   * @throws 403 if not member
   * @throws 400 for validation errors
   */
  @ApiOperation({
    summary: "Get current member's loans",
    description:
      "Retrieves the authenticated member's loans with computed fields (canRenew, isOverdue, daysUntilDue). Supports filtering by status and sorting. Member only.",
  })
  @ApiBearerAuth('JWT-auth')
  @ApiQuery({
    name: 'status',
    required: false,
    enum: [
      'PENDING',
      'APPROVED',
      'REJECTED',
      'BORROWED',
      'RETURNED',
      'OVERDUE',
      'CANCELLED',
    ],
    description: 'Filter by loan status',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['dueDate', 'borrowedAt', 'createdAt'],
    description: 'Field to sort by (default: dueDate)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort direction (default: asc)',
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
    description: 'Items per page (default: 20, max: 100)',
    example: 20,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: "Member's loans retrieved successfully",
    schema: {
      type: 'object',
      properties: {
        loans: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              memberId: { type: 'string', format: 'uuid' },
              bookCopyId: { type: 'string', format: 'uuid' },
              status: {
                type: 'string',
                enum: [
                  'PENDING',
                  'APPROVED',
                  'REJECTED',
                  'BORROWED',
                  'RETURNED',
                  'OVERDUE',
                  'CANCELLED',
                ],
              },
              requestedAt: { type: 'string', format: 'date-time' },
              approvedAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
              },
              borrowedAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
              },
              dueDate: { type: 'string', format: 'date-time', nullable: true },
              returnedAt: {
                type: 'string',
                format: 'date-time',
                nullable: true,
              },
              renewalCount: { type: 'number', example: 0 },
              overdueFee: { type: 'number', example: 0 },
              rejectionReason: { type: 'string', nullable: true },
              bookCopy: {
                type: 'object',
                properties: {
                  id: { type: 'string', format: 'uuid' },
                  copyNumber: { type: 'string' },
                  book: {
                    type: 'object',
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      title: { type: 'string' },
                      subtitle: { type: 'string', nullable: true },
                      isbn: { type: 'string' },
                      coverImageUrl: { type: 'string', nullable: true },
                      authors: { type: 'array', items: { type: 'object' } },
                    },
                  },
                },
              },
              canRenew: {
                type: 'boolean',
                description: 'Whether loan can be renewed',
              },
              isOverdue: {
                type: 'boolean',
                description: 'Whether loan is overdue',
              },
              daysUntilDue: {
                type: 'number',
                description: 'Days until due (negative if overdue)',
                nullable: true,
              },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            pageSize: { type: 'number', example: 20 },
            totalItems: { type: 'number', example: 5 },
            totalPages: { type: 'number', example: 1 },
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
    description: 'Not authorized (MEMBER only)',
  })
  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(Role.MEMBER)
  async findMyLoans(
    @Query(new ZodValidationPipe(queryMyLoansSchema)) query: QueryMyLoansDto,
    @CurrentUser() user: { userId: string; role: Role },
  ): Promise<PaginatedMyLoansResponse> {
    return this.loansService.findMyLoans(query, user.userId);
  }
}
