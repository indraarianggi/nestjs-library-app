import {
  Controller,
  Get,
  Patch,
  Post,
  Param,
  Query,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import {
  MembersService,
  PaginatedMembers,
  MemberDetail,
} from './members.service';
import type { UpdateMemberDto, SuspendMemberDto } from './dto';
import {
  queryMembersSchema,
  updateMemberSchema,
  suspendMemberSchema,
} from './dto';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

/**
 * MembersController - Handles HTTP requests for member management
 * All endpoints are admin-only and require authentication
 * Implements list, detail, update, activate, and suspend operations
 */
@ApiTags('Members')
@ApiBearerAuth('JWT-auth')
@Controller('members')
@UseGuards(RolesGuard)
@Roles(Role.ADMIN)
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  /**
   * GET /api/members
   * List all members with pagination, search, and filtering
   * Admin only - requires authentication and ADMIN role
   *
   * Returns member list with statistics:
   * - Active loans count (APPROVED, ACTIVE, OVERDUE)
   * - Total loans count (all statuses)
   *
   * Query parameters:
   * - q: Search by firstName, lastName, email (case-insensitive, partial match)
   * - status: Filter by membership status (PENDING, ACTIVE, SUSPENDED)
   * - sortBy: Field to sort by (firstName, lastName, email, createdAt)
   * - sortOrder: Sort direction (asc, desc)
   * - page: Page number (1-indexed, default 1)
   * - pageSize: Items per page (default 20, max 100)
   *
   * @param queryParams Query parameters for filtering, sorting, and pagination
   * @returns Paginated list of members with statistics
   */
  @ApiOperation({
    summary: 'List all members',
    description:
      'Retrieves a paginated list of members with loan statistics. Admin only.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'pageSize', required: false, type: Number })
  @ApiQuery({
    name: 'q',
    required: false,
    type: String,
    description: 'Search by name or email',
  })
  @ApiQuery({
    name: 'status',
    required: false,
    enum: ['PENDING', 'ACTIVE', 'SUSPENDED', 'EXPIRED'],
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['firstName', 'lastName', 'email', 'createdAt'],
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['asc', 'desc'] })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Members retrieved successfully',
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
  async findAll(
    @Query() queryParams: Record<string, any>,
  ): Promise<PaginatedMembers> {
    // Validate query parameters
    const validationResult = queryMembersSchema.safeParse(queryParams);
    if (!validationResult.success) {
      const errors = validationResult.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      throw new BadRequestException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Validation failed',
        errors,
      });
    }

    return this.membersService.findAll(validationResult.data);
  }

  /**
   * GET /api/members/:id
   * Get detailed information about a specific member
   * Admin only - requires authentication and ADMIN role
   *
   * Returns full member profile including:
   * - User data (id, email, role, isActive, lastLoginAt)
   * - Member profile data (firstName, lastName, phone, address, status, notes)
   * - Active loans count (APPROVED, ACTIVE, OVERDUE)
   * - Total loans count (all statuses)
   * - Outstanding penalties (sum of penaltyAccrued for active/overdue loans)
   *
   * @param id Member profile UUID
   * @returns Member detail with statistics
   * @throws 404 if member not found
   */
  @ApiOperation({
    summary: 'Get member details',
    description:
      'Retrieves detailed information about a specific member. Admin only.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Member profile UUID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Member retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Member not found',
  })
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string): Promise<MemberDetail> {
    return this.membersService.findOne(id);
  }

  /**
   * PATCH /api/members/:id
   * Update member profile information
   * Admin only - requires authentication and ADMIN role
   *
   * Updatable fields:
   * - firstName, lastName, phone, address, notes
   *
   * Note: Email and status changes not allowed.
   * Use dedicated endpoints for status changes:
   * - POST /api/members/:id/activate (PENDING -> ACTIVE)
   * - POST /api/members/:id/suspend (ACTIVE -> SUSPENDED)
   *
   * Creates audit log entry with before/after values.
   *
   * @param id Member profile UUID
   * @param updateMemberDto Member data to update
   * @param user Current authenticated user (from JWT)
   * @returns Updated member detail
   * @throws 404 if member not found
   * @throws 400 for validation errors
   */
  @ApiOperation({
    summary: 'Update member profile',
    description: 'Updates member profile information. Admin only.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Member profile UUID',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        firstName: { type: 'string', maxLength: 100 },
        lastName: { type: 'string', maxLength: 100 },
        phone: { type: 'string', nullable: true },
        address: { type: 'string', nullable: true },
        notes: { type: 'string', nullable: true },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Member updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Member not found',
  })
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateMemberSchema))
    updateMemberDto: UpdateMemberDto,
    @CurrentUser() user: { userId: string; role: Role },
  ): Promise<{ member: MemberDetail; message: string }> {
    const member = await this.membersService.update(
      id,
      updateMemberDto,
      user.userId,
    );
    return {
      member,
      message: 'Member profile updated successfully',
    };
  }

  /**
   * POST /api/members/:id/activate
   * Activate a pending member
   * Admin only - requires authentication and ADMIN role
   *
   * Changes membership status from PENDING to ACTIVE.
   * Once activated, member can borrow books immediately.
   *
   * Business rules:
   * - Member must be in PENDING status
   * - Returns 409 if member already active
   *
   * Sends activation notification email to member.
   * Creates audit log entry with status change.
   *
   * @param id Member profile UUID
   * @param user Current authenticated user (from JWT)
   * @returns Updated member detail
   * @throws 404 if member not found
   * @throws 409 if member already active
   */
  @ApiOperation({
    summary: 'Activate a member',
    description: 'Changes member status from PENDING to ACTIVE. Admin only.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Member profile UUID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Member activated successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Member not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Member already active',
  })
  @Post(':id/activate')
  @HttpCode(HttpStatus.OK)
  async activate(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; role: Role },
  ): Promise<{ member: MemberDetail; message: string }> {
    const member = await this.membersService.activate(id, user.userId);
    return {
      member,
      message: 'Member activated successfully',
    };
  }

  /**
   * POST /api/members/:id/suspend
   * Suspend an active member
   * Admin only - requires authentication and ADMIN role
   *
   * Changes membership status from ACTIVE to SUSPENDED.
   * Suspended members cannot:
   * - Create new loans (borrow books)
   * - Renew existing loans
   *
   * Active loans remain valid but must be returned.
   *
   * Business rules:
   * - Member must be in ACTIVE status
   * - Returns 409 if member already suspended
   * - Optional reason stored in notes field
   *
   * Sends suspension notification email to member.
   * Creates audit log entry with status change and reason.
   *
   * @param id Member profile UUID
   * @param suspendDto Suspension data (optional reason)
   * @param user Current authenticated user (from JWT)
   * @returns Updated member detail
   * @throws 404 if member not found
   * @throws 409 if member already suspended
   */
  @ApiOperation({
    summary: 'Suspend a member',
    description: 'Changes member status from ACTIVE to SUSPENDED. Admin only.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Member profile UUID',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        reason: {
          type: 'string',
          nullable: true,
          description: 'Reason for suspension',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Member suspended successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Member not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Member already suspended',
  })
  @Post(':id/suspend')
  @HttpCode(HttpStatus.OK)
  async suspend(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(suspendMemberSchema))
    suspendDto: SuspendMemberDto,
    @CurrentUser() user: { userId: string; role: Role },
  ): Promise<{ member: MemberDetail; message: string }> {
    const member = await this.membersService.suspend(
      id,
      suspendDto,
      user.userId,
    );
    return {
      member,
      message: 'Member suspended successfully',
    };
  }
}
