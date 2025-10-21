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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
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
@ApiTags('Categories')
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
  @ApiOperation({
    summary: 'List all categories',
    description:
      'Retrieves a paginated list of categories with search and sorting.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    type: String,
    description: 'Search query for category name',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['name', 'createdAt'],
    description: 'Sort field',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Categories retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid query parameters',
  })
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
  @ApiOperation({
    summary: 'Create a new category',
    description: 'Creates a new category. Admin only.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['name'],
      properties: {
        name: {
          type: 'string',
          minLength: 1,
          maxLength: 100,
          example: 'Fiction',
        },
        description: {
          type: 'string',
          nullable: true,
          example: 'Fictional literature including novels and short stories',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Category created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or category already exists',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Not authorized (ADMIN only)',
  })
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
  @ApiOperation({
    summary: 'Update a category',
    description: 'Updates an existing category. Admin only.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Category UUID',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 100 },
        description: { type: 'string', nullable: true },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Category updated successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Not authorized (ADMIN only)',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
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
  @ApiOperation({
    summary: 'Delete a category',
    description:
      'Deletes a category if not referenced by any books. Admin only.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Category UUID',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Category deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Not authorized (ADMIN only)',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Category not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Category is referenced by books and cannot be deleted',
  })
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
