import { Global, Module } from '@nestjs/common';
import { DatabaseService } from './database.service';

/**
 * Database Module - Global module providing database connectivity
 *
 * This module is marked as @Global() so DatabaseService is available
 * throughout the application without needing to import DatabaseModule
 * in every feature module.
 */
@Global()
@Module({
  providers: [DatabaseService],
  exports: [DatabaseService],
})
export class DatabaseModule {}
