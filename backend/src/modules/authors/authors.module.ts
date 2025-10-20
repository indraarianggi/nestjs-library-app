import { Module } from '@nestjs/common';
import { AuthorsController } from './authors.controller';
import { AuthorsService } from './authors.service';
import { PrismaModule } from '../../prisma/prisma.module';

/**
 * AuthorsModule - Module for author management
 * Provides CRUD operations for authors with proper authorization
 */
@Module({
  imports: [PrismaModule],
  controllers: [AuthorsController],
  providers: [AuthorsService],
  exports: [AuthorsService],
})
export class AuthorsModule {}
