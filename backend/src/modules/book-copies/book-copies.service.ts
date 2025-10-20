import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BookCopy, CopyStatus, LoanStatus, Prisma } from '@prisma/client';
import { QueryCopiesDto, AddCopiesDto, UpdateCopyDto } from './dto';

/**
 * Paginated response type for book copies
 */
export type PaginatedCopies = {
  items: BookCopy[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

/**
 * BookCopiesService - Handles all book copy-related business logic
 * Implements operations for managing physical book copies
 */
@Injectable()
export class BookCopiesService {
  private readonly logger = new Logger(BookCopiesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * List copies for a specific book with pagination and filtering
   * Admin only endpoint
   *
   * @param bookId Book UUID
   * @param query Query parameters for filtering and pagination
   * @returns Paginated list of book copies
   * @throws NotFoundException if book not found
   */
  async findCopiesForBook(
    bookId: string,
    query: QueryCopiesDto,
  ): Promise<PaginatedCopies> {
    const { status, page, pageSize } = query;

    // Check if book exists
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      this.logger.warn(`Book not found: ${bookId}`);
      throw new NotFoundException('Book not found');
    }

    // Build where clause
    const where: Prisma.BookCopyWhereInput = {
      bookId,
      ...(status && { status }),
    };

    // Calculate pagination
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Execute queries in parallel
    const [copies, total] = await Promise.all([
      this.prisma.bookCopy.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.bookCopy.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      items: copies,
      page,
      pageSize,
      total,
      totalPages,
    };
  }

  /**
   * Add multiple copies to a book
   * Admin only endpoint
   * Generates unique codes for each copy and creates them in a transaction
   *
   * @param bookId Book UUID
   * @param addCopiesDto Data for adding copies
   * @param userId User ID of the actor (for audit logging)
   * @returns Array of created copies with success message
   * @throws NotFoundException if book not found
   */
  async addCopiesToBook(
    bookId: string,
    addCopiesDto: AddCopiesDto,
    userId: string,
  ): Promise<{ copies: BookCopy[]; message: string }> {
    const { count, locationCode } = addCopiesDto;

    // Check if book exists
    const book = await this.prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      this.logger.warn(`Book not found: ${bookId}`);
      throw new NotFoundException('Book not found');
    }

    // Create copies in a transaction for atomicity
    const copies = await this.prisma.$transaction(async (tx) => {
      // Get the current count of copies for this book to generate sequential codes
      const existingCopiesCount = await tx.bookCopy.count({
        where: { bookId },
      });

      // Generate unique copy codes: {bookISBN}-{sequential}
      // Remove hyphens from ISBN for cleaner codes
      const codePrefix = book.isbn.replace(/-/g, '');

      // Generate codes for all new copies
      const codes = Array.from(
        { length: count },
        (_, i) =>
          `${codePrefix}-${String(existingCopiesCount + i + 1).padStart(4, '0')}`,
      );

      // Create all copies with generated codes
      const createData = codes.map((code) => ({
        bookId,
        code,
        status: CopyStatus.AVAILABLE,
        locationCode: locationCode || null,
      }));

      // Batch create copies
      await tx.bookCopy.createMany({
        data: createData,
      });

      // Fetch the created copies to return to client
      const createdCopies = await tx.bookCopy.findMany({
        where: {
          bookId,
          code: {
            in: codes,
          },
        },
        orderBy: { code: 'asc' },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'copy.created',
          entityType: 'BookCopy',
          entityId: bookId, // Using bookId as the entity
          metadata: {
            bookId,
            bookTitle: book.title,
            bookISBN: book.isbn,
            count,
            locationCode,
            codes,
          },
        },
      });

      return createdCopies;
    });

    this.logger.log(
      `Successfully added ${count} copies to book: ${bookId} - ${book.title}`,
    );

    return {
      copies,
      message: `Successfully added ${count} ${count === 1 ? 'copy' : 'copies'} to ${book.title}`,
    };
  }

  /**
   * Update a book copy
   * Admin only endpoint
   * Validates business rules (e.g., cannot set status to AVAILABLE if copy has active loan)
   *
   * @param copyId Copy UUID
   * @param updateCopyDto Data to update
   * @param userId User ID of the actor (for audit logging)
   * @returns Updated copy
   * @throws NotFoundException if copy not found
   * @throws ConflictException if status change conflicts with active loan
   */
  async updateCopy(
    copyId: string,
    updateCopyDto: UpdateCopyDto,
    userId: string,
  ): Promise<BookCopy> {
    const { status, locationCode } = updateCopyDto;

    // Check if copy exists
    const existingCopy = await this.prisma.bookCopy.findUnique({
      where: { id: copyId },
      include: {
        book: true,
      },
    });

    if (!existingCopy) {
      this.logger.warn(`Copy not found: ${copyId}`);
      throw new NotFoundException('Copy not found');
    }

    // Business rule: Cannot set status to AVAILABLE if copy has an open loan
    if (status === CopyStatus.AVAILABLE && status !== existingCopy.status) {
      const hasActiveLoan = await this.prisma.loan.findFirst({
        where: {
          copyId,
          status: {
            in: [LoanStatus.APPROVED, LoanStatus.ACTIVE, LoanStatus.OVERDUE],
          },
        },
      });

      if (hasActiveLoan) {
        this.logger.warn(
          `Cannot set copy ${copyId} to AVAILABLE: has active loan ${hasActiveLoan.id}`,
        );
        throw new ConflictException(
          'Cannot set status to AVAILABLE. This copy has an active loan (APPROVED, ACTIVE, or OVERDUE).',
        );
      }
    }

    // Update copy and create audit log in a transaction
    const updatedCopy = await this.prisma.$transaction(async (tx) => {
      const copy = await tx.bookCopy.update({
        where: { id: copyId },
        data: {
          ...(status !== undefined && { status }),
          ...(locationCode !== undefined && { locationCode }),
        },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'copy.updated',
          entityType: 'BookCopy',
          entityId: copyId,
          metadata: {
            copyId,
            copyCode: existingCopy.code,
            bookId: existingCopy.bookId,
            bookTitle: existingCopy.book.title,
            before: {
              status: existingCopy.status,
              locationCode: existingCopy.locationCode,
            },
            after: {
              status: copy.status,
              locationCode: copy.locationCode,
            },
          },
        },
      });

      return copy;
    });

    this.logger.log(`Successfully updated copy: ${copyId}`);

    return updatedCopy;
  }

  /**
   * Delete a book copy
   * Admin only endpoint
   * Checks if copy has any loans (historical or active) before deletion
   *
   * @param copyId Copy UUID
   * @param userId User ID of the actor (for audit logging)
   * @throws NotFoundException if copy not found
   * @throws ConflictException if copy has loans
   */
  async deleteCopy(copyId: string, userId: string): Promise<void> {
    // Check if copy exists
    const existingCopy = await this.prisma.bookCopy.findUnique({
      where: { id: copyId },
      include: {
        book: true,
        loans: {
          take: 1, // Only need to check if any exist
        },
      },
    });

    if (!existingCopy) {
      this.logger.warn(`Copy not found: ${copyId}`);
      throw new NotFoundException('Copy not found');
    }

    // Check if copy has any loans (historical or active)
    if (existingCopy.loans.length > 0) {
      this.logger.warn(
        `Cannot delete copy ${copyId}: has historical or active loans`,
      );
      throw new ConflictException(
        'Cannot delete copy with historical or active loans. Copy has been loaned and must be kept for record-keeping purposes.',
      );
    }

    // Delete copy and create audit log in a transaction
    await this.prisma.$transaction(async (tx) => {
      await tx.bookCopy.delete({
        where: { id: copyId },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'copy.deleted',
          entityType: 'BookCopy',
          entityId: copyId,
          metadata: {
            copyId,
            copyCode: existingCopy.code,
            bookId: existingCopy.bookId,
            bookTitle: existingCopy.book.title,
            status: existingCopy.status,
            locationCode: existingCopy.locationCode,
          },
        },
      });
    });

    this.logger.log(`Successfully deleted copy: ${copyId}`);
  }
}
