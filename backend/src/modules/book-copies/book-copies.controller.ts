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
import { BookCopiesService, PaginatedCopies } from './book-copies.service';
import type { AddCopiesDto, UpdateCopyDto } from './dto';
import { queryCopiesSchema, addCopiesSchema, updateCopySchema } from './dto';
import { Role, BookCopy } from '@prisma/client';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

/**
 * BookCopiesController - Handles HTTP requests for book copy management
 * All endpoints are admin-only
 */
@Controller()
@UseGuards(RolesGuard)
export class BookCopiesController {
  constructor(private readonly bookCopiesService: BookCopiesService) {}

  /**
   * GET /api/books/:id/copies
   * List all copies for a specific book with pagination and filtering
   * Admin only - requires authentication and ADMIN role
   *
   * Supports:
   * - Filter by status (AVAILABLE, ON_LOAN, LOST, DAMAGED)
   * - Pagination with page and pageSize
   *
   * @param id Book UUID
   * @param queryParams Query parameters for filtering and pagination
   * @returns Paginated list of book copies
   */
  @Roles(Role.ADMIN)
  @Get('books/:id/copies')
  @HttpCode(HttpStatus.OK)
  async findCopiesForBook(
    @Param('id') id: string,
    @Query() queryParams: Record<string, any>,
  ): Promise<PaginatedCopies> {
    // Validate query parameters
    const validationResult = queryCopiesSchema.safeParse(queryParams);
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

    return this.bookCopiesService.findCopiesForBook(id, validationResult.data);
  }

  /**
   * POST /api/books/:id/copies
   * Add multiple copies to a book
   * Admin only - requires authentication and ADMIN role
   *
   * Validates:
   * - count (required, integer, min 1, max 100)
   * - locationCode (optional, max 50 chars)
   *
   * Generates unique codes for each copy: {bookISBN}-{sequential}
   * Creates N copies with status=AVAILABLE in a transaction
   *
   * @param id Book UUID
   * @param addCopiesDto Data for adding copies
   * @param user Current authenticated user (from JWT)
   * @returns Created copies and success message
   */
  @Roles(Role.ADMIN)
  @Post('books/:id/copies')
  @HttpCode(HttpStatus.CREATED)
  async addCopiesToBook(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(addCopiesSchema))
    addCopiesDto: AddCopiesDto,
    @CurrentUser() user: { userId: string; role: Role },
  ): Promise<{ copies: BookCopy[]; message: string }> {
    return this.bookCopiesService.addCopiesToBook(
      id,
      addCopiesDto,
      user.userId,
    );
  }

  /**
   * PATCH /api/copies/:copyId
   * Update a book copy
   * Admin only - requires authentication and ADMIN role
   *
   * Validates:
   * - status (optional, enum: AVAILABLE, ON_LOAN, LOST, DAMAGED)
   * - locationCode (optional, max 50 chars)
   *
   * Business Rule: Cannot set status to AVAILABLE if copy has an open loan
   * Creates audit log entry with action='copy.updated'
   *
   * @param copyId Copy UUID
   * @param updateCopyDto Data to update
   * @param user Current authenticated user (from JWT)
   * @returns Updated copy
   */
  @Roles(Role.ADMIN)
  @Patch('copies/:copyId')
  @HttpCode(HttpStatus.OK)
  async updateCopy(
    @Param('copyId') copyId: string,
    @Body(new ZodValidationPipe(updateCopySchema))
    updateCopyDto: UpdateCopyDto,
    @CurrentUser() user: { userId: string; role: Role },
  ): Promise<{ copy: BookCopy }> {
    const copy = await this.bookCopiesService.updateCopy(
      copyId,
      updateCopyDto,
      user.userId,
    );
    return { copy };
  }

  /**
   * DELETE /api/copies/:copyId
   * Delete a book copy
   * Admin only - requires authentication and ADMIN role
   *
   * Checks if copy has any loans (historical or active) before deletion
   * If loans exist, returns 409 error
   * Creates audit log entry with action='copy.deleted'
   *
   * @param copyId Copy UUID
   * @param user Current authenticated user (from JWT)
   * @returns No content (204)
   */
  @Roles(Role.ADMIN)
  @Delete('copies/:copyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteCopy(
    @Param('copyId') copyId: string,
    @CurrentUser() user: { userId: string; role: Role },
  ): Promise<void> {
    await this.bookCopiesService.deleteCopy(copyId, user.userId);
  }
}
