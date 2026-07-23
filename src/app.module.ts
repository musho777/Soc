import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { FriendsModule } from './friends/friends.module';
import { HealthModule } from './health/health.module';

/**
 * App Module - Root module of the application
 *
 * Architecture:
 * - ConfigModule: Environment configuration
 * - DatabaseModule: PostgreSQL connection (Global)
 * - HealthModule: Health check endpoints
 * - AuthModule: Authentication and JWT
 * - UsersModule: User management and search
 * - FriendsModule: Friend requests and relationships
 */
@Module({
  imports: [
    // Global configuration
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),

    // Core modules
    DatabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
    FriendsModule,
  ],
})
export class AppModule {}
