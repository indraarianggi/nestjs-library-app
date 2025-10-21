import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Loan,
  LoanStatus,
  CopyStatus,
  BookStatus,
  MembershipStatus,
} from '@prisma/client';
import {
  CreateLoanDto,
  ApproveLoanDto,
  QueryLoansDto,
  QueryMyLoansDto,
} from './dto';

/**
 * Loan detail with book and copy relations
 */
export interface LoanWithRelations extends Loan {
  book: {
    id: string;
    title: string;
    isbn: string;
    coverImageUrl: string | null;
  };
  copy: {
    id: string;
    code: string;
    status: CopyStatus;
  };
}

/**
 * Loan with user, member profile, book, and copy for admin list view
 */
export interface AdminLoanView extends Loan {
  user: {
    id: string;
    email: string;
    memberProfile: {
      firstName: string;
      lastName: string;
    } | null;
  };
  book: {
    id: string;
    title: string;
    isbn: string;
  };
  copy: {
    id: string;
    code: string;
  };
}

/**
 * Paginated loans response for admin
 */
export interface PaginatedLoansResponse {
  items: AdminLoanView[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * My loan with computed fields for member view
 */
export interface MyLoanWithComputedFields extends Loan {
  book: {
    id: string;
    title: string;
    coverImageUrl: string | null;
    authors: Array<{ name: string }>;
  };
  copy: {
    id: string;
    code: string;
  };
  canRenew: boolean;
  isOverdue: boolean;
  daysUntilDue: number;
}

/**
 * Paginated my loans response for member
 */
export interface PaginatedMyLoansResponse {
  items: MyLoanWithComputedFields[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * LoansService - Handles loan creation and management business logic
 */
@Injectable()
export class LoansService {
  private readonly logger = new Logger(LoansService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * List all loans with filtering, sorting, and pagination (BE-5.7)
   * Admin only - returns loans with user, book, and copy details
   *
   * @param query Query parameters for filtering, sorting, and pagination
   * @returns Paginated loans response
   */
  async findAllLoans(query: QueryLoansDto): Promise<PaginatedLoansResponse> {
    const {
      status,
      memberId,
      bookId,
      dueBefore,
      dueAfter,
      sortBy,
      sortOrder,
      page,
      pageSize,
    } = query;

    // Build where clause based on filters
    interface WhereClause {
      status?: LoanStatus;
      userId?: string;
      bookId?: string;
      dueDate?: {
        lte?: Date;
        gte?: Date;
      };
    }

    const where: WhereClause = {};

    if (status) {
      where.status = status;
    }

    if (memberId) {
      where.userId = memberId;
    }

    if (bookId) {
      where.bookId = bookId;
    }

    // Due date range filtering
    if (dueBefore || dueAfter) {
      where.dueDate = {};

      if (dueBefore) {
        where.dueDate.lte = dueBefore;
      }

      if (dueAfter) {
        where.dueDate.gte = dueAfter;
      }
    }

    // Build orderBy clause
    const orderBy: Record<string, 'asc' | 'desc'> = {
      [sortBy]: sortOrder,
    };

    // Calculate pagination
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Execute queries in parallel
    const [loansData, total] = await Promise.all([
      this.prisma.loan.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              memberProfile: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
          book: {
            select: {
              id: true,
              title: true,
              isbn: true,
            },
          },
          copy: {
            select: {
              id: true,
              code: true,
            },
          },
        },
      }),
      this.prisma.loan.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    this.logger.log(
      `Listed ${loansData.length} loans (page ${page}/${totalPages}, total ${total})`,
    );

    return {
      items: loansData as AdminLoanView[],
      page,
      pageSize,
      total,
      totalPages,
    };
  }

  /**
   * List member's own loans with computed fields (BE-5.8)
   * Member only - returns loans with canRenew, isOverdue, daysUntilDue
   *
   * @param query Query parameters for filtering, sorting, and pagination
   * @param userId User ID from JWT token
   * @returns Paginated my loans response with computed fields
   */
  async findMyLoans(
    query: QueryMyLoansDto,
    userId: string,
  ): Promise<PaginatedMyLoansResponse> {
    const { status, sortBy, sortOrder, page, pageSize } = query;

    // Build where clause - always filter by userId
    interface MyLoansWhereClause {
      userId: string;
      status?: LoanStatus;
    }

    const where: MyLoansWhereClause = {
      userId,
    };

    if (status) {
      where.status = status;
    }

    // Build orderBy clause
    const orderBy: Record<string, 'asc' | 'desc'> = {
      [sortBy]: sortOrder,
    };

    // Calculate pagination
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Get system settings for canRenew calculation
    const settings = await this.prisma.setting.findFirst();
    if (!settings) {
      throw new Error('System settings not found');
    }

    // Execute queries in parallel
    const [loansData, total, user] = await Promise.all([
      this.prisma.loan.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          book: {
            select: {
              id: true,
              title: true,
              coverImageUrl: true,
              bookAuthors: {
                include: {
                  author: {
                    select: {
                      name: true,
                    },
                  },
                },
              },
            },
          },
          copy: {
            select: {
              id: true,
              code: true,
            },
          },
        },
      }),
      this.prisma.loan.count({ where }),
      this.prisma.user.findUnique({
        where: { id: userId },
        include: {
          memberProfile: {
            select: {
              status: true,
            },
          },
        },
      }),
    ]);

    const now = new Date();

    // Add computed fields to each loan
    const loansWithComputedFields: MyLoanWithComputedFields[] = loansData.map(
      (loan) => {
        // Compute canRenew
        const canRenew =
          loan.renewalCount < settings.maxRenewals &&
          loan.status === LoanStatus.ACTIVE &&
          Number(loan.penaltyAccrued) === 0 &&
          user?.memberProfile?.status === MembershipStatus.ACTIVE;

        // Compute isOverdue
        const isOverdue =
          loan.dueDate !== null &&
          loan.dueDate < now &&
          (loan.status === LoanStatus.ACTIVE ||
            loan.status === LoanStatus.OVERDUE);

        // Compute daysUntilDue
        let daysUntilDue = 0;
        if (loan.dueDate) {
          const timeDiff = loan.dueDate.getTime() - now.getTime();
          daysUntilDue = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
        }

        // Transform book authors
        const bookWithAuthors = {
          id: loan.book.id,
          title: loan.book.title,
          coverImageUrl: loan.book.coverImageUrl,
          authors: loan.book.bookAuthors.map((ba) => ({
            name: ba.author.name,
          })),
        };

        return {
          ...loan,
          book: bookWithAuthors,
          canRenew,
          isOverdue,
          daysUntilDue,
        } as MyLoanWithComputedFields;
      },
    );

    const totalPages = Math.ceil(total / pageSize);

    this.logger.log(
      `Listed ${loansData.length} loans for member ${userId} (page ${page}/${totalPages}, total ${total})`,
    );

    return {
      items: loansWithComputedFields,
      page,
      pageSize,
      total,
      totalPages,
    };
  }

  /**
   * Create a new loan for a member
   * Validates member eligibility and book/copy availability
   * Auto-approves or sets to PENDING based on system settings
   *
   * @param createLoanDto Loan creation data (bookId, optional copyId)
   * @param userId User ID from JWT token
   * @returns Created loan with book and copy relations
   * @throws NotFoundException if book or copy not found
   * @throws ForbiddenException if member is ineligible
   * @throws ConflictException if copy is unavailable
   */
  async createLoan(
    createLoanDto: CreateLoanDto,
    userId: string,
  ): Promise<LoanWithRelations> {
    const { bookId, copyId } = createLoanDto;

    // Get system settings
    const settings = await this.prisma.setting.findFirst();
    if (!settings) {
      throw new Error('System settings not found');
    }

    // 1. Validate member eligibility
    await this.validateMemberEligibility(userId, settings.maxConcurrentLoans);

    // 2. Validate book exists and is active
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book || book.status !== BookStatus.ACTIVE) {
      this.logger.warn(`Book not found or inactive: ${bookId}`);
      throw new NotFoundException('Book not found or is not available');
    }

    // 3. Select or validate copy
    let selectedCopy;
    if (copyId) {
      // Validate provided copyId belongs to the book and is available
      selectedCopy = await this.prisma.bookCopy.findUnique({
        where: { id: copyId },
      });

      if (!selectedCopy) {
        this.logger.warn(`Copy not found: ${copyId}`);
        throw new NotFoundException('Book copy not found');
      }

      if (selectedCopy.bookId !== bookId) {
        this.logger.warn(`Copy ${copyId} does not belong to book ${bookId}`);
        throw new NotFoundException('Book copy does not belong to this book');
      }

      if (selectedCopy.status !== CopyStatus.AVAILABLE) {
        this.logger.warn(`Copy not available: ${copyId}`);
        throw new ConflictException('This book copy is not available');
      }
    } else {
      // Auto-select first available copy
      selectedCopy = await this.prisma.bookCopy.findFirst({
        where: {
          bookId,
          status: CopyStatus.AVAILABLE,
        },
        orderBy: {
          code: 'asc',
        },
      });

      if (!selectedCopy) {
        this.logger.warn(`No available copies for book: ${bookId}`);
        throw new NotFoundException('No available copies for this book');
      }
    }

    // 4. Determine loan status and dates based on approval requirements
    const status = settings.approvalsRequired
      ? LoanStatus.REQUESTED
      : LoanStatus.APPROVED;

    const borrowedAt = settings.approvalsRequired ? null : new Date();
    const dueDate = settings.approvalsRequired
      ? null
      : new Date(Date.now() + settings.loanDays * 24 * 60 * 60 * 1000);

    // 5. Create loan and update copy status in a transaction
    const loan = await this.prisma.$transaction(async (tx) => {
      // Create the loan
      const createdLoan = await tx.loan.create({
        data: {
          userId,
          bookId,
          copyId: selectedCopy.id,
          status,
          borrowedAt,
          dueDate,
          renewalCount: 0,
          penaltyAccrued: 0,
        },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              isbn: true,
              coverImageUrl: true,
            },
          },
          copy: {
            select: {
              id: true,
              code: true,
              status: true,
            },
          },
        },
      });

