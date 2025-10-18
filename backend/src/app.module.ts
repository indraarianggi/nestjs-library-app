import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { CustomAuthModule } from './modules/auth/auth.module';
import { auth } from './lib/auth';

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
    AuthModule.forRoot({ auth }),
    CustomAuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
