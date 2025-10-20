import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Author } from '@prisma/client';
import { CreateAuthorDto, UpdateAuthorDto, QueryAuthorsDto } from './dto';

/**
 * Paginated response type for authors
 */
export type PaginatedAuthors = {
  items: Author[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

/**
 * AuthorsService - Handles all author-related business logic
 * Implements CRUD operations with proper validation and error handling
 */
@Injectable()
export class AuthorsService {
  private readonly logger = new Logger(AuthorsService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * List authors with pagination, search, and sorting
   * Public endpoint - accessible without authentication
   *
   * @param query Query parameters for filtering, sorting, and pagination
   * @returns Paginated list of authors
   */
  async findAll(query: QueryAuthorsDto): Promise<PaginatedAuthors> {
    const { q, sortBy, sortOrder, page, pageSize } = query;

    // Build where clause for search
    const where: Prisma.AuthorWhereInput = q
      ? {
          name: {
            contains: q,
            mode: 'insensitive',
          },
        }
      : {};

    // Build orderBy clause
    const orderBy: Prisma.AuthorOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    // Calculate pagination
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Execute queries in parallel
    const [items, total] = await Promise.all([
      this.prisma.author.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      this.prisma.author.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      items,
      page,
      pageSize,
      total,
      totalPages,
    };
  }

  /**
   * Create a new author
   * Admin only - requires authentication and ADMIN role
   * Validates name uniqueness
   *
   * @param createAuthorDto Author data
   * @param userId User ID of the actor (for audit logging)
   * @returns Created author
   * @throws ConflictException if author name already exists
   */
  async create(
    createAuthorDto: CreateAuthorDto,
    userId: string,
  ): Promise<Author> {
    try {
      // Create author and audit log in a transaction
      const author = await this.prisma.$transaction(async (tx) => {
        // Create the author
        const newAuthor = await tx.author.create({
          data: {
            name: createAuthorDto.name,
            bio: createAuthorDto.bio,
          },
        });

        // Create audit log
        await tx.auditLog.create({
          data: {
            userId,
            action: 'author.created',
            entityType: 'Author',
            entityId: newAuthor.id,
            metadata: {
              name: newAuthor.name,
            },
          },
        });

        return newAuthor;
      });

      return author;
    } catch (error) {
      // Handle unique constraint violation
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        this.logger.warn(
          `Failed to create author: name '${createAuthorDto.name}' already exists`,
        );
        throw new ConflictException('Author with this name already exists');
      }
      throw error;
    }
  }

  /**
   * Update an existing author
   * Admin only - requires authentication and ADMIN role
   * Validates name uniqueness if name is changed
   *
   * @param id Author UUID
   * @param updateAuthorDto Author data to update
   * @param userId User ID of the actor (for audit logging)
   * @returns Updated author
   * @throws NotFoundException if author not found
   * @throws ConflictException if new name already exists
   */
  async update(
    id: string,
    updateAuthorDto: UpdateAuthorDto,
    userId: string,
  ): Promise<Author> {
    // Check if author exists
    const existingAuthor = await this.prisma.author.findUnique({
      where: { id },
    });

    if (!existingAuthor) {
      this.logger.warn(`Author not found: ${id}`);
      throw new NotFoundException('Author not found');
    }

    try {
      // Update author and create audit log in a transaction
      const author = await this.prisma.$transaction(async (tx) => {
        // Update the author
        const updatedAuthor = await tx.author.update({
          where: { id },
          data: updateAuthorDto,
        });

        // Create audit log
        await tx.auditLog.create({
          data: {
            userId,
            action: 'author.updated',
            entityType: 'Author',
            entityId: updatedAuthor.id,
            metadata: {
              before: {
                name: existingAuthor.name,
                bio: existingAuthor.bio,
              },
              after: {
                name: updatedAuthor.name,
                bio: updatedAuthor.bio,
              },
            },
          },
        });

        return updatedAuthor;
      });

      this.logger.log(`Successfully updated author: ${id}`);
      return author;
    } catch (error) {
      // Handle unique constraint violation
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        this.logger.warn(`Failed to update author ${id}: name already exists`);
        throw new ConflictException('Author with this name already exists');
      }
      throw error;
    }
  }

  /**
   * Delete an author
   * Admin only - requires authentication and ADMIN role
   * Checks if author is referenced by any books before deletion
   *
   * @param id Author UUID
   * @param userId User ID of the actor (for audit logging)
   * @throws NotFoundException if author not found
   * @throws ConflictException if author is referenced by books
   */
  async remove(id: string, userId: string): Promise<void> {
    // Check if author exists
    const existingAuthor = await this.prisma.author.findUnique({
      where: { id },
      include: {
        bookAuthors: {
          take: 1, // Only need to check if any exist
        },
      },
    });

    if (!existingAuthor) {
      this.logger.warn(`Author not found: ${id}`);
      throw new NotFoundException('Author not found');
    }

    // Check if author is referenced by any books
    if (existingAuthor.bookAuthors.length > 0) {
      this.logger.warn(
        `Cannot delete author ${id}: referenced by existing books`,
      );
      throw new ConflictException(
        'Cannot delete author referenced by existing books',
      );
    }

    // Delete author and create audit log in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Delete the author
      await tx.author.delete({
        where: { id },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'author.deleted',
          entityType: 'Author',
          entityId: id,
          metadata: {
            name: existingAuthor.name,
          },
        },
      });
    });

    this.logger.log(`Successfully deleted author: ${id}`);
  }
}
