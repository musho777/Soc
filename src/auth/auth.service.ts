import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UsersRepository } from '../users/users.repository';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from '../users/dto/login.dto';
import { RefreshTokenDto } from '../users/dto/refresh-token.dto';
import { User } from '../users/entities/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  username: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

/**
 * Authentication Service - Handles user authentication and authorization
 *
 * Responsibilities:
 * - User registration with password hashing
 * - User login with credential validation
 * - JWT token generation
 * - Password verification
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly bcryptRounds: number;
  private readonly refreshSecret: string;
  private readonly refreshExpiration: string;

  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {
    this.bcryptRounds = parseInt(
      this.configService.get<string>('BCRYPT_ROUNDS', '10'),
      10,
    );
    this.refreshSecret = this.configService.get<string>(
      'JWT_REFRESH_SECRET',
      'default-refresh-secret',
    );
    this.refreshExpiration = this.configService.get<string>(
      'JWT_REFRESH_EXPIRATION',
      '7d',
    );
  }

  /**
   * Register a new user
   * @param createUserDto User registration data
   * @returns Authentication response with token
   */
  async register(createUserDto: CreateUserDto): Promise<AuthResponse> {
    // Validate date of birth
    const birthDate = new Date(createUserDto.date_of_birth);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();

    if (age < 13) {
      throw new BadRequestException('You must be at least 13 years old to register');
    }

    if (birthDate > today) {
      throw new BadRequestException('Date of birth cannot be in the future');
    }

    // Check if email already exists
    const emailExists = await this.usersRepository.emailExists(createUserDto.email);
    if (emailExists) {
      throw new ConflictException('Email already registered');
    }

    // Check if username already exists
    const usernameExists = await this.usersRepository.usernameExists(createUserDto.username);
    if (usernameExists) {
      throw new ConflictException('Username already taken');
    }

    // Hash password
    const passwordHash = await this.hashPassword(createUserDto.password);

    // Create user
    const userToCreate = {
      ...createUserDto,
      password_hash: passwordHash,
    };

    const user = await this.usersRepository.create(userToCreate);

    this.logger.log(`New user registered: ${user.email}`);

    // Generate tokens
    const accessToken = await this.generateToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    // Remove password hash from response
    delete user.password_hash;

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user,
    };
  }

  /**
   * Login an existing user
   * @param loginDto Login credentials
   * @returns Authentication response with token
   */
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    // Find user by email
    const user = await this.usersRepository.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if account is active
    if (!user.is_active) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(
      loginDto.password,
      user.password_hash!,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Update last login timestamp
    await this.usersRepository.updateLastLogin(user.id);

    this.logger.log(`User logged in: ${user.email}`);

    // Generate tokens
    const accessToken = await this.generateToken(user);
    const refreshToken = await this.generateRefreshToken(user);

    // Remove password hash from response
    delete user.password_hash;

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user,
    };
  }

  /**
   * Validate a user by ID (used by JWT strategy)
   * @param userId User ID
   * @returns User or null
   */
  async validateUser(userId: string): Promise<User | null> {
    return await this.usersRepository.findById(userId);
  }

  /**
   * Hash a password using bcrypt
   * @param password Plain text password
   * @returns Hashed password
   */
  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.bcryptRounds);
  }

  /**
   * Verify a password against a hash
   * @param password Plain text password
   * @param hash Password hash
   * @returns True if password matches
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token for a user
   * @param user User entity
   * @returns JWT token
   */
  private async generateToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    return await this.jwtService.signAsync(payload);
  }

  /**
   * Generate refresh token for a user
   * @param user User entity
   * @returns Refresh token
   */
  private async generateRefreshToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    // Generate JWT refresh token
    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshExpiration,
    });

    // Hash the token before storing
    const tokenHash = this.hashToken(refreshToken);

    // Calculate expiration date
    const expiresAt = this.calculateExpirationDate(this.refreshExpiration);

    // Store refresh token in database
    await this.usersRepository.saveRefreshToken(user.id, tokenHash, expiresAt);

    return refreshToken;
  }

  /**
   * Refresh access token using refresh token
   * @param refreshTokenDto Refresh token data
   * @returns New access and refresh tokens
   */
  async refresh(refreshTokenDto: RefreshTokenDto): Promise<AuthResponse> {
    const { refresh_token } = refreshTokenDto;

    try {
      // Verify refresh token
      const payload = await this.jwtService.verifyAsync<JwtPayload>(
        refresh_token,
        {
          secret: this.refreshSecret,
        },
      );

      // Hash the token to check in database
      const tokenHash = this.hashToken(refresh_token);

      // Check if token exists and is valid
      const storedToken = await this.usersRepository.findRefreshToken(tokenHash);

      if (!storedToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (storedToken.revoked_at) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      if (new Date() > new Date(storedToken.expires_at)) {
        throw new UnauthorizedException('Refresh token has expired');
      }

      // Get user
      const user = await this.usersRepository.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      if (!user.is_active) {
        throw new UnauthorizedException('Account is deactivated');
      }

      // Revoke old refresh token
      await this.usersRepository.revokeRefreshToken(tokenHash);

      // Generate new tokens
      const accessToken = await this.generateToken(user);
      const newRefreshToken = await this.generateRefreshToken(user);

      this.logger.log(`Tokens refreshed for user: ${user.email}`);

      // Remove password hash from response
      delete user.password_hash;

      return {
        access_token: accessToken,
        refresh_token: newRefreshToken,
        user,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  /**
   * Logout user by revoking refresh token
   * @param refreshToken Refresh token to revoke
   */
  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.usersRepository.revokeRefreshToken(tokenHash);
    this.logger.log('User logged out');
  }

  /**
   * Hash a token using SHA256
   * @param token Token to hash
   * @returns Hashed token
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /**
   * Calculate expiration date from expiration string
   * @param expiration Expiration string (e.g., '7d', '24h')
   * @returns Expiration date
   */
  private calculateExpirationDate(expiration: string): Date {
    const now = new Date();
    const match = expiration.match(/^(\d+)([smhd])$/);

    if (!match) {
      throw new Error('Invalid expiration format');
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        now.setSeconds(now.getSeconds() + value);
        break;
      case 'm':
        now.setMinutes(now.getMinutes() + value);
        break;
      case 'h':
        now.setHours(now.getHours() + value);
        break;
      case 'd':
        now.setDate(now.getDate() + value);
        break;
    }

    return now;
  }
}
