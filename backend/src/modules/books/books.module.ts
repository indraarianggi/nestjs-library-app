import { Module } from '@nestjs/common';
import { BooksController } from './books.controller';
import { BooksService } from './books.service';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * BooksModule - Module for book management
 * Provides CRUD operations for books with proper authorization
 * Handles many-to-many relationships with authors and categories
 */
@Module({
  imports: [PrismaModule],
  controllers: [BooksController],
  providers: [BooksService],
  exports: [BooksService],
})
export class BooksModule {}