      // Update copy status to ON_LOAN only if loan is APPROVED
      if (status === LoanStatus.APPROVED) {
        await tx.bookCopy.update({
          where: { id: selectedCopy.id },
          data: { status: CopyStatus.ON_LOAN },
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'loan.created',
          entityType: 'Loan',
          entityId: createdLoan.id,
          metadata: {
            bookId,
            bookTitle: book.title,
            copyId: selectedCopy.id,
            copyCode: selectedCopy.code,
            status,
            autoApproved: !settings.approvalsRequired,
            borrowedAt,
            dueDate,
          },
        },
      });

      return createdLoan;
    });

    this.logger.log(
      `Loan created: ${loan.id} for user ${userId}, book ${bookId}, status ${status}`,
    );

    // 6. Send notification email
    await this.sendLoanCreatedEmail(userId, book.title, status, dueDate);

    return loan as LoanWithRelations;
  }

  /**
   * Validate member eligibility for borrowing
   * Checks:
   * - User has MEMBER role
   * - Member profile exists and status is ACTIVE
   * - No overdue loans
   * - No unpaid penalties
   * - Active loans count < maxConcurrentLoans
   *
   * @param userId User ID to validate
   * @param maxConcurrentLoans Maximum allowed concurrent loans from settings
   * @throws ForbiddenException if member is ineligible
   */
  private async validateMemberEligibility(
    userId: string,
    maxConcurrentLoans: number,
  ): Promise<void> {
    // Get user with member profile
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        memberProfile: true,
      },
    });

    if (!user) {
      this.logger.warn(`User not found: ${userId}`);
      throw new ForbiddenException('User not found');
    }

    // Check if user has MEMBER role
    if (user.role !== 'MEMBER') {
      this.logger.warn(`User ${userId} does not have MEMBER role`);
      throw new ForbiddenException('Only members can borrow books');
    }

    // Check if member profile exists
    if (!user.memberProfile) {
      this.logger.warn(`Member profile not found for user: ${userId}`);
      throw new ForbiddenException('Member profile not found');
    }

    // Check if member status is ACTIVE
    if (user.memberProfile.status !== MembershipStatus.ACTIVE) {
      this.logger.warn(
        `Member ${userId} has status ${user.memberProfile.status}`,
      );
      throw new ForbiddenException(
        `Cannot borrow books. Member status is ${user.memberProfile.status}`,
      );
    }

    // Check for overdue loans
    const overdueLoansCount = await this.prisma.loan.count({
      where: {
        userId,
        status: LoanStatus.OVERDUE,
      },
    });

    if (overdueLoansCount > 0) {
      this.logger.warn(
        `Member ${userId} has ${overdueLoansCount} overdue loans`,
      );
      throw new ForbiddenException(
        'Cannot borrow books. You have overdue loans. Please return them first.',
      );
    }

    // Check for unpaid penalties (loans with penaltyAccrued > 0 that are OVERDUE or RETURNED)
    const unpaidPenalties = await this.prisma.loan.findFirst({
      where: {
        userId,
        status: {
          in: [LoanStatus.OVERDUE, LoanStatus.RETURNED],
        },
        penaltyAccrued: {
          gt: 0,
        },
      },
    });

    if (unpaidPenalties) {
      this.logger.warn(`Member ${userId} has unpaid penalties`);
      throw new ForbiddenException(
        'Cannot borrow books. You have unpaid penalties. Please pay them first.',
      );
    }

    // Check active loans count (APPROVED, ACTIVE, OVERDUE statuses)
    const activeLoansCount = await this.prisma.loan.count({
      where: {
        userId,
        status: {
          in: [LoanStatus.APPROVED, LoanStatus.ACTIVE, LoanStatus.OVERDUE],
        },
      },
    });

    if (activeLoansCount >= maxConcurrentLoans) {
      this.logger.warn(
        `Member ${userId} has reached the maximum concurrent loans limit (${maxConcurrentLoans})`,
      );
      throw new ForbiddenException(
        `Cannot borrow books. You have reached the maximum concurrent loans limit (${maxConcurrentLoans}).`,
      );
    }
  }

  /**
   * Approve or reject a loan request (BE-5.4)
   * Admin only - can approve pending loan requests or reject them
   *
   * @param loanId Loan ID to approve/reject
   * @param approveLoanDto Approval/rejection data
   * @param adminUserId Admin user ID (for audit logging)
   * @returns Updated loan with book and copy relations
   * @throws NotFoundException if loan not found
   * @throws ConflictException if loan is not in REQUESTED status or copy unavailable
   * @throws ForbiddenException if member is no longer eligible (for approval)
   */
  async approveLoan(
    loanId: string,
    approveLoanDto: ApproveLoanDto,
    adminUserId: string,
  ): Promise<LoanWithRelations> {
    const { action, copyId, rejectionReason } = approveLoanDto;

    // 1. Get the loan with user and book details
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            isbn: true,
            coverImageUrl: true,
          },
        },
        copy: {
          select: {
            id: true,
            code: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            memberProfile: {
              select: {
                firstName: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!loan) {
      this.logger.warn(`Loan not found: ${loanId}`);
      throw new NotFoundException('Loan not found');
    }

    // 2. Validate loan status is REQUESTED
    if (loan.status !== LoanStatus.REQUESTED) {
      this.logger.warn(`Loan is not in REQUESTED status: ${loanId}`);
      throw new ConflictException(
        `Cannot ${action} loan. Loan status must be REQUESTED`,
      );
    }

    // Get system settings
    const settings = await this.prisma.setting.findFirst();
    if (!settings) {
      throw new Error('System settings not found');
    }

    if (action === 'approve') {
      // 3. For approval, validate copyId and copy availability
      if (!copyId) {
        throw new ConflictException('Copy ID is required for approval');
      }

      // Validate copy exists and belongs to the same book
      const copy = await this.prisma.bookCopy.findUnique({
        where: { id: copyId },
      });

      if (!copy) {
        this.logger.warn(`Copy not found: ${copyId}`);
        throw new NotFoundException('Book copy not found');
      }

      if (copy.bookId !== loan.bookId) {
        this.logger.warn(
          `Copy ${copyId} does not belong to book ${loan.bookId}`,
        );
        throw new ConflictException('Book copy does not belong to this book');
      }

      if (copy.status !== CopyStatus.AVAILABLE) {
        this.logger.warn(`Copy not available: ${copyId}`);
        throw new ConflictException('Book copy is not available');
      }

      // Check if copy has any open loans (race condition check)
      const openLoan = await this.prisma.loan.findFirst({
        where: {
          copyId,
          status: {
            in: [LoanStatus.APPROVED, LoanStatus.ACTIVE, LoanStatus.OVERDUE],
          },
        },
      });

      if (openLoan) {
        this.logger.warn(`Copy ${copyId} has an open loan: ${openLoan.id}`);
        throw new ConflictException(
          'Book copy is already on loan to another member',
        );
      }

      // 4. Re-validate member eligibility (race condition check)
      try {
        await this.validateMemberEligibility(
          loan.userId,
          settings.maxConcurrentLoans,
        );
      } catch (error) {
        this.logger.warn(
          `Member no longer eligible for approval: ${loan.userId}`,
        );
        const errorMessage =
          error instanceof Error
            ? error.message
            : 'Member is no longer eligible';
        throw new ForbiddenException(`Cannot approve loan. ${errorMessage}`);
      }

      // 5. Approve the loan
      const borrowedAt = new Date();
      const dueDate = new Date(
        Date.now() + settings.loanDays * 24 * 60 * 60 * 1000,
      );

      const updatedLoan = await this.prisma.$transaction(async (tx) => {
        // Update the loan
        const updated = await tx.loan.update({
          where: { id: loanId },
          data: {
            status: LoanStatus.APPROVED,
            copyId,
            borrowedAt,
            dueDate,
          },
          include: {
            book: {
              select: {
                id: true,
                title: true,
                isbn: true,
                coverImageUrl: true,
              },
            },
            copy: {
              select: {
                id: true,
                code: true,
                status: true,
              },
            },
          },
        });

        // Update copy status to ON_LOAN
        await tx.bookCopy.update({
          where: { id: copyId },
          data: { status: CopyStatus.ON_LOAN },
        });

        // Create audit log
        await tx.auditLog.create({
          data: {
            userId: adminUserId,
            action: 'loan.approved',
            entityType: 'Loan',
            entityId: loanId,
            metadata: {
              loanId,
              memberId: loan.userId,
              bookId: loan.bookId,
              bookTitle: loan.book.title,
              copyId,
              copyCode: copy.code,
              borrowedAt,
              dueDate,
              approvedBy: adminUserId,
            },
          },
        });

        return updated;
      });

      this.logger.log(`Loan approved: ${loanId} by admin ${adminUserId}`);

      // Send approval email to member
      await this.sendLoanApprovedEmail(loan.userId, loan.book.title, dueDate);

      return updatedLoan as LoanWithRelations;
    } else {
      // 6. For rejection, update loan status to REJECTED
      const updatedLoan = await this.prisma.$transaction(async (tx) => {
        // Update the loan
        const updated = await tx.loan.update({
          where: { id: loanId },
          data: {
            status: LoanStatus.REJECTED,
          },
          include: {
            book: {
              select: {
                id: true,
                title: true,
                isbn: true,
                coverImageUrl: true,
              },
            },
            copy: {
              select: {
                id: true,
                code: true,
                status: true,
              },
            },
          },
        });

        // Create audit log
        await tx.auditLog.create({
          data: {
            userId: adminUserId,
            action: 'loan.rejected',
            entityType: 'Loan',
            entityId: loanId,
            metadata: {
              loanId,
              memberId: loan.userId,
              bookId: loan.bookId,
              bookTitle: loan.book.title,
              rejectionReason,
              rejectedBy: adminUserId,
            },
          },
        });

        return updated;
      });

      this.logger.log(`Loan rejected: ${loanId} by admin ${adminUserId}`);

      // Send rejection email to member
      await this.sendLoanRejectedEmail(
        loan.userId,
        loan.book.title,
        rejectionReason,
      );

      return updatedLoan as LoanWithRelations;
    }
  }

  /**
   * Send loan created notification email
   * TODO: Implement actual email sending using SMTP/Mailtrap
   *
   * @param userId User ID
   * @param bookTitle Title of borrowed book
   * @param status Loan status (REQUESTED or APPROVED)
   * @param dueDate Due date (if auto-approved)
   */
  private async sendLoanCreatedEmail(
    userId: string,
    bookTitle: string,
    status: LoanStatus,
    dueDate: Date | null,
  ): Promise<void> {
    // Get user email
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        memberProfile: {
          select: {
            firstName: true,
          },
        },
      },
    });

    if (!user) return;

    // TODO: Implement email sending using Nodemailer + Mailtrap
    // For now, just log the action
    if (status === LoanStatus.REQUESTED) {
      this.logger.log(
        `[EMAIL] Loan request notification sent to ${user.email} - Book: "${bookTitle}" is awaiting approval`,
      );
    } else {
      this.logger.log(
        `[EMAIL] Loan approved notification sent to ${user.email} - Book: "${bookTitle}", Due: ${dueDate?.toISOString()}`,
      );
    }

    // Email template for REQUESTED:
    // Subject: Loan Request Submitted
    // Body: Hello {firstName}, Your loan request for "{bookTitle}" has been submitted and is awaiting approval...

    // Email template for APPROVED:
    // Subject: Book Ready for Pickup
    // Body: Hello {firstName}, Your loan for "{bookTitle}" has been approved. Due date: {dueDate}...
  }

  /**
   * Checkout an approved loan (BE-5.4.5)
   * Admin marks an approved loan as active when member physically picks up the book
   *
   * @param loanId Loan ID to checkout
   * @param adminUserId Admin user ID (for audit logging)
   * @returns Updated loan with book and copy relations and success message
   * @throws NotFoundException if loan not found
   * @throws ConflictException if loan is not in APPROVED status
   * @throws ConflictException if member is suspended
   * @throws ConflictException if copy is not ON_LOAN
   */
  async checkoutLoan(
    loanId: string,
    adminUserId: string,
  ): Promise<{ loan: LoanWithRelations; message: string }> {
    // 1. Get the loan with user, book, and copy details
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            isbn: true,
            coverImageUrl: true,
          },
        },
        copy: {
          select: {
            id: true,
            code: true,
            status: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
            memberProfile: {
              select: {
                firstName: true,
                status: true,
              },
            },
          },
        },
      },
    });

    if (!loan) {
      this.logger.warn(`Loan not found: ${loanId}`);
      throw new NotFoundException('Loan not found');
    }

    // 2. Validate loan status is APPROVED
    if (loan.status !== LoanStatus.APPROVED) {
      this.logger.warn(
        `Cannot checkout loan with status ${loan.status}. Loan must be APPROVED.`,
      );
      throw new ConflictException('Loan is not in APPROVED status');
    }

    // 3. Re-validate member status is ACTIVE (race condition check)
    if (loan.user.memberProfile?.status !== MembershipStatus.ACTIVE) {
      this.logger.warn(
        `Cannot checkout. Member ${loan.userId} has status ${loan.user.memberProfile?.status}`,
      );
      throw new ConflictException('Cannot checkout. Member is suspended');
    }

    // 4. Re-validate copy status is ON_LOAN
    if (loan.copy.status !== CopyStatus.ON_LOAN) {
      this.logger.warn(
        `Cannot checkout. Copy ${loan.copyId} has status ${loan.copy.status}, expected ON_LOAN`,
      );
      throw new ConflictException('Copy is not available for checkout');
    }

    // 5. Update loan status to ACTIVE in a transaction
    const updatedLoan = await this.prisma.$transaction(async (tx) => {
      // Update the loan status to ACTIVE
      // IMPORTANT: Do NOT modify borrowedAt or dueDate - they were set during approval
      const updated = await tx.loan.update({
        where: { id: loanId },
        data: {
          status: LoanStatus.ACTIVE,
        },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              isbn: true,
              coverImageUrl: true,
            },
          },
          copy: {
            select: {
              id: true,
              code: true,
              status: true,
            },
          },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId: adminUserId,
          action: 'loan.checkedout',
          entityType: 'Loan',
          entityId: loanId,
          metadata: {
            loanId,
            memberId: loan.userId,
            bookId: loan.bookId,
            bookTitle: loan.book.title,
            copyId: loan.copyId,
            copyCode: loan.copy.code,
            borrowedAt: loan.borrowedAt,
            dueDate: loan.dueDate,
            checkedOutBy: adminUserId,
          },
        },
      });

      return updated;
    });

    this.logger.log(
      `Loan checked out: ${loanId} by admin ${adminUserId} for member ${loan.userId}`,
    );

    // 6. Send checkout confirmation email to member
    await this.sendLoanCheckoutEmail(
      loan.userId,
      loan.book.title,
      loan.dueDate!,
    );

    // 7. Construct success message with due date
    const dueDateStr = loan.dueDate
      ? loan.dueDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
      : 'N/A';

    const message = `Loan checked out successfully. Due date: ${dueDateStr}`;

    return { loan: updatedLoan as LoanWithRelations, message };
  }

  /**
   * Send loan approved notification email
   * Notifies member that their loan has been approved
   * TODO: Implement actual email sending using SMTP/Mailtrap
   *
   * @param userId User ID
   * @param bookTitle Title of approved book
   * @param dueDate Due date for return
   */
  private async sendLoanApprovedEmail(
    userId: string,
    bookTitle: string,
    dueDate: Date,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        memberProfile: {
          select: {
            firstName: true,
          },
        },
      },
    });

    if (!user) return;

    // TODO: Implement email sending using Nodemailer + Mailtrap
    // For now, just log the action
    this.logger.log(
      `[EMAIL] Loan approved notification sent to ${user.email} - Book: "${bookTitle}", Due: ${dueDate.toISOString()}`,
    );

    // Email template:
    // Subject: Book Ready for Pickup
    // Body: Hello {firstName}, Your loan for "{bookTitle}" has been approved. Due date: {dueDate}. Please pick up the book at the library.
  }

  /**
   * Send loan checkout confirmation email
   * Notifies member that their loan has been checked out
   * TODO: Implement actual email sending using SMTP/Mailtrap
   *
   * @param userId User ID
   * @param bookTitle Title of checked out book
   * @param dueDate Due date for return
   */
  private async sendLoanCheckoutEmail(
    userId: string,
    bookTitle: string,
    dueDate: Date,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        memberProfile: {
          select: {
            firstName: true,
          },
        },
      },
    });

    if (!user) return;

    // TODO: Implement email sending using Nodemailer + Mailtrap
    // For now, just log the action
    this.logger.log(
      `[EMAIL] Loan checkout confirmation sent to ${user.email} - Book: "${bookTitle}", Due: ${dueDate.toISOString()}`,
    );

    // Email template:
    // Subject: Book Checked Out Successfully
    // Body: Hello {firstName}, You have successfully checked out "{bookTitle}". Please return it by {dueDate}. Thank you for using our library!
  }

  /**
   * Send loan rejected notification email
   * Notifies member that their loan request has been rejected
   * TODO: Implement actual email sending using SMTP/Mailtrap
   *
   * @param userId User ID
   * @param bookTitle Title of rejected book
   * @param rejectionReason Optional reason for rejection
   */
  private async sendLoanRejectedEmail(
    userId: string,
    bookTitle: string,
    rejectionReason?: string | null,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        memberProfile: {
          select: {
            firstName: true,
          },
        },
      },
    });

    if (!user) return;

    // TODO: Implement email sending using Nodemailer + Mailtrap
    // For now, just log the action
    this.logger.log(
      `[EMAIL] Loan rejected notification sent to ${user.email} - Book: "${bookTitle}"${rejectionReason ? `, Reason: ${rejectionReason}` : ''}`,
    );

    // Email template:
    // Subject: Loan Request Rejected
    // Body: Hello {firstName}, Your loan request for "{bookTitle}" has been rejected. {rejectionReason}
  }

  /**
   * Renew a loan (BE-5.5)
   * Extends the due date of an active loan
   *
   * @param loanId Loan ID to renew
   * @param userId User ID from JWT token
   * @param userRole User role from JWT token
   * @returns Updated loan with book and copy relations
   * @throws NotFoundException if loan not found
   * @throws ForbiddenException if not authorized
   * @throws ConflictException if renewal is not allowed
   */
  async renewLoan(
    loanId: string,
    userId: string,
    userRole: string,
  ): Promise<LoanWithRelations> {
    // 1. Get the loan with relations
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            isbn: true,
            coverImageUrl: true,
          },
        },
        copy: {
          select: {
            id: true,
            code: true,
            status: true,
          },
        },
      },
    });

    if (!loan) {
      this.logger.warn(`Loan not found: ${loanId}`);
      throw new NotFoundException('Loan not found');
    }

    // 2. Check authorization (member can only renew own loans, admin can renew any)
    if (userRole !== 'ADMIN' && loan.userId !== userId) {
      this.logger.warn(`User ${userId} not authorized to renew loan ${loanId}`);
      throw new ForbiddenException('Not authorized to renew this loan');
    }

    // 3. Validate loan status is ACTIVE
    if (loan.status !== LoanStatus.ACTIVE) {
      this.logger.warn(`Cannot renew loan with status ${loan.status}`);
      throw new ConflictException('Can only renew active loans');
    }

    // 4. Get system settings
    const settings = await this.prisma.setting.findFirst();
    if (!settings) {
      throw new Error('System settings not found');
    }

    // 5. Check renewalCount < maxRenewals
    if (loan.renewalCount >= settings.maxRenewals) {
      this.logger.warn(
        `Loan ${loanId} has reached maximum renewals (${settings.maxRenewals})`,
      );
      throw new ConflictException(
        `Maximum renewals (${settings.maxRenewals}) reached for this loan`,
      );
    }

    // 6. Check no overdue penalty on the loan
    if (Number(loan.penaltyAccrued) > 0) {
      this.logger.warn(`Loan ${loanId} has overdue penalty`);
      throw new ConflictException(
        'Cannot renew loan with overdue penalties. Please return the book and pay the penalty first.',
      );
    }

    // 7. Check member has no overdue loans (for members only, admins can override)
    if (userRole !== 'ADMIN') {
      const overdueLoansCount = await this.prisma.loan.count({
        where: {
          userId: loan.userId,
          status: LoanStatus.OVERDUE,
        },
      });

      if (overdueLoansCount > 0) {
        this.logger.warn(`Member ${loan.userId} has overdue loans`);
        throw new ConflictException(
          'Cannot renew loan. You have overdue loans. Please return them first.',
        );
      }

      // Also check if member is suspended
      const user = await this.prisma.user.findUnique({
        where: { id: loan.userId },
        include: { memberProfile: true },
      });

      if (
        user?.memberProfile?.status !== MembershipStatus.ACTIVE &&
        userRole !== 'ADMIN'
      ) {
        this.logger.warn(`Member ${loan.userId} is not active`);
        throw new ConflictException(
          'Cannot renew loan while membership is suspended',
        );
      }
    }

    // 8. Extend dueDate by loanDays (from current due date, not from today)
    if (!loan.dueDate) {
      throw new Error('Loan has no due date');
    }

    const newDueDate = new Date(loan.dueDate);
    newDueDate.setDate(newDueDate.getDate() + settings.loanDays);

    // 9. Update loan in a transaction
    const updatedLoan = await this.prisma.$transaction(async (tx) => {
      // Update the loan
      const updated = await tx.loan.update({
        where: { id: loanId },
        data: {
          dueDate: newDueDate,
          renewalCount: loan.renewalCount + 1,
        },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              isbn: true,
              coverImageUrl: true,
            },
          },
          copy: {
            select: {
              id: true,
              code: true,
              status: true,
            },
          },
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'loan.renewed',
          entityType: 'Loan',
          entityId: loanId,
          metadata: {
            loanId,
            bookId: loan.bookId,
            bookTitle: loan.book.title,
            oldDueDate: loan.dueDate,
            newDueDate,
            renewalCount: updated.renewalCount,
          },
        },
      });

      return updated;
    });

    this.logger.log(
      `Loan renewed: ${loanId} by user ${userId}, new due date: ${newDueDate.toISOString()}`,
    );

    // 10. Send renewal notification email
    await this.sendLoanRenewedEmail(loan.userId, loan.book.title, newDueDate);

    return updatedLoan as LoanWithRelations;
  }

  /**
   * Cancel a loan (BE-5.6)
   * Cancels a PENDING or APPROVED loan
   *
   * @param loanId Loan ID to cancel
   * @param userId User ID from JWT token
   * @param userRole User role from JWT token
   * @returns Updated loan with book and copy relations
   * @throws NotFoundException if loan not found
   * @throws ForbiddenException if not authorized
   * @throws ConflictException if loan status doesn't allow cancellation
   */
  async cancelLoan(
    loanId: string,
    userId: string,
    userRole: string,
  ): Promise<LoanWithRelations> {
    // 1. Get the loan with relations
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            isbn: true,
            coverImageUrl: true,
          },
        },
        copy: {
          select: {
            id: true,
            code: true,
            status: true,
          },
        },
      },
    });

    if (!loan) {
      this.logger.warn(`Loan not found: ${loanId}`);
      throw new NotFoundException('Loan not found');
    }

    // 2. Check authorization (member can only cancel own loans, admin can cancel any)
    if (userRole !== 'ADMIN' && loan.userId !== userId) {
      this.logger.warn(
        `User ${userId} not authorized to cancel loan ${loanId}`,
      );
      throw new ForbiddenException('Not authorized to cancel this loan');
    }

    // 3. Validate loan status is PENDING or APPROVED (cannot cancel ACTIVE, RETURNED, CANCELLED, OVERDUE)
    const allowedStatuses: LoanStatus[] = [
      LoanStatus.REQUESTED,
      LoanStatus.APPROVED,
    ];
    if (!allowedStatuses.includes(loan.status)) {
      this.logger.warn(
        `Cannot cancel loan with status ${loan.status}. Only REQUESTED or APPROVED loans can be cancelled.`,
      );
      throw new ConflictException(
        'Cannot cancel this loan. Only pending or approved loans can be cancelled.',
      );
    }

    // 4. Update loan status to CANCELLED and set copy status back to AVAILABLE in a transaction
    const updatedLoan = await this.prisma.$transaction(async (tx) => {
      // Update the loan
      const updated = await tx.loan.update({
        where: { id: loanId },
        data: {
          status: LoanStatus.CANCELLED,
        },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              isbn: true,
              coverImageUrl: true,
            },
          },
          copy: {
            select: {
              id: true,
              code: true,
              status: true,
            },
          },
        },
      });

      // Set copy status back to AVAILABLE (only if it was ON_LOAN)
      if (loan.copy.status === CopyStatus.ON_LOAN) {
        await tx.bookCopy.update({
          where: { id: loan.copyId },
          data: { status: CopyStatus.AVAILABLE },
        });
      }

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'loan.cancelled',
          entityType: 'Loan',
          entityId: loanId,
          metadata: {
            loanId,
            bookId: loan.bookId,
            bookTitle: loan.book.title,
            copyId: loan.copyId,
            copyCode: loan.copy.code,
            previousStatus: loan.status,
            cancelledBy: userId,
          },
        },
      });

      return updated;
    });

    this.logger.log(`Loan cancelled: ${loanId} by user ${userId}`);

    // 5. Send cancellation notification email
    await this.sendLoanCancelledEmail(loan.userId, loan.book.title);

    return updatedLoan as LoanWithRelations;
  }

  /**
   * Send loan renewed notification email
   * TODO: Implement actual email sending using SMTP/Mailtrap
   *
   * @param userId User ID
   * @param bookTitle Title of renewed book
   * @param newDueDate New due date after renewal
   */
  private async sendLoanRenewedEmail(
    userId: string,
    bookTitle: string,
    newDueDate: Date,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        memberProfile: {
          select: {
            firstName: true,
          },
        },
      },
    });

    if (!user) return;

    // TODO: Implement email sending using Nodemailer + Mailtrap
    // For now, just log the action
    this.logger.log(
      `[EMAIL] Loan renewed notification sent to ${user.email} - Book: "${bookTitle}", New due date: ${newDueDate.toISOString()}`,
    );

    // Email template:
    // Subject: Loan Renewed Successfully
    // Body: Hello {firstName}, Your loan for "{bookTitle}" has been renewed. New due date: {newDueDate}.
  }

  /**
   * Send loan cancelled notification email
   * TODO: Implement actual email sending using SMTP/Mailtrap
   *
   * @param userId User ID
   * @param bookTitle Title of cancelled book
   */
  private async sendLoanCancelledEmail(
    userId: string,
    bookTitle: string,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        memberProfile: {
          select: {
            firstName: true,
          },
        },
      },
    });

    if (!user) return;

    // TODO: Implement email sending using Nodemailer + Mailtrap
    // For now, just log the action
    this.logger.log(
      `[EMAIL] Loan cancelled notification sent to ${user.email} - Book: "${bookTitle}"`,
    );

    // Email template:
    // Subject: Loan Cancelled
    // Body: Hello {firstName}, Your loan for "{bookTitle}" has been cancelled successfully.
  }

  /**
   * Return a loan (BE-5.6-ALT)
   * Marks a loan as returned, calculates overdue penalty if applicable, and updates copy status
   *
   * @param loanId Loan ID to return
   * @param userId User ID from JWT token
   * @param userRole User role from JWT token
   * @returns Updated loan with book and copy relations, plus message
   * @throws NotFoundException if loan not found
   * @throws ForbiddenException if not authorized
   * @throws ConflictException if loan already returned
   */
  async returnLoan(
    loanId: string,
    userId: string,
    userRole: string,
  ): Promise<{ loan: LoanWithRelations; message: string }> {
    // 1. Get the loan with relations
    const loan = await this.prisma.loan.findUnique({
      where: { id: loanId },
      include: {
        book: {
          select: {
            id: true,
            title: true,
            isbn: true,
            coverImageUrl: true,
          },
        },
        copy: {
          select: {
            id: true,
            code: true,
            status: true,
          },
        },
      },
    });

    if (!loan) {
      this.logger.warn(`Loan not found: ${loanId}`);
      throw new NotFoundException('Loan not found');
    }

    // 2. Check authorization (member can only return own loans, admin can return any)
    if (userRole !== 'ADMIN' && loan.userId !== userId) {
      this.logger.warn(
        `User ${userId} not authorized to return loan ${loanId}`,
      );
      throw new ForbiddenException('Not authorized to return this loan');
    }

    // 3. Validate loan status is not already RETURNED
    if (loan.status === LoanStatus.RETURNED) {
      this.logger.warn(`Loan already returned: ${loanId}`);
      throw new ConflictException('Loan already returned');
    }

    // 4. Business rule: Only ACTIVE or OVERDUE loans can be returned
    const returnableStatuses: LoanStatus[] = [
      LoanStatus.ACTIVE,
      LoanStatus.OVERDUE,
    ];
    if (!returnableStatuses.includes(loan.status)) {
      this.logger.warn(
        `Cannot return loan with status ${loan.status}. Only ACTIVE or OVERDUE loans can be returned.`,
      );
      throw new ConflictException(
        'Cannot return this loan. Only active or overdue loans can be returned. Please cancel requested or approved loans instead.',
      );
    }

    // 5. Get system settings for penalty calculation
    const settings = await this.prisma.setting.findFirst();
    if (!settings) {
      throw new Error('System settings not found');
    }

    // 6. Calculate penalty if overdue
    const returnDate = new Date();
    let penalty = 0;
    let overdueDays = 0;

    if (loan.dueDate) {
      // Calculate overdue days (rounded up to nearest day)
      const daysDiff =
        (returnDate.getTime() - loan.dueDate.getTime()) / (1000 * 60 * 60 * 24);
      overdueDays = Math.max(0, Math.ceil(daysDiff));

      if (overdueDays > 0) {
        // Calculate penalty with cap
        const calculatedPenalty =
          overdueDays * Number(settings.overdueFeePerDay);
        penalty = Math.min(
          calculatedPenalty,
          Number(settings.overdueFeeCapPerLoan),
        );
        this.logger.log(
          `Loan ${loanId} is overdue by ${overdueDays} days. Penalty: ${penalty}`,
        );
      }
    }

    // 7. Update loan and copy status in a transaction
    const updatedLoan = await this.prisma.$transaction(async (tx) => {
      // Update the loan
      const updated = await tx.loan.update({
        where: { id: loanId },
        data: {
          status: LoanStatus.RETURNED,
          returnedAt: returnDate,
          penaltyAccrued: penalty,
        },
        include: {
          book: {
            select: {
              id: true,
              title: true,
              isbn: true,
              coverImageUrl: true,
            },
          },
          copy: {
            select: {
              id: true,
              code: true,
              status: true,
            },
          },
        },
      });

      // Update copy status to AVAILABLE
      await tx.bookCopy.update({
        where: { id: loan.copyId },
        data: { status: CopyStatus.AVAILABLE },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'loan.returned',
          entityType: 'Loan',
          entityId: loanId,
          metadata: {
            loanId,
            bookId: loan.bookId,
            bookTitle: loan.book.title,
            copyId: loan.copyId,
            copyCode: loan.copy.code,
            returnedAt: returnDate,
            overdueDays,
            penaltyAccrued: penalty,
            returnedBy: userId,
          },
        },
      });

      return updated;
    });

    this.logger.log(
      `Loan returned: ${loanId} by user ${userId}, penalty: ${penalty}`,
    );

    // 8. Send return confirmation email (include penalty if > 0)
    await this.sendLoanReturnedEmail(
      loan.userId,
      loan.book.title,
      penalty,
      overdueDays,
    );

    // 9. Construct success message
    const message =
      penalty > 0
        ? `Book returned successfully. Overdue penalty: ${settings.currency} ${penalty.toFixed(2)}`
        : 'Book returned successfully';

    return { loan: updatedLoan as LoanWithRelations, message };
  }

  /**
   * Send loan returned notification email
   * TODO: Implement actual email sending using SMTP/Mailtrap
   *
   * @param userId User ID
   * @param bookTitle Title of returned book
   * @param penalty Penalty amount (0 if not overdue)
   * @param overdueDays Number of overdue days
   */
  private async sendLoanReturnedEmail(
    userId: string,
    bookTitle: string,
    penalty: number,
    overdueDays: number,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        memberProfile: {
          select: {
            firstName: true,
          },
        },
      },
    });

    if (!user) return;

    // TODO: Implement email sending using Nodemailer + Mailtrap
    // For now, just log the action
    if (penalty > 0) {
      this.logger.log(
        `[EMAIL] Loan returned with penalty notification sent to ${user.email} - Book: "${bookTitle}", Overdue: ${overdueDays} days, Penalty: ${penalty}`,
      );
    } else {
      this.logger.log(
        `[EMAIL] Loan returned notification sent to ${user.email} - Book: "${bookTitle}"`,
      );
    }

    // Email template:
    // Subject: Book Returned Successfully
    // Body: Hello {firstName}, Your return of "{bookTitle}" has been processed.
    // [If penalty > 0] You have an overdue penalty of {penalty} for {overdueDays} days late. Please pay at the library.
  }
}
