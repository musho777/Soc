import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { SearchUsersDto } from './dto/search-users.dto';

@Injectable()
export class UsersRepository {
  private readonly logger = new Logger(UsersRepository.name);

  constructor(private readonly db: DatabaseService) {}

  async create(createUserDto: CreateUserDto & { password_hash: string }): Promise<User> {
    const query = `
      INSERT INTO users (
        email, username, password_hash, first_name, last_name, date_of_birth
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id, email, username, first_name, last_name, date_of_birth,
        created_at, updated_at
    `;

    const values = [
      createUserDto.email,
      createUserDto.username,
      createUserDto.password_hash,
      createUserDto.firstName,
      createUserDto.lastName,
      createUserDto.dateOfBirth,
    ];

    const result = await this.db.query<User>(query, values);
    return result.rows[0];
  }

  async findById(id: string): Promise<User | null> {
    const query = `
      SELECT
        id, email, username, first_name, last_name, date_of_birth,
        created_at, updated_at
      FROM users
      WHERE id = $1
    `;

    const result = await this.db.query<User>(query, [id]);
    return result.rows[0] || null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const query = `
      SELECT
        id, email, username, password_hash, first_name, last_name, date_of_birth,
        created_at, updated_at
      FROM users
      WHERE email = $1
    `;

    const result = await this.db.query<User>(query, [email]);
    return result.rows[0] || null;
  }

  async findByUsername(username: string): Promise<User | null> {
    const query = `
      SELECT
        id, email, username, first_name, last_name, date_of_birth,
        created_at, updated_at
      FROM users
      WHERE username = $1
    `;

    const result = await this.db.query<User>(query, [username]);
    return result.rows[0] || null;
  }

  async emailExists(email: string): Promise<boolean> {
    const query = 'SELECT 1 FROM users WHERE email = $1';
    const result = await this.db.query(query, [email]);
    return (result.rowCount ?? 0) > 0;
  }

  async usernameExists(username: string): Promise<boolean> {
    const query = 'SELECT 1 FROM users WHERE username = $1';
    const result = await this.db.query(query, [username]);
    return (result.rowCount ?? 0) > 0;
  }

  async search(searchDto: SearchUsersDto): Promise<{ users: User[]; total: number }> {
    const { first_name, last_name, age_min, age_max, page = 1, limit = 20 } = searchDto;

    const conditions: string[] = [];
    const params: (string | number)[] = [];
    let paramCounter = 1;

    if (first_name) {
      conditions.push(`first_name ILIKE $${paramCounter}`);
      params.push(`%${first_name}%`);
      paramCounter++;
    }

    if (last_name) {
      conditions.push(`last_name ILIKE $${paramCounter}`);
      params.push(`%${last_name}%`);
      paramCounter++;
    }

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

    const countQuery = `
      SELECT COUNT(*) as total
      FROM users
      ${whereClause}
    `;

    const countResult = await this.db.query<{ total: string }>(countQuery, params);
    const total = parseInt(countResult.rows[0].total, 10);

    const offset = (page - 1) * limit;
    params.push(limit, offset);

    const searchQuery = `
      SELECT
        id, email, username, first_name, last_name, date_of_birth,
        calculate_age(date_of_birth) as age,
        created_at
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

  async getProfile(userId: string): Promise<User | null> {
    const query = `
      SELECT
        id, email, username, first_name, last_name, date_of_birth,
        calculate_age(date_of_birth) as age,
        created_at, updated_at
      FROM users
      WHERE id = $1
    `;

    const result = await this.db.query<User>(query, [userId]);
    return result.rows[0] || null;
  }

  async saveRefreshToken(
    userId: string,
    token: string,
    expiresAt: Date,
  ): Promise<string> {
    const query = `
      INSERT INTO refresh_tokens (user_id, token_hash, expires_at)
      VALUES ($1, $2, $3)
      RETURNING id
    `;

    const result = await this.db.query<{ id: string }>(query, [
      userId,
      token,
      expiresAt,
    ]);

    return result.rows[0].id;
  }

  async findRefreshToken(token: string): Promise<{
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
    }>(query, [token]);

    return result.rows[0] || null;
  }

  async revokeRefreshToken(token: string): Promise<void> {
    const query = `
      UPDATE refresh_tokens
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE token_hash = $1 AND revoked_at IS NULL
    `;

    await this.db.query(query, [token]);
  }

  async revokeAllUserRefreshTokens(userId: string): Promise<void> {
    const query = `
      UPDATE refresh_tokens
      SET revoked_at = CURRENT_TIMESTAMP
      WHERE user_id = $1 AND revoked_at IS NULL
    `;

    await this.db.query(query, [userId]);
  }

  async cleanupExpiredRefreshTokens(): Promise<void> {
    const query = `
      DELETE FROM refresh_tokens
      WHERE expires_at < CURRENT_TIMESTAMP
      OR revoked_at < CURRENT_TIMESTAMP - INTERVAL '30 days'
    `;

    await this.db.query(query);
  }
}
