import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

/**
 * Bootstrap function - Application entry point
 */
async function bootstrap() {
  const logger = new Logger('Bootstrap');

  // Create NestJS application
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);

  // Global prefix for all routes
  const apiPrefix = configService.get<string>('API_PREFIX', 'api/v1');
  app.setGlobalPrefix(apiPrefix);

  // Enable CORS
  app.enableCors({
    origin: true, // Configure this properly in production
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Automatically transform payloads to DTO instances
      transformOptions: {
        enableImplicitConversion: true, // Convert types automatically
      },
    }),
  );

  // Swagger documentation setup
  const config = new DocumentBuilder()
    .setTitle('Social Network API')
    .setDescription(
      `
# Social Network API Documentation

A production-ready REST API for a social networking platform built with NestJS, TypeScript, and PostgreSQL.

## Features

- **User Management**: Registration, authentication, and profile management
- **Advanced Search**: Search users by name and age with pagination
- **Friend System**: Send, accept, decline friend requests and manage friendships
- **JWT Authentication**: Secure endpoints with JWT tokens
- **Database**: PostgreSQL with optimized queries and indexes (no ORM)

## Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

\`\`\`
Authorization: Bearer <your-jwt-token>
\`\`\`

You'll receive a JWT token after successful registration or login.

## Architecture

This API follows clean architecture principles:
- **Controller Layer**: HTTP request/response handling
- **Service Layer**: Business logic
- **Repository Layer**: Data access with raw SQL queries
- **Entity/DTO Layer**: Data models and validation

## Error Handling

The API uses standard HTTP status codes:
- \`200\`: Success
- \`201\`: Resource created
- \`400\`: Bad request (validation errors)
- \`401\`: Unauthorized (missing or invalid token)
- \`404\`: Resource not found
- \`409\`: Conflict (duplicate resource)
- \`500\`: Internal server error
      `,
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Authentication', 'User registration and login endpoints')
    .addTag('Users', 'User profile and search endpoints')
    .addTag('Friends', 'Friend request and friendship management')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Social Network API Docs',
  });

  // Get port from environment
  const port = configService.get<number>('PORT', 3000);

  // Start server
  await app.listen(port);

  logger.log(`🚀 Application is running on: http://localhost:${port}/${apiPrefix}`);
  logger.log(`📚 Swagger documentation: http://localhost:${port}/api/docs`);
  logger.log(`🗄️  Database: PostgreSQL`);
  logger.log(`🔐 JWT Authentication: Enabled`);
}

bootstrap();
