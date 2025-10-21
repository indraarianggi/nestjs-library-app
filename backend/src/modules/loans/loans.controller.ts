import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  LoansService,
  LoanWithRelations,
  PaginatedLoansResponse,
} from './loans.service';
import type { CreateLoanDto, ApproveLoanDto, QueryLoansDto } from './dto';
import { createLoanSchema, approveLoanSchema, queryLoansSchema } from './dto';
import { Role } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

/**
 * LoansController - Handles HTTP requests for loan management
 * Member only - all endpoints require MEMBER role and authentication
 */
@Controller('loans')
@UseGuards(RolesGuard)
export class LoansController {
  constructor(private readonly loansService: LoansService) {}

  /**
   * GET /api/loans (BE-5.7)
   * List all loans with filtering, sorting, and pagination
   * Admin only - requires ADMIN role
   *
   * Allows admin to view all loans in the system with various filtering options:
   * - Filter by status (LoanStatus enum)
   * - Filter by member (memberId)
   * - Filter by book (bookId)
   * - Filter by due date range (dueBefore, dueAfter)
   *
   * Supports sorting by: dueDate, borrowedAt, createdAt, status (default: dueDate asc)
   * Returns paginated results with loan, user (with memberProfile), book, and copy details.
   *
   * @param query Query parameters for filtering, sorting, and pagination
   * @param user Current authenticated user (from JWT)
   * @returns Paginated list of loans with relations
   * @throws 401 if not authenticated
   * @throws 403 if not admin
   * @throws 400 for validation errors
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  async findAllLoans(
    @Query(new ZodValidationPipe(queryLoansSchema)) query: QueryLoansDto,
  ): Promise<PaginatedLoansResponse> {
    return this.loansService.findAllLoans(query);
  }

  /**
   * POST /api/loans (BE-5.2 & BE-5.3)
   * Create a new loan (borrow a book)
   * Member only - requires MEMBER role
   *
   * Creates a new loan for the authenticated member. Validates:
   * - Member is active (not suspended or pending)
   * - Book has available copies
   * - Member has not exceeded concurrent loan limit
   * - Member has no overdue loans or unpaid penalties
   *
   * If approvals are required (system setting), loan is created in REQUESTED status
   * and requires admin approval. Otherwise, loan is auto-approved to APPROVED status.
   *
   * Copy Assignment:
   * - If copyId provided: validates that specific copy is available and belongs to the book
   * - If copyId NOT provided: system auto-selects first available copy
   *
   * Sets due date based on loan policy (loanDays setting).
   * Sends loan created/approved notification email.
   *
   * @param createLoanDto Loan creation data (bookId, optional copyId)
   * @param user Current authenticated user (from JWT)
   * @returns Created loan with book and copy relations
   * @throws 400 for validation errors
   * @throws 403 for suspended members or max loans exceeded
   * @throws 404 if book not found
   * @throws 409 if no available copies
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.MEMBER)
  async createLoan(
    @Body(new ZodValidationPipe(createLoanSchema))
    createLoanDto: CreateLoanDto,
    @CurrentUser() user: { userId: string; role: Role },
  ): Promise<{ loan: LoanWithRelations }> {
    const loan = await this.loansService.createLoan(createLoanDto, user.userId);
    return { loan };
  }

  /**
   * POST /api/loans/:loanId/approve-reject (BE-5.4)
   * Approve or reject a pending loan request
   * Admin only - requires ADMIN role
   *
   * Admin can approve or reject loans with status=REQUESTED.
   *
   * For approval:
   * - Admin must provide copyId to assign
   * - Validates copy is available and belongs to the book
   * - Re-validates member eligibility (race condition check)
   * - Sets borrowedAt and dueDate
   * - Updates copy status to ON_LOAN
   * - Sends approval email to member
   *
   * For rejection:
   * - Optional rejectionReason can be provided
   * - Copy remains AVAILABLE
   * - Sends rejection email to member with reason
   *
   * Business rules:
   * - Only loans with status=REQUESTED can be approved/rejected
   * - On approval, copy must be AVAILABLE with no open loans
   * - Rejection is permanent (member must create new request)
   *
   * @param loanId Loan ID to approve/reject
   * @param approveLoanDto Approval/rejection data
   * @param user Current authenticated user (from JWT)
   * @returns Updated loan with book and copy relations
   * @throws 400 for validation errors
   * @throws 403 if not admin or member no longer eligible
   * @throws 404 if loan not found
   * @throws 409 if loan status is not REQUESTED or copy unavailable
   */
  @Post(':loanId/approve-reject')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  async approveLoan(
    @Param('loanId') loanId: string,
    @Body(new ZodValidationPipe(approveLoanSchema))
    approveLoanDto: ApproveLoanDto,
    @CurrentUser() user: { userId: string; role: Role },
  ): Promise<{ loan: LoanWithRelations }> {
    const loan = await this.loansService.approveLoan(
      loanId,
      approveLoanDto,
      user.userId,
    );
    return { loan };
  }

