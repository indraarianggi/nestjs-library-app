import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

/**
 * Prisma Module - Global module for database access
 *
 * This module is marked as @Global() so PrismaService can be injected
 * in any module without explicitly importing PrismaModule.
 *
 * This follows NestJS best practices for database services that are
 * used across the entire application.
 */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
