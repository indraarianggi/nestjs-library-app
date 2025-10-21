const { NestFactory } = require('@nestjs/core');
const { SwaggerModule, DocumentBuilder } = require('@nestjs/swagger');
const fs = require('fs');
const path = require('path');

async function exportOpenApiSpec() {
  try {
    // Import the compiled AppModule
    const { AppModule } = require('../dist/src/app.module');

    const app = await NestFactory.create(AppModule, {
      logger: false,
    });

    // Set global prefix
    app.setGlobalPrefix('api');

    // Configure Swagger/OpenAPI Documentation (same as main.ts)
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

    // Write OpenAPI spec to file
    const outputPath = path.resolve(__dirname, '../openapi.json');
    fs.writeFileSync(outputPath, JSON.stringify(openApiDocument, null, 2));

    console.log(`✅ OpenAPI specification exported to: ${outputPath}`);

    await app.close();
    process.exit(0);
  } catch (error) {
    console.error('Error exporting OpenAPI spec:', error);
    process.exit(1);
  }
}

exportOpenApiSpec();
