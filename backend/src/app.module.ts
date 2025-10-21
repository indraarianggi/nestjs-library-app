import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AuthorsModule } from './modules/authors/authors.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { BooksModule } from './modules/books/books.module';
import { BookCopiesModule } from './modules/book-copies/book-copies.module';
import { MembersModule } from './modules/members/members.module';
import { SettingsModule } from './modules/settings/settings.module';
import { LoansModule } from './modules/loans/loans.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      cache: true,
    }),
    // Global rate limiting: 10 requests per minute
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds (1 minute)
        limit: 10, // 10 requests per minute
      },
    ]),
    PrismaModule,
    AuthModule,
    AuthorsModule,
    CategoriesModule,
    BooksModule,
    BookCopiesModule,
    MembersModule,
    SettingsModule,
    LoansModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Global JWT authentication guard
    // All routes require authentication by default unless marked with @Public() decorator
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
