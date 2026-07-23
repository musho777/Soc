import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { SearchUsersDto } from './dto/search-users.dto';

/**
 * Users Repository - Data access layer for user operations
 *
 * Implements repository pattern with raw SQL queries
 * All database operations related to users are centralized here
 */
@Injectable()
export class UsersRepository {
  private readonly logger = new Logger(UsersRepository.name);

  constructor(private readonly db: DatabaseService) {}

  /**
   * Create a new user in the database
   * @param createUserDto User creation data
   * @returns Created user
   */
  async create(createUserDto: CreateUserDto): Promise<User> {
    const query = `
      INSERT INTO users (
        email, username, password_hash, first_name, last_name, date_of_birth, bio
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING
        id, email, username, first_name, last_name, date_of_birth,
        bio, profile_picture_url, is_active, is_verified,
        created_at, updated_at, last_login_at
    `;

    const values = [
      createUserDto.email,
      createUserDto.username,
      createUserDto.password_hash,
      createUserDto.first_name,
      createUserDto.last_name,
      createUserDto.date_of_birth,
      createUserDto.bio || null,
    ];

    const result = await this.db.query<User>(query, values);
    return result.rows[0];
  }

  /**
   * Find a user by ID
   * @param id User ID
   * @returns User or null
   */
  async findById(id: string): Promise<User | null> {
    const query = `
      SELECT
        id, email, username, first_name, last_name, date_of_birth,
        bio, profile_picture_url, is_active, is_verified,
        created_at, updated_at, last_login_at
      FROM users
      WHERE id = $1 AND is_active = true
    `;

    const result = await this.db.query<User>(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find a user by email (for authentication)
   * @param email User email
   * @returns User with password hash or null
   */
  async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT
        id, email, username, password_hash, first_name, last_name, date_of_birth,
        bio, profile_picture_url, is_active, is_verified,
        created_at, updated_at, last_login_at
      FROM users
      WHERE email = $1
    `;

    const result = await this.db.query<User>(query, [email]);
    return result.rows[0] || null;
  }

  /**
   * Find a user by username
   * @param username Username
   * @returns User or null
   */
  async findByUsername(username: string): Promise<User | null> {
    const query = `
      SELECT
        id, email, username, first_name, last_name, date_of_birth,
        bio, profile_picture_url, is_active, is_verified,
        created_at, updated_at, last_login_at
      FROM users
      WHERE username = $1 AND is_active = true
    `;

    const result = await this.db.query<User>(query, [username]);
    return result.rows[0] || null;
  }

  /**
   * Check if email already exists
   * @param email Email to check
   * @returns True if exists
   */
  async emailExists(email: string): Promise<boolean> {
    const query = 'SELECT 1 FROM users WHERE email = $1';
    const result = await this.db.query(query, [email]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Check if username already exists
   * @param username Username to check
   * @returns True if exists
   */
  async usernameExists(username: string): Promise<boolean> {
    const query = 'SELECT 1 FROM users WHERE username = $1';
    const result = await this.db.query(query, [username]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Update user's last login timestamp
   * @param userId User ID
   */
  async updateLastLogin(userId: string): Promise<void> {
    const query = `
      UPDATE users
      SET last_login_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    await this.db.query(query, [userId]);
  }

  /**
   * Advanced search for users with filters
   * @param searchDto Search criteria
   * @returns Array of matching users
   */
  async search(searchDto: SearchUsersDto): Promise<{ users: User[]; total: number }> {
    const { first_name, last_name, age_min, age_max, page = 1, limit = 20 } = searchDto;

    // Build dynamic WHERE conditions
    const conditions: string[] = ['is_active = true'];
    const params: any[] = [];
    let paramCounter = 1;

    // First name filter (case-insensitive partial match)
    if (first_name) {
      conditions.push(`first_name ILIKE $${paramCounter}`);
      params.push(`%${first_name}%`);
      paramCounter++;
    }

    // Last name filter (case-insensitive partial match)
    if (last_name) {
      conditions.push(`last_name ILIKE $${paramCounter}`);
      params.push(`%${last_name}%`);
      paramCounter++;
    }

    // Age range filter
    if (age_min !== undefined) {
      conditions.push(`calculate_age(date_of_birth) >= $${paramCounter}`);
      params.push(age_min);
      paramCounter++;
    }

    if (age_max !== undefined) {
      conditions.push(`calculate_age(date_of_birth) <= $${paramCounter}`);
      params.push(age_max);
      paramCounter++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total matching records
    const countQuery = `
      SELECT COUNT(*) as total
      FROM users
      ${whereClause}
    `;

    const countResult = await this.db.query<{ total: string }>(countQuery, params);
    const total = parseInt(countResult.rows[0].total, 10);

    // Get paginated results
    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const searchQuery = `
      SELECT
        id, email, username, first_name, last_name, date_of_birth,
        calculate_age(date_of_birth) as age,
        bio, profile_picture_url, is_verified, created_at
      FROM users
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}
    `;

    const result = await this.db.query<User>(searchQuery, params);

    return {
      users: result.rows,
      total,
    };
  }

  /**
   * Get user profile with additional computed fields
   * @param userId User ID
   * @returns User profile with age
   */
  async getProfile(userId: string): Promise<User | null> {
    const query = `
      SELECT
        id, email, username, first_name, last_name, date_of_birth,
        calculate_age(date_of_birth) as age,
        bio, profile_picture_url, is_active, is_verified,
        created_at, updated_at, last_login_at
      FROM users
      WHERE id = $1 AND is_active = true
    `;

    const result = await this.db.query<User>(query, [userId]);
    return result.rows[0] || null;
  }

  /**
   * Deactivate a user account (soft delete)
   * @param userId User ID
   */
  async deactivate(userId: string): Promise<void> {
    const query = `
      UPDATE users
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;

    await this.db.query(query, [userId]);
  }

  /**
   * Save a refresh token to the database
   * @param userId User ID
   * @param tokenHash Hashed refresh token
   * @param expiresAt Token expiration timestamp
   * @returns Token ID
   */
  async saveRefreshToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<string> {
    const query = `
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id
    `;

    const result = await this.db.query<{ id: string }>(query, [
      userId,
      tokenHash,
      expiresAt,
    ]);

    return result.rows[0].id;
  }

  /**
   * Find a valid refresh token by its hash
   * @param tokenHash Hashed refresh token
   * @returns Refresh token record or null
   */
  async findRefreshToken(tokenHash: string): Promise<{
    id: string;
    user_id: string;
    expires_at: Date;
    revoked_at: Date | null;
  } | null> {
    const query = `
      SELECT id, user_id, expires_at, revoked_at
      FROM refresh_tokens
      WHERE token_hash = $1
    `;

    const result = await this.db.query<{
      id: string;
      user_id: string;
      expires_at: Date;
      revoked_at: Date | null;
    }>(query, [tokenHash]);

    return result.rows[0] || null;
  }

  /**
   * Revoke a refresh token
   * @param tokenHash Hashed refresh token
   */
  async revokeRefreshToken(tokenHash: string): Promise<void> {
    const query = `
      UPDATE refresh_tokens
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE token_hash = $1 AND revoked_at IS NULL
    `;

    await this.db.query(query, [tokenHash]);
  }

  /**
   * Revoke all refresh tokens for a user
   * @param userId User ID
   */
  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    const query = `
      UPDATE refresh_tokens
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND revoked_at IS NULL
    `;

    await this.db.query(query, [userId]);
  }

  /**
   * Clean up expired refresh tokens
   */
  async cleanupExpiredRefreshTokens(): Promise<void> {
    const query = `
      DELETE FROM refresh_tokens
      WHERE expires_at < CURRENT_TIMESTAMP
      OR revoked_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
    `;

    await this.db.query(query);
  }
}
