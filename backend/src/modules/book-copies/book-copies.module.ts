import { Module } from '@nestjs/common';
import { BookCopiesController } from './book-copies.controller';
import { BookCopiesService } from './book-copies.service';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * BookCopiesModule - Module for book copy management
 * Provides operations for managing physical book copies
 * All endpoints are admin-only
 */
@Module({
  imports: [PrismaModule],
  controllers: [BookCopiesController],
  providers: [BookCopiesService],
  exports: [BookCopiesService],
})
export class BookCopiesModule {}
