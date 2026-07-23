import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';

/**
 * Database Service - Manages PostgreSQL connection pool and query execution
 *
 * This service provides:
 * - Connection pooling for optimal database performance
 * - Transaction management
 * - Query execution with proper error handling
 * - Connection monitoring
 */
@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(DatabaseService.name);
  private pool: Pool;

  constructor(private configService: ConfigService) {
    this.initializePool();
  }

  /**
   * Initialize PostgreSQL connection pool with configuration
   */
  private initializePool(): void {
    this.pool = new Pool({
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: this.configService.get<number>('DB_PORT', 5432),
      database: this.configService.get<string>('DB_NAME', 'social_network'),
      user: this.configService.get<string>('DB_USER', 'postgres'),
      password: this.configService.get<string>('DB_PASSWORD', 'postgres'),
      min: this.configService.get<number>('DB_POOL_MIN', 2),
      max: this.configService.get<number>('DB_POOL_MAX', 10),
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Log pool errors
    this.pool.on('error', (err) => {
      this.logger.error('Unexpected error on idle client', err);
    });

    // Log pool connection
    this.pool.on('connect', () => {
      this.logger.log('New client connected to database pool');
    });

    // Log pool removal
    this.pool.on('remove', () => {
      this.logger.log('Client removed from database pool');
    });
  }

  /**
   * Module initialization - verify database connection
   */
  async onModuleInit(): Promise<void> {
    try {
      await this.healthCheck();
      this.logger.log('Database connection established successfully');
    } catch (error) {
      this.logger.error('Failed to connect to database', error);
      throw error;
    }
  }

  /**
   * Module cleanup - close all database connections
   */
  async onModuleDestroy(): Promise<void> {
    try {
      await this.pool.end();
      this.logger.log('Database connection pool closed');
    } catch (error) {
      this.logger.error('Error closing database pool', error);
    }
  }

  /**
   * Execute a query with parameters
   * @param query SQL query string
   * @param params Query parameters
   * @returns Query result
   */
  async query<T extends QueryResultRow = any>(query: string, params?: any[]): Promise<QueryResult<T>> {
    const start = Date.now();
    try {
      const result = await this.pool.query<T>(query, params);
      const duration = Date.now() - start;

      this.logger.debug(`Query executed in ${duration}ms: ${query.substring(0, 100)}...`);

      return result;
    } catch (error) {
      this.logger.error(`Query failed: ${query}`, error);
      throw error;
    }
  }

  /**
   * Get a client from the pool for transaction management
   * @returns Pool client
   */
  async getClient(): Promise<PoolClient> {
    return await this.pool.connect();
  }

  /**
   * Execute multiple queries in a transaction
   * @param callback Transaction callback function
   * @returns Transaction result
   */
  async transaction<T>(
    callback: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.getClient();

    try {
      await client.query('BEGIN');
      this.logger.debug('Transaction started');

      const result = await callback(client);

      await client.query('COMMIT');
      this.logger.debug('Transaction committed');

      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      this.logger.error('Transaction rolled back', error);
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * Health check to verify database connectivity
   * @returns True if connection is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      const result = await this.query('SELECT NOW()');
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      this.logger.error('Health check failed', error);
      return false;
    }
  }

}
