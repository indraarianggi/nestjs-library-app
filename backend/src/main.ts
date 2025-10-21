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

  // Configure Swagger/OpenAPI Documentation
  const openApiConfig = new DocumentBuilder()
    .setTitle('Library Management System API')
    .setDescription(
      'RESTful API for a comprehensive Library Management System. This API provides endpoints for managing books, authors, categories, book copies, members, loans, and system settings.',
    )
    .setVersion('1.0.0')
    .setContact(
      'Library Management Team',
      'https://github.com/library-management',
      'support@library-management.com',
    )
    .addServer('http://localhost:3000', 'Development Server')
    .addServer('https://api.library-management.com', 'Production Server')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Authentication and authorization endpoints')
    .addTag('Books', 'Book catalog management')
    .addTag('Authors', 'Author management')
    .addTag('Categories', 'Category management')
    .addTag('Book Copies', 'Physical book copy management')
    .addTag('Members', 'Library member management')
    .addTag('Loans', 'Loan management (Admin)')
    .addTag('My Loans', 'Personal loan management (Member)')
    .addTag('Settings', 'System settings management')
    .addTag('Audit Logs', 'Audit log viewing')
    .addTag('Health', 'Health check endpoints')
    .build();
  const openApiDocument = SwaggerModule.createDocument(app, openApiConfig);

  // Swagger UI at /api/docs
  SwaggerModule.setup('api/docs', app, openApiDocument, {
    customSiteTitle: 'Library Management API Docs',
    customfavIcon: 'https://nestjs.com/img/logo-small.svg',
    customCss: '.swagger-ui .topbar { display: none }',
    swaggerOptions: {
      persistAuthorization: true,
      docExpansion: 'none',
      filter: true,
      showRequestDuration: true,
    },
  });

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
