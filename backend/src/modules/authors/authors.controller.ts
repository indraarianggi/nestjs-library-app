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
import { AuthorsService, PaginatedAuthors } from './authors.service';
import type { CreateAuthorDto, UpdateAuthorDto } from './dto';
import {
  createAuthorSchema,
  updateAuthorSchema,
  queryAuthorsSchema,
} from './dto';
import { Author, Role } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

/**
 * AuthorsController - Handles HTTP requests for author management
 * Implements CRUD operations with proper authorization
 */
@ApiTags('Authors')
@Controller('authors')
@UseGuards(RolesGuard)
export class AuthorsController {
  constructor(private readonly authorsService: AuthorsService) {}

  /**
   * GET /api/authors
   * List all authors with pagination, search, and sorting
   * Public endpoint - accessible without authentication
   *
   * @param query Query parameters for filtering, sorting, and pagination
   * @returns Paginated list of authors
   */
  @ApiOperation({
    summary: 'List all authors',
    description:
      'Retrieves a paginated list of authors with search and sorting.',
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
    description: 'Search query for author name',
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
    description: 'Authors retrieved successfully',
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
  ): Promise<PaginatedAuthors> {
    // Validate query parameters
    const validationResult = queryAuthorsSchema.safeParse(queryParams);
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

    return this.authorsService.findAll(validationResult.data);
  }

  /**
   * POST /api/authors
   * Create a new author
   * Admin only - requires authentication and ADMIN role
   *
   * @param createAuthorDto Author data
   * @param user Current authenticated user (from JWT)
   * @returns Created author
   */
  @ApiOperation({
    summary: 'Create a new author',
    description: 'Creates a new author. Admin only.',
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
          maxLength: 200,
          example: 'F. Scott Fitzgerald',
        },
        biography: {
          type: 'string',
          nullable: true,
          example: 'American novelist and short story writer',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Author created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or author already exists',
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
    @Body(new ZodValidationPipe(createAuthorSchema))
    createAuthorDto: CreateAuthorDto,
    @CurrentUser() user: { userId: string; role: Role },
  ): Promise<{ author: Author }> {
    const author = await this.authorsService.create(
      createAuthorDto,
      user.userId,
    );
    return { author };
  }

  /**
   * PATCH /api/authors/:id
   * Update an existing author
   * Admin only - requires authentication and ADMIN role
   *
   * @param id Author UUID
   * @param updateAuthorDto Author data to update
   * @param user Current authenticated user (from JWT)
   * @returns Updated author
   */
  @ApiOperation({
    summary: 'Update an author',
    description: 'Updates an existing author. Admin only.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Author UUID',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: { type: 'string', minLength: 1, maxLength: 200 },
        biography: { type: 'string', nullable: true },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Author updated successfully',
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
    description: 'Author not found',
  })
  @Roles(Role.ADMIN)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateAuthorSchema))
    updateAuthorDto: UpdateAuthorDto,
    @CurrentUser() user: { userId: string; role: Role },
  ): Promise<{ author: Author }> {
    const author = await this.authorsService.update(
      id,
      updateAuthorDto,
      user.userId,
    );
    return { author };
  }

  /**
   * DELETE /api/authors/:id
   * Delete an author
   * Admin only - requires authentication and ADMIN role
   * Checks if author is referenced by any books before deletion
   *
   * @param id Author UUID
   * @param user Current authenticated user (from JWT)
   * @returns No content (204)
   */
  @ApiOperation({
    summary: 'Delete an author',
    description:
      'Deletes an author if not referenced by any books. Admin only.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Author UUID',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Author deleted successfully',
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
    description: 'Author not found',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Author is referenced by books and cannot be deleted',
  })
  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(
    @Param('id') id: string,
    @CurrentUser() user: { userId: string; role: Role },
  ): Promise<void> {
    await this.authorsService.remove(id, user.userId);
  }
}
