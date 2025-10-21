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
@ApiTags('Books')
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
  @ApiOperation({
    summary: 'List all books',
    description:
      'Retrieves a paginated list of books with support for search, filtering, and sorting. Public endpoint accessible without authentication.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    description: 'Items per page (default: 10, max: 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'q',
    required: false,
    type: String,
    description: 'Search query for title and author name',
  })
  @ApiQuery({
    name: 'authorId',
    required: false,
    type: String,
    description: 'Filter by author UUID',
  })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    type: String,
    description: 'Filter by category UUID',
  })
  @ApiQuery({
    name: 'availability',
    required: false,
    enum: ['AVAILABLE', 'BORROWED', 'RESERVED', 'ALL'],
    description: 'Filter by availability status',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['title', 'createdAt', 'relevance'],
    description:
      'Sort field (default: relevance if searching, createdAt otherwise)',
  })
  @ApiQuery({
    name: 'sortOrder',
    required: false,
    enum: ['asc', 'desc'],
    description: 'Sort order (default: asc)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Books retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        books: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              title: { type: 'string', example: 'The Great Gatsby' },
              subtitle: { type: 'string', nullable: true },
              description: { type: 'string', nullable: true },
              isbn: { type: 'string', example: '978-0743273565' },
              publicationYear: {
                type: 'number',
                nullable: true,
                example: 1925,
              },
              language: { type: 'string', nullable: true, example: 'English' },
              coverImageUrl: { type: 'string', format: 'uri', nullable: true },
              status: {
                type: 'string',
                enum: ['ACTIVE', 'ARCHIVED'],
                example: 'ACTIVE',
              },
              authors: { type: 'array', items: { type: 'object' } },
              categories: { type: 'array', items: { type: 'object' } },
              availableCopies: { type: 'number', example: 3 },
              totalCopies: { type: 'number', example: 5 },
            },
          },
        },
        pagination: {
          type: 'object',
          properties: {
            page: { type: 'number', example: 1 },
            pageSize: { type: 'number', example: 10 },
            totalItems: { type: 'number', example: 100 },
            totalPages: { type: 'number', example: 10 },
          },
        },
      },
    },
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
  @ApiOperation({
    summary: 'Get a book by ID',
    description:
      'Retrieves detailed information about a specific book including authors, categories, and copy availability.',
  })
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Book UUID',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Book retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        book: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            title: { type: 'string' },
            subtitle: { type: 'string', nullable: true },
            description: { type: 'string', nullable: true },
            isbn: { type: 'string' },
            publicationYear: { type: 'number', nullable: true },
            language: { type: 'string', nullable: true },
            coverImageUrl: { type: 'string', format: 'uri', nullable: true },
            status: { type: 'string', enum: ['ACTIVE', 'ARCHIVED'] },
            authors: { type: 'array', items: { type: 'object' } },
            categories: { type: 'array', items: { type: 'object' } },
            availableCopies: { type: 'number' },
            totalCopies: { type: 'number' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Book not found or archived',
  })
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
  @ApiOperation({
    summary: 'Create a new book',
    description:
      'Creates a new book in the catalog. Admin only. Validates ISBN format and uniqueness.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiBody({
    description: 'Book data',
    schema: {
      type: 'object',
      required: ['title', 'isbn', 'authorIds', 'categoryIds'],
      properties: {
        title: {
          type: 'string',
          minLength: 1,
          maxLength: 500,
          example: 'The Great Gatsby',
        },
        subtitle: { type: 'string', maxLength: 500, nullable: true },
        description: { type: 'string', nullable: true },
        isbn: {
          type: 'string',
          example: '978-0743273565',
          description: 'ISBN-10 or ISBN-13',
        },
        publicationYear: {
          type: 'number',
          minimum: 1000,
          nullable: true,
          example: 1925,
        },
        language: {
          type: 'string',
          maxLength: 50,
          nullable: true,
          example: 'English',
        },
        coverImageUrl: { type: 'string', format: 'uri', nullable: true },
        authorIds: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          minItems: 1,
        },
        categoryIds: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
          minItems: 1,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Book created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid input data or ISBN already exists',
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
  @ApiOperation({
    summary: 'Update a book',
    description:
      'Updates an existing book. Admin only. All fields are optional.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Book UUID',
  })
  @ApiBody({
    description: 'Book data to update (all fields optional)',
    schema: {
      type: 'object',
      properties: {
        title: { type: 'string', minLength: 1, maxLength: 500 },
        subtitle: { type: 'string', maxLength: 500, nullable: true },
        description: { type: 'string', nullable: true },
        isbn: { type: 'string', description: 'ISBN-10 or ISBN-13' },
        publicationYear: { type: 'number', minimum: 1000, nullable: true },
        language: { type: 'string', maxLength: 50, nullable: true },
        coverImageUrl: { type: 'string', format: 'uri', nullable: true },
        status: { type: 'string', enum: ['ACTIVE', 'ARCHIVED'] },
        authorIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
        categoryIds: {
          type: 'array',
          items: { type: 'string', format: 'uuid' },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Book updated successfully',
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
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Book not found' })
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
  @ApiOperation({
    summary: 'Delete a book',
    description:
      'Permanently deletes a book if it has no loan history. If loans exist, the book should be archived instead. Admin only.',
  })
  @ApiBearerAuth('JWT-auth')
  @ApiParam({
    name: 'id',
    type: String,
    format: 'uuid',
    description: 'Book UUID',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Book deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Not authenticated',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Not authorized (ADMIN only)',
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Book not found' })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description:
      'Book has loan history and cannot be deleted. Archive it instead.',
  })
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
