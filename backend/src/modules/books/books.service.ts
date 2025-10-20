/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Prisma,
  Book,
  Author,
  Category,
  BookStatus,
  CopyStatus,
  LoanStatus,
} from '@prisma/client';
import { CreateBookDto, UpdateBookDto, QueryBooksDto } from './dto';

/**
 * Book with related data for API responses
 */
export type BookWithRelations = Book & {
  authors: Author[];
  categories: Category[];
  availableCopies: number;
  totalCopies: number;
};

/**
 * Paginated response type for books
 */
export type PaginatedBooks = {
  items: BookWithRelations[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

/**
 * BooksService - Handles all book-related business logic
 * Implements CRUD operations with proper validation and error handling
 */
@Injectable()
export class BooksService {
  private readonly logger = new Logger(BooksService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * List books with pagination, search, filtering, and sorting
   * Public endpoint - accessible without authentication
   *
   * @param query Query parameters for filtering, sorting, and pagination
   * @returns Paginated list of books with authors, categories, and availability
   */
  async findAll(query: QueryBooksDto): Promise<PaginatedBooks> {
    const {
      q,
      authorId,
      categoryId,
      availability,
      sortBy,
      sortOrder,
      page,
      pageSize,
    } = query;

    // Build where clause for search and filters
    const where: Prisma.BookWhereInput = {
      status: BookStatus.ACTIVE,
      ...(q && {
        OR: [
          { title: { contains: q, mode: 'insensitive' } },
          {
            bookAuthors: {
              some: {
                author: {
                  name: { contains: q, mode: 'insensitive' },
                },
              },
            },
          },
        ],
      }),
      ...(authorId && {
        bookAuthors: {
          some: { authorId },
        },
      }),
      ...(categoryId && {
        bookCategories: {
          some: { categoryId },
        },
      }),
    };

    // Build orderBy clause
    let orderBy:
      | Prisma.BookOrderByWithRelationInput
      | Prisma.BookOrderByWithRelationInput[];
    if (sortBy === 'relevance') {
      // For relevance, prioritize recently created books (can be enhanced with full-text search scores)
      orderBy = { createdAt: 'desc' };
    } else {
      orderBy = { [sortBy]: sortOrder };
    }

    // Calculate pagination
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Execute queries in parallel
    const [books, total] = await Promise.all([
      this.prisma.book.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          bookAuthors: {
            include: {
              author: true,
            },
          },
          bookCategories: {
            include: {
              category: true,
            },
          },
        },
      }),
      this.prisma.book.count({ where }),
    ]);

    // Calculate available copies and total copies for each book
    const items = await Promise.all(
      books.map(async (book) => {
        const [availableCopies, totalCopies] = await Promise.all([
          this.calculateAvailableCopies(book.id),
          this.prisma.bookCopy.count({
            where: { bookId: book.id },
          }),
        ]);

        // Transform to BookWithRelations format
        const bookWithRelations: BookWithRelations = {
          ...book,
          authors: book.bookAuthors.map((ba) => ba.author),
          categories: book.bookCategories.map((bc) => bc.category),
          availableCopies,
          totalCopies,
        };

        // Remove junction table data from response
        delete (bookWithRelations as any).bookAuthors;
        delete (bookWithRelations as any).bookCategories;

        return bookWithRelations;
      }),
    );

    // Filter by availability if specified
    let filteredItems = items;
    if (availability !== undefined) {
      filteredItems = items.filter((item) =>
        availability ? item.availableCopies > 0 : item.availableCopies === 0,
      );
    }

    // Recalculate total and totalPages after availability filter
    const filteredTotal =
      availability !== undefined ? filteredItems.length : total;
    const totalPages = Math.ceil(filteredTotal / pageSize);

    return {
      items: filteredItems,
      page,
      pageSize,
      total: filteredTotal,
      totalPages,
    };
  }

  /**
   * Get a single book by ID with full details
   * Public endpoint - accessible without authentication
   * Returns 404 if book is ARCHIVED (unless admin)
   *
   * @param id Book UUID
   * @returns Book with authors, categories, and availability
   * @throws NotFoundException if book not found or archived
   */
  async findOne(id: string): Promise<BookWithRelations> {
    const book = await this.prisma.book.findUnique({
      where: { id },
      include: {
        bookAuthors: {
          include: {
            author: true,
          },
        },
        bookCategories: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!book) {
      this.logger.warn(`Book not found: ${id}`);
      throw new NotFoundException('Book not found');
    }

    // Hide archived books from public view
    if (book.status === BookStatus.ARCHIVED) {
      this.logger.warn(`Attempted to access archived book: ${id}`);
      throw new NotFoundException('Book not found');
    }

    // Calculate available copies and total copies
    const [availableCopies, totalCopies] = await Promise.all([
      this.calculateAvailableCopies(book.id),
      this.prisma.bookCopy.count({
        where: { bookId: book.id },
      }),
    ]);

    // Transform to BookWithRelations format
    const bookWithRelations: BookWithRelations = {
      ...book,
      authors: book.bookAuthors.map((ba) => ba.author),
      categories: book.bookCategories.map((bc) => bc.category),
      availableCopies,
      totalCopies,
    };

    // Remove junction table data from response
    delete (bookWithRelations as any).bookAuthors;
    delete (bookWithRelations as any).bookCategories;

    return bookWithRelations;
  }

  /**
   * Create a new book
   * Admin only - requires authentication and ADMIN role
   * Validates ISBN uniqueness and existence of authors and categories
   *
   * @param createBookDto Book data
   * @param userId User ID of the actor (for audit logging)
   * @returns Created book with relations
   * @throws ConflictException if ISBN already exists
   * @throws NotFoundException if author or category doesn't exist
   */
  async create(
    createBookDto: CreateBookDto,
    userId: string,
  ): Promise<BookWithRelations> {
    const { authorIds, categoryIds, ...bookData } = createBookDto;

    // Check ISBN uniqueness
    const existingBook = await this.prisma.book.findUnique({
      where: { isbn: bookData.isbn },
    });

    if (existingBook) {
      this.logger.warn(
        `Failed to create book: ISBN '${bookData.isbn}' already exists`,
      );
      throw new ConflictException('Book with this ISBN already exists');
    }

    try {
      // Create book and relationships in a transaction
      const book = await this.prisma.$transaction(async (tx) => {
        // 1. Validate authorIds exist
        const authors = await tx.author.findMany({
          where: { id: { in: authorIds } },
        });
        if (authors.length !== authorIds.length) {
          throw new NotFoundException(
            'One or more authors not found. Please verify all author IDs are valid.',
          );
        }

        // 2. Validate categoryIds exist
        const categories = await tx.category.findMany({
          where: { id: { in: categoryIds } },
        });
        if (categories.length !== categoryIds.length) {
          throw new NotFoundException(
            'One or more categories not found. Please verify all category IDs are valid.',
          );
        }

        // 3. Create book
        const newBook = await tx.book.create({
          data: {
            ...bookData,
            status: BookStatus.ACTIVE,
          },
        });

        // 4. Create BookAuthor relationships
        await tx.bookAuthor.createMany({
          data: authorIds.map((authorId) => ({
            bookId: newBook.id,
            authorId,
          })),
        });

        // 5. Create BookCategory relationships
        await tx.bookCategory.createMany({
          data: categoryIds.map((categoryId) => ({
            bookId: newBook.id,
            categoryId,
          })),
        });

        // 6. Audit log
        await tx.auditLog.create({
          data: {
            userId,
            action: 'book.created',
            entityType: 'Book',
            entityId: newBook.id,
            metadata: {
              title: newBook.title,
              isbn: newBook.isbn,
              authorIds,
              categoryIds,
            },
          },
        });

        // 7. Fetch the complete book with relations
        const bookWithRelations = await tx.book.findUnique({
          where: { id: newBook.id },
          include: {
            bookAuthors: {
              include: {
                author: true,
              },
            },
            bookCategories: {
              include: {
                category: true,
              },
            },
          },
        });

        return bookWithRelations!;
      });

      this.logger.log(`Successfully created book: ${book.id} - ${book.title}`);

      // Transform to BookWithRelations format
      const bookWithRelations: BookWithRelations = {
        ...book,
        authors: book.bookAuthors.map((ba) => ba.author),
        categories: book.bookCategories.map((bc) => bc.category),
        availableCopies: 0, // New book has no copies yet
        totalCopies: 0,
      };

      // Remove junction table data from response
      delete (bookWithRelations as any).bookAuthors;
      delete (bookWithRelations as any).bookCategories;

      return bookWithRelations;
    } catch (error) {
      // Re-throw known exceptions
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Update an existing book
   * Admin only - requires authentication and ADMIN role
   * Validates ISBN uniqueness if changed
   * Replaces author and category relationships if provided
   *
   * @param id Book UUID
   * @param updateBookDto Book data to update
   * @param userId User ID of the actor (for audit logging)
   * @returns Updated book with relations
   * @throws NotFoundException if book not found
   * @throws ConflictException if new ISBN already exists
   */
  async update(
    id: string,
    updateBookDto: UpdateBookDto,
    userId: string,
  ): Promise<BookWithRelations> {
    const { authorIds, categoryIds, ...bookData } = updateBookDto;

    // Check if book exists
    const existingBook = await this.prisma.book.findUnique({
      where: { id },
      include: {
        bookAuthors: {
          include: {
            author: true,
          },
        },
        bookCategories: {
          include: {
            category: true,
          },
        },
      },
    });

    if (!existingBook) {
      this.logger.warn(`Book not found: ${id}`);
      throw new NotFoundException('Book not found');
    }

    // If ISBN is being changed, check uniqueness
    if (bookData.isbn && bookData.isbn !== existingBook.isbn) {
      const bookWithSameISBN = await this.prisma.book.findUnique({
        where: { isbn: bookData.isbn },
      });

      if (bookWithSameISBN) {
        this.logger.warn(
          `Failed to update book ${id}: ISBN '${bookData.isbn}' already exists`,
        );
        throw new ConflictException('Book with this ISBN already exists');
      }
    }

    try {
      // Update book and relationships in a transaction
      const book = await this.prisma.$transaction(async (tx) => {
        // 1. If authorIds provided, validate and replace relationships
        if (authorIds) {
          const authors = await tx.author.findMany({
            where: { id: { in: authorIds } },
          });
          if (authors.length !== authorIds.length) {
            throw new NotFoundException(
              'One or more authors not found. Please verify all author IDs are valid.',
            );
          }

          // Delete old relationships and create new ones
          await tx.bookAuthor.deleteMany({
            where: { bookId: id },
          });
          await tx.bookAuthor.createMany({
            data: authorIds.map((authorId) => ({
              bookId: id,
              authorId,
            })),
          });
        }

        // 2. If categoryIds provided, validate and replace relationships
        if (categoryIds) {
          const categories = await tx.category.findMany({
            where: { id: { in: categoryIds } },
          });
          if (categories.length !== categoryIds.length) {
            throw new NotFoundException(
              'One or more categories not found. Please verify all category IDs are valid.',
            );
          }

          // Delete old relationships and create new ones
          await tx.bookCategory.deleteMany({
            where: { bookId: id },
          });
          await tx.bookCategory.createMany({
            data: categoryIds.map((categoryId) => ({
              bookId: id,
              categoryId,
            })),
          });
        }

        // 3. Update book fields
        const updatedBook = await tx.book.update({
          where: { id },
          data: bookData,
        });

        // 4. Audit log with old and new values
        await tx.auditLog.create({
          data: {
            userId,
            action: 'book.updated',
            entityType: 'Book',
            entityId: updatedBook.id,
            metadata: {
              before: {
                title: existingBook.title,
                isbn: existingBook.isbn,
                authorIds: existingBook.bookAuthors.map((ba) => ba.authorId),
                categoryIds: existingBook.bookCategories.map(
                  (bc) => bc.categoryId,
                ),
              },
              after: {
                title: updatedBook.title,
                isbn: updatedBook.isbn,
                ...(authorIds && { authorIds }),
                ...(categoryIds && { categoryIds }),
              },
            },
          },
        });

        // 5. Fetch the complete book with relations
        const bookWithRelations = await tx.book.findUnique({
          where: { id },
          include: {
            bookAuthors: {
              include: {
                author: true,
              },
            },
            bookCategories: {
              include: {
                category: true,
              },
            },
          },
        });

        return bookWithRelations!;
      });

      this.logger.log(`Successfully updated book: ${id}`);

      // Calculate available copies and total copies
      const [availableCopies, totalCopies] = await Promise.all([
        this.calculateAvailableCopies(book.id),
        this.prisma.bookCopy.count({
          where: { bookId: book.id },
        }),
      ]);

      // Transform to BookWithRelations format
      const bookWithRelations: BookWithRelations = {
        ...book,
        authors: book.bookAuthors.map((ba) => ba.author),
        categories: book.bookCategories.map((bc) => bc.category),
        availableCopies,
        totalCopies,
      };

      // Remove junction table data from response
      delete (bookWithRelations as any).bookAuthors;
      delete (bookWithRelations as any).bookCategories;

      return bookWithRelations;
    } catch (error) {
      // Re-throw known exceptions
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw error;
    }
  }

  /**
   * Delete a book
   * Admin only - requires authentication and ADMIN role
   * Checks if book has any loans (historical or active) before deletion
   * If loans exist, returns error suggesting to archive instead
   *
   * @param id Book UUID
   * @param userId User ID of the actor (for audit logging)
   * @throws NotFoundException if book not found
   * @throws ConflictException if book has loans
   */
  async remove(id: string, userId: string): Promise<void> {
    // Check if book exists
    const existingBook = await this.prisma.book.findUnique({
      where: { id },
      include: {
        loans: {
          take: 1, // Only need to check if any exist
        },
      },
    });

    if (!existingBook) {
      this.logger.warn(`Book not found: ${id}`);
      throw new NotFoundException('Book not found');
    }

    // Check if book has any loans
    if (existingBook.loans.length > 0) {
      this.logger.warn(
        `Cannot delete book ${id}: has historical or active loans`,
      );
      throw new ConflictException(
        'Cannot delete book with historical loans. Please archive the book instead by setting status to ARCHIVED.',
      );
    }

    // Delete book and create audit log in a transaction
    // Book deletion will cascade to BookAuthor and BookCategory relationships
    await this.prisma.$transaction(async (tx) => {
      // Delete the book (cascades to bookAuthors and bookCategories)
      await tx.book.delete({
        where: { id },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'book.deleted',
          entityType: 'Book',
          entityId: id,
          metadata: {
            title: existingBook.title,
            isbn: existingBook.isbn,
          },
        },
      });
    });

    this.logger.log(`Successfully deleted book: ${id}`);
  }

  /**
   * Calculate available copies for a book
   * A copy is available if:
   * - status is AVAILABLE
   * - has no active loans (APPROVED, ACTIVE, or OVERDUE status)
   *
   * @param bookId Book UUID
   * @returns Number of available copies
   */
  private async calculateAvailableCopies(bookId: string): Promise<number> {
    const availableCopies = await this.prisma.bookCopy.count({
      where: {
        bookId,
        status: CopyStatus.AVAILABLE,
        loans: {
          none: {
            status: {
              in: [LoanStatus.APPROVED, LoanStatus.ACTIVE, LoanStatus.OVERDUE],
            },
          },
        },
      },
    });

    return availableCopies;
  }
}
