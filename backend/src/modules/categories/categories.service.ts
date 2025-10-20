import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma, Category } from '@prisma/client';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  QueryCategoriesDto,
} from './dto';

/**
 * Paginated response type for categories
 */
export type PaginatedCategories = {
  items: Category[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
};

/**
 * CategoriesService - Handles all category-related business logic
 * Implements CRUD operations with proper validation and error handling
 */
@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private prisma: PrismaService) {}

  /**
   * List categories with pagination, search, and sorting
   * Public endpoint - accessible without authentication
   *
   * @param query Query parameters for filtering, sorting, and pagination
   * @returns Paginated list of categories
   */
  async findAll(query: QueryCategoriesDto): Promise<PaginatedCategories> {
    const { q, sortBy, sortOrder, page, pageSize } = query;

    // Build where clause for search
    const where: Prisma.CategoryWhereInput = q
      ? {
          name: {
            contains: q,
            mode: 'insensitive',
          },
        }
      : {};

    // Build orderBy clause
    const orderBy: Prisma.CategoryOrderByWithRelationInput = {
      [sortBy]: sortOrder,
    };

    // Calculate pagination
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    // Execute queries in parallel
    const [items, total] = await Promise.all([
      this.prisma.category.findMany({
        where,
        orderBy,
        skip,
        take,
      }),
      this.prisma.category.count({ where }),
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
   * Create a new category
   * Admin only - requires authentication and ADMIN role
   * Validates name uniqueness
   *
   * @param createCategoryDto Category data
   * @param userId User ID of the actor (for audit logging)
   * @returns Created category
   * @throws ConflictException if category name already exists
   */
  async create(
    createCategoryDto: CreateCategoryDto,
    userId: string,
  ): Promise<Category> {
    try {
      // Create category and audit log in a transaction
      const category = await this.prisma.$transaction(async (tx) => {
        // Create the category
        const newCategory = await tx.category.create({
          data: {
            name: createCategoryDto.name,
            description: createCategoryDto.description,
          },
        });

        // Create audit log
        await tx.auditLog.create({
          data: {
            userId,
            action: 'category.created',
            entityType: 'Category',
            entityId: newCategory.id,
            metadata: {
              name: newCategory.name,
              description: newCategory.description,
            },
          },
        });

        return newCategory;
      });

      return category;
    } catch (error) {
      // Handle unique constraint violation
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        this.logger.warn(
          `Failed to create category: name '${createCategoryDto.name}' already exists`,
        );
        throw new ConflictException('Category with this name already exists');
      }
      throw error;
    }
  }

  /**
   * Update an existing category
   * Admin only - requires authentication and ADMIN role
   * Validates name uniqueness if name is changed
   *
   * @param id Category UUID
   * @param updateCategoryDto Category data to update
   * @param userId User ID of the actor (for audit logging)
   * @returns Updated category
   * @throws NotFoundException if category not found
   * @throws ConflictException if new name already exists
   */
  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
    userId: string,
  ): Promise<Category> {
    // Check if category exists
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
    });

    if (!existingCategory) {
      this.logger.warn(`Category not found: ${id}`);
      throw new NotFoundException('Category not found');
    }

    try {
      // Update category and create audit log in a transaction
      const category = await this.prisma.$transaction(async (tx) => {
        // Update the category
        const updatedCategory = await tx.category.update({
          where: { id },
          data: updateCategoryDto,
        });

        // Create audit log
        await tx.auditLog.create({
          data: {
            userId,
            action: 'category.updated',
            entityType: 'Category',
            entityId: updatedCategory.id,
            metadata: {
              before: {
                name: existingCategory.name,
                description: existingCategory.description,
              },
              after: {
                name: updatedCategory.name,
                description: updatedCategory.description,
              },
            },
          },
        });

        return updatedCategory;
      });

      this.logger.log(`Successfully updated category: ${id}`);
      return category;
    } catch (error) {
      // Handle unique constraint violation
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        this.logger.warn(
          `Failed to update category ${id}: name already exists`,
        );
        throw new ConflictException('Category with this name already exists');
      }
      throw error;
    }
  }

  /**
   * Delete a category
   * Admin only - requires authentication and ADMIN role
   * Checks if category is referenced by any books before deletion
   *
   * @param id Category UUID
   * @param userId User ID of the actor (for audit logging)
   * @throws NotFoundException if category not found
   * @throws ConflictException if category is referenced by books
   */
  async remove(id: string, userId: string): Promise<void> {
    // Check if category exists
    const existingCategory = await this.prisma.category.findUnique({
      where: { id },
      include: {
        bookCategories: {
          take: 1, // Only need to check if any exist
        },
      },
    });

    if (!existingCategory) {
      this.logger.warn(`Category not found: ${id}`);
      throw new NotFoundException('Category not found');
    }

    // Check if category is referenced by any books
    if (existingCategory.bookCategories.length > 0) {
      this.logger.warn(
        `Cannot delete category ${id}: referenced by existing books`,
      );
      throw new ConflictException(
        'Cannot delete category referenced by existing books',
      );
    }

    // Delete category and create audit log in a transaction
    await this.prisma.$transaction(async (tx) => {
      // Delete the category
      await tx.category.delete({
        where: { id },
      });

      // Create audit log
      await tx.auditLog.create({
        data: {
          userId,
          action: 'category.deleted',
          entityType: 'Category',
          entityId: id,
          metadata: {
            name: existingCategory.name,
          },
        },
      });
    });

    this.logger.log(`Successfully deleted category: ${id}`);
  }
}
