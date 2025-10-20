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
