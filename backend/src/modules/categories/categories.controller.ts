import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { CategoriesService, PaginatedCategories } from './categories.service';
import type { CreateCategoryDto, UpdateCategoryDto } from './dto';
import {
  createCategorySchema,
  updateCategorySchema,
  queryCategoriesSchema,
} from './dto';
import { Category, Role } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

/**
 * CategoriesController - Handles HTTP requests for category management
 * Implements CRUD operations with proper authorization
 */
@Controller('categories')
@UseGuards(RolesGuard)
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  /**
   * GET /api/categories
   * List all categories with pagination, search, and sorting
   * Public endpoint - accessible without authentication
   *
   * @param query Query parameters for filtering, sorting, and pagination
   * @returns Paginated list of categories
   */
  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() queryParams: Record<string, any>,
  ): Promise<PaginatedCategories> {
    // Validate query parameters
    const validationResult = queryCategoriesSchema.safeParse(queryParams);
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

    return this.categoriesService.findAll(validationResult.data);
  }

  /**
   * POST /api/categories
   * Create a new category
   * Admin only - requires authentication and ADMIN role
   *
   * @param createCategoryDto Category data
   * @param user Current authenticated user (from JWT)
   * @returns Created category
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ADMIN)
  async create(
    @Body(new ZodValidationPipe(createCategorySchema))
    createCategoryDto: CreateCategoryDto,
    @CurrentUser() user: { userId: string; role: Role },
  ): Promise<{ category: Category }> {
    console.log('LOGGED IN USER:', user);
    const category = await this.categoriesService.create(
      createCategoryDto,
      user.userId,
    );
    return { category };
  }

  /**
   * PATCH /api/categories/:id
   * Update an existing category
   * Admin only - requires authentication and ADMIN role
   *
   * @param id Category UUID
   * @param updateCategoryDto Category data to update
   * @param user Current authenticated user (from JWT)
   * @returns Updated category
   */
  @Roles(Role.ADMIN)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateCategorySchema))
    updateCategoryDto: UpdateCategoryDto,
    @CurrentUser() user: { userId: string; role: Role },
  ): Promise<{ category: Category }> {
    const category = await this.categoriesService.update(
      id,
      updateCategoryDto,
      user.userId,
    );
    return { category };
  }

  /**
   * DELETE /api/categories/:id
   * Delete a category
   * Admin only - requires authentication and ADMIN role
   * Checks if category is referenced by any books before deletion
   *
   * @param id Category UUID
   * @param user Current authenticated user (from JWT)
   * @returns No content (204)
   */
  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; role: Role },
  ): Promise<void> {
    await this.categoriesService.remove(id, user.userId);
  }
}
