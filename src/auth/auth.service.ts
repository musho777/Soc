import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { UsersRepository } from '../users/users.repository';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
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
      '30',
    );
  }

  async register(createUserDto: CreateUserDto): Promise<AuthResponse> {
    const emailExists = await this.usersRepository.emailExists(createUserDto.email);
    if (emailExists) {
      throw new ConflictException('Email already registered');
    }

    const usernameExists = await this.usersRepository.usernameExists(
      createUserDto.username,
    );
    if (usernameExists) {
      throw new ConflictException('Username already taken');
    }

    const passwordHash = await this.hashPassword(createUserDto.password);
    const userToCreate = {
      ...createUserDto,
      password_hash: passwordHash,
    };

    const user = await this.usersRepository.create(userToCreate);

    const accessToken = await this.generateToken(user);
    const refreshToken = await this.generateRefreshToken(user);
    delete user.password_hash;

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user,
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.usersRepository.findByEmail(loginDto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await this.verifyPassword(
      loginDto.password,
      user.password_hash!,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    this.logger.log(`User logged in: ${user.email}`);

    const accessToken = await this.generateToken(user);
    const refreshToken = await this.generateRefreshToken(user);
    delete user.password_hash;

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
      user,
    };
  }

  async validateUser(userId: string): Promise<User | null> {
    return this.usersRepository.findById(userId);
  }

  private async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.bcryptRounds);
  }

  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }

  private async generateToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    return await this.jwtService.signAsync(payload);
  }

  private async generateRefreshToken(user: User): Promise<string> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      username: user.username,
    };

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.refreshSecret,
      expiresIn: this.refreshExpiration + 'd',
    });

    const expiresAt = this.calculateExpirationDate(this.refreshExpiration);

    await this.usersRepository.saveRefreshToken(user.id, refreshToken, expiresAt);
    return refreshToken;
  }

  async refresh(refreshTokenDto: RefreshTokenDto): Promise<AuthResponse> {
    const { refresh_token } = refreshTokenDto;

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(refresh_token, {
        secret: this.refreshSecret,
      });

      const storedToken = await this.usersRepository.findRefreshToken(refresh_token);

      if (!storedToken) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      if (storedToken.revoked_at) {
        throw new UnauthorizedException('Refresh token has been revoked');
      }

      if (new Date() > new Date(storedToken.expires_at)) {
        throw new UnauthorizedException('Refresh token has expired');
      }

      const user = await this.usersRepository.findById(payload.sub);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const accessToken = await this.generateToken(user);

      delete user.password_hash;

      return {
        access_token: accessToken,
        refresh_token: refresh_token,
        user,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(refreshToken: string): Promise<void> {
    await this.usersRepository.revokeRefreshToken(refreshToken);
    this.logger.log('User logged out');
  }

  private calculateExpirationDate(expiration: string): Date {
    const days = parseInt(expiration);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + days);
    return expiresAt;
  }
}
