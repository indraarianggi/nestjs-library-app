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
  BooksService,
  PaginatedBooks,
  BookWithRelations,
} from './books.service';
import type { CreateBookDto, UpdateBookDto } from './dto';
import { createBookSchema, updateBookSchema, queryBooksSchema } from './dto';
import { Role } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

/**
 * BooksController - Handles HTTP requests for book management
 * Implements CRUD operations with proper authorization
 */
@Controller('books')
@UseGuards(RolesGuard)
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  /**
   * GET /api/books
   * List all books with pagination, search, filtering, and sorting
   * Public endpoint - accessible without authentication
   *
   * Supports:
   * - Search by title and author name (q parameter)
   * - Filter by authorId, categoryId, availability
   * - Sort by title, createdAt, relevance
   * - Pagination with page and pageSize
   *
   * @param query Query parameters for filtering, sorting, and pagination
   * @returns Paginated list of books with authors, categories, and availability
   */
  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  async findAll(
    @Query() queryParams: Record<string, any>,
  ): Promise<PaginatedBooks> {
    // Validate query parameters
    const validationResult = queryBooksSchema.safeParse(queryParams);
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

    return this.booksService.findAll(validationResult.data);
  }

  /**
   * GET /api/books/:id
   * Get a single book by ID with full details
   * Public endpoint - accessible without authentication
   * Returns 404 if book is ARCHIVED
   *
   * @param id Book UUID
   * @returns Book with authors, categories, and availability
   */
  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  async findOne(@Param('id') id: string): Promise<{ book: BookWithRelations }> {
    const book = await this.booksService.findOne(id);
    return { book };
  }

  /**
   * POST /api/books
   * Create a new book
   * Admin only - requires authentication and ADMIN role
   *
   * Validates:
   * - All required fields (title, isbn, authorIds, categoryIds)
   * - ISBN format (ISBN-10 or ISBN-13)
   * - ISBN uniqueness
   * - Existence of all specified authors and categories
   *
   * @param createBookDto Book data
   * @param user Current authenticated user (from JWT)
   * @returns Created book with relations
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Roles(Role.ADMIN)
  async create(
    @Body(new ZodValidationPipe(createBookSchema))
    createBookDto: CreateBookDto,
    @CurrentUser() user: { userId: string; role: Role },
  ): Promise<{ book: BookWithRelations }> {
    const book = await this.booksService.create(createBookDto, user.userId);
    return { book };
  }

  /**
   * PATCH /api/books/:id
   * Update an existing book
   * Admin only - requires authentication and ADMIN role
   *
   * Validates:
   * - ISBN format if changed
   * - ISBN uniqueness if changed
   * - Existence of all specified authors and categories if provided
   * - At least one author and category if relationships are being replaced
   *
   * @param id Book UUID
   * @param updateBookDto Book data to update
   * @param user Current authenticated user (from JWT)
   * @returns Updated book with relations
   */
  @Roles(Role.ADMIN)
  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateBookSchema))
    updateBookDto: UpdateBookDto,
    @CurrentUser() user: { userId: string; role: Role },
  ): Promise<{ book: BookWithRelations }> {
    const book = await this.booksService.update(id, updateBookDto, user.userId);
    return { book };
  }

  /**
   * DELETE /api/books/:id
   * Delete a book
   * Admin only - requires authentication and ADMIN role
   *
   * Checks if book has any loans (historical or active) before deletion
   * If loans exist, returns 409 error with message to archive instead
   * Book deletion cascades to BookAuthor and BookCategory relationships
   *
   * @param id Book UUID
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
    await this.booksService.remove(id, user.userId);
  }
}