  /**
   * POST /api/loans/:loanId/renew (BE-5.5)
   * Renew an active loan
   * Member (loan owner) or Admin can renew
   *
   * Renews an active loan by extending the due date.
   *
   * Business rules:
   * - Member can only renew own loans (unless admin)
   * - Loan status must be ACTIVE
   * - renewalCount must be less than maxRenewals (from settings)
   * - No overdue penalty on the loan
   * - Member must not have other overdue loans (for members only)
   * - Member must have ACTIVE status (not suspended)
   * - Due date is extended by loanDays (from current due date)
   * - renewalCount is incremented
   *
   * @param loanId Loan ID to renew
   * @param user Current authenticated user (from JWT)
   * @returns Updated loan with book and copy relations
   * @throws 403 if not authorized
   * @throws 404 if loan not found
   * @throws 409 if renewal is not allowed
   */
  @Post(':loanId/renew')
  @HttpCode(HttpStatus.OK)
  async renewLoan(
    @Param('loanId') loanId: string,
    @CurrentUser() user: { userId: string; role: Role },
  ): Promise<{ loan: LoanWithRelations }> {
    const loan = await this.loansService.renewLoan(
      loanId,
      user.userId,
      user.role,
    );
    return { loan };
  }

  /**
   * POST /api/loans/:loanId/cancel (BE-5.6)
   * Cancel a pending or approved loan
   * Member (loan owner) or Admin can cancel
   *
   * Cancels a loan that has not yet become active.
   *
   * Business rules:
   * - Member can only cancel own loans (unless admin)
   * - Only REQUESTED or APPROVED loans can be cancelled
   * - Cannot cancel ACTIVE, RETURNED, CANCELLED, or OVERDUE loans
   * - Loan status is set to CANCELLED
   * - Copy status is set back to AVAILABLE
   * - Audit log entry is created
   *
   * @param loanId Loan ID to cancel
   * @param user Current authenticated user (from JWT)
   * @returns Updated loan with book and copy relations
   * @throws 403 if not authorized
   * @throws 404 if loan not found
   * @throws 409 if loan status doesn't allow cancellation
   */
  @Post(':loanId/cancel')
  @HttpCode(HttpStatus.OK)
  async cancelLoan(
    @Param('loanId') loanId: string,
    @CurrentUser() user: { userId: string; role: Role },
  ): Promise<{ loan: LoanWithRelations }> {
    const loan = await this.loansService.cancelLoan(
      loanId,
      user.userId,
      user.role,
    );
    return { loan };
  }

  /**
   * POST /api/loans/:loanId/checkout (BE-5.4.5)
   * Checkout/pickup an approved loan
   * Admin only
   *
   * Marks an approved loan as active when the member physically picks up the book.
   * Transitions loan status from APPROVED to ACTIVE.
   *
   * Business rules:
   * - Only loans with status=APPROVED can be checked out
   * - This represents the physical handoff of the book to the member
   * - Member must still be eligible (ACTIVE status) at time of checkout
   * - borrowedAt and dueDate are already set during approval, do not modify them
   * - Copy status should already be ON_LOAN from approval, just validate it
   *
   * @param loanId Loan ID to checkout
   * @param user Current authenticated user (from JWT)
   * @returns Updated loan with book and copy relations and success message
   * @throws 403 if not admin
   * @throws 404 if loan not found
   * @throws 409 if loan is not in APPROVED status or member is suspended
   */
  @Post(':loanId/checkout')
  @HttpCode(HttpStatus.OK)
  @Roles(Role.ADMIN)
  async checkoutLoan(
    @Param('loanId') loanId: string,
    @CurrentUser() user: { userId: string; role: Role },
  ): Promise<{ loan: LoanWithRelations; message: string }> {
    const { loan, message } = await this.loansService.checkoutLoan(
      loanId,
      user.userId,
    );
    return { loan, message };
  }

  /**
   * POST /api/loans/:loanId/return (BE-5.6-ALT)
   * Return a borrowed book
   * Member (loan owner) or Admin can return
   *
   * Marks a loan as returned, calculates overdue penalty, and updates copy status.
   *
   * Business rules:
   * - Member can only return own loans (unless admin)
   * - Only ACTIVE or OVERDUE loans can be returned
   * - REQUESTED/APPROVED loans should be cancelled instead
   * - Penalty calculation:
   *   - overdueDays = max(0, ceil((returnDate - dueDate) / 1 day))
   *   - penalty = min(overdueDays * overdueFeePerDay, overdueFeeCapPerLoan)
   * - Loan status set to RETURNED with returnedAt timestamp
   * - Copy status set to AVAILABLE
   * - Penalty amount stored in penaltyAccrued
   * - Audit log entry created
   * - Email notification sent (includes penalty if > 0)
   *
   * @param loanId Loan ID to return
   * @param user Current authenticated user (from JWT)
   * @returns Updated loan with book and copy relations, plus success message
   * @throws 403 if not authorized
   * @throws 404 if loan not found
   * @throws 409 if loan already returned or status doesn't allow return
   */
  @Post(':loanId/return')
  @HttpCode(HttpStatus.OK)
  async returnLoan(
    @Param('loanId') loanId: string,
    @CurrentUser() user: { userId: string; role: Role },
  ): Promise<{ loan: LoanWithRelations; message: string }> {
    const { loan, message } = await this.loansService.returnLoan(
      loanId,
      user.userId,
      user.role,
    );
    return { loan, message };
  }
}
