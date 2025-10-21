import {
  Controller,
  Get,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
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
