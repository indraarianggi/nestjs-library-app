import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get<ConfigService>(ConfigService);

  // Enable global logging interceptor for request/response logging
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Enable global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Enable CORS
  app.enableCors({
    origin:
      configService.get<string>('NODE_ENV', 'development') === 'production'
        ? configService.get<string>('FRONTEND_URL', 'http://localhost:5173')
        : '*',
    credentials: true,
  });

  // Set global prefix
  app.setGlobalPrefix('api');

  const openApiConfig = new DocumentBuilder()
    .setTitle('Library Management APIs')
    .setDescription('The Libray Management APIs')
    .setVersion('1.0')
    .build();
  const openApiDocument = SwaggerModule.createDocument(app, openApiConfig);

  // SwaggerModule.setup('api', app, openApiDocument); // Swagger UI

  // Scalar API Reference
  // https://github.com/scalar/scalar/issues/6895#issuecomment-3323558038
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const { apiReference } = await eval("import('@scalar/nestjs-api-reference')");
  app.use(
    '/scalar',
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    apiReference({
      content: openApiDocument,
    }),
  );

  const port = configService.get<number>('PORT', 3000);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const server = await app.listen(port);

  // Enable Prisma shutdown hooks for graceful shutdown with server reference
  const prismaService = app.get(PrismaService);
  await prismaService.enableShutdownHooks(app, server);

  console.log(`Application is running on: http://localhost:${port}`);
  console.log(
    `Environment: ${configService.get<string>('NODE_ENV', 'development')}`,
  );
}

void bootstrap();
