import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthService } from './auth.service';
import { UsersRepository } from '../users/users.repository';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { LoginDto } from './dto/login.dto';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let usersRepository: jest.Mocked<UsersRepository>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'testuser@example.com',
    username: 'testuser123',
    first_name: 'name',
    last_name: 'lastname',
    date_of_birth: '2001-03-09',
    password_hash: '$2b$10$hashedpassword',
    created_at: new Date('2024-01-15T10:00:00Z'),
    updated_at: new Date('2024-01-15T10:00:00Z'),
  };

  beforeEach(async () => {
    const mockUsersRepository = {
      emailExists: jest.fn(),
      usernameExists: jest.fn(),
      create: jest.fn(),
      findByEmail: jest.fn(),
      findById: jest.fn(),
      saveRefreshToken: jest.fn(),
      findRefreshToken: jest.fn(),
      revokeRefreshToken: jest.fn(),
    };

    const mockJwtService = {
      signAsync: jest.fn(),
      verifyAsync: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn((key: string, defaultValue?: string) => {
        const config: Record<string, string> = {
          BCRYPT_ROUNDS: '10',
          JWT_REFRESH_SECRET: 'test-refresh-secret',
          JWT_REFRESH_EXPIRATION: '7',
        };
        return config[key] || defaultValue;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    usersRepository = module.get(UsersRepository);
    jwtService = module.get(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    const createUserDto: CreateUserDto = {
      email: 'newuser@example.com',
      username: 'newuser456',
      password: 'SecurePass123!',
      firstName: 'name',
      lastName: 'lastname',
      dateOfBirth: '1998-08-20',
    };

    it('should successfully register a new user', async () => {
      const hashedPassword = '$2b$10$newhashedpassword';
      const newUser = { ...mockUser, ...createUserDto, password_hash: hashedPassword };
      const accessToken = 'jwt.access.token';
      const refreshToken = 'jwt.refresh.token';

      usersRepository.emailExists.mockResolvedValue(false);
      usersRepository.usernameExists.mockResolvedValue(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hashedPassword);
      usersRepository.create.mockResolvedValue(newUser);
      jwtService.signAsync.mockResolvedValueOnce(accessToken);
      jwtService.signAsync.mockResolvedValueOnce(refreshToken);

      const result = await service.register(createUserDto);

      expect(usersRepository.emailExists).toHaveBeenCalledWith(createUserDto.email);
      expect(usersRepository.usernameExists).toHaveBeenCalledWith(createUserDto.username);
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(usersRepository.create).toHaveBeenCalledWith({
        ...createUserDto,
        password_hash: hashedPassword,
      });
      expect(result.access_token).toBe(accessToken);
      expect(result.refresh_token).toBe(refreshToken);
      expect(result.user).toBeDefined();
      expect(result.user.password_hash).toBeUndefined();
      expect(result.user.email).toBe(createUserDto.email);
    });

    it('should throw ConflictException if email already exists', async () => {
      usersRepository.emailExists.mockResolvedValue(true);

      await expect(service.register(createUserDto)).rejects.toThrow(ConflictException);
      await expect(service.register(createUserDto)).rejects.toThrow(
        'Email already registered',
      );

      expect(usersRepository.emailExists).toHaveBeenCalledWith(createUserDto.email);
      expect(usersRepository.usernameExists).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if username already exists', async () => {
      usersRepository.emailExists.mockResolvedValue(false);
      usersRepository.usernameExists.mockResolvedValue(true);

      await expect(service.register(createUserDto)).rejects.toThrow(ConflictException);

      expect(usersRepository.usernameExists).toHaveBeenCalledWith(createUserDto.username);
      expect(usersRepository.create).not.toHaveBeenCalled();
    });

    it('should hash the password with correct number of rounds', async () => {
      usersRepository.emailExists.mockResolvedValue(false);
      usersRepository.usernameExists.mockResolvedValue(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedpassword');
      usersRepository.create.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValue('token');

      await service.register(createUserDto);

      // Should use 10 rounds as configured
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
    });

    it('should not include password_hash in the response', async () => {
      usersRepository.emailExists.mockResolvedValue(false);
      usersRepository.usernameExists.mockResolvedValue(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedpassword');
      usersRepository.create.mockResolvedValue({
        ...mockUser,
        password_hash: '$2b$10$hashedpassword',
      });
      jwtService.signAsync.mockResolvedValue('token');

      const result = await service.register(createUserDto);

      // Important: password hash should never be exposed
      expect(result.user.password_hash).toBeUndefined();
    });

    it('should generate both access and refresh tokens', async () => {
      const accessToken = 'access.jwt.token';
      const refreshToken = 'refresh.jwt.token';

      usersRepository.emailExists.mockResolvedValue(false);
      usersRepository.usernameExists.mockResolvedValue(false);
      (bcrypt.hash as jest.Mock).mockResolvedValue('$2b$10$hashedpassword');
      usersRepository.create.mockResolvedValue(mockUser);
      jwtService.signAsync.mockResolvedValueOnce(accessToken);
      jwtService.signAsync.mockResolvedValueOnce(refreshToken);

      const result = await service.register(createUserDto);

      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
      expect(result.access_token).toBe(accessToken);
      expect(result.refresh_token).toBe(refreshToken);
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'testuser@example.com',
      password: 'Password123!',
    };

    it('should successfully login with valid credentials', async () => {
      const accessToken = 'jwt.access.token';
      const refreshToken = 'jwt.refresh.token';

      usersRepository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValueOnce(accessToken);
      jwtService.signAsync.mockResolvedValueOnce(refreshToken);

      const result = await service.login(loginDto);

      expect(usersRepository.findByEmail).toHaveBeenCalledWith(loginDto.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password_hash,
      );
      expect(result.access_token).toBe(accessToken);
      expect(result.refresh_token).toBe(refreshToken);
      expect(result.user).toBeDefined();
    });

    it('should throw UnauthorizedException if user not found', async () => {
      usersRepository.findByEmail.mockResolvedValue(null);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);
      await expect(service.login(loginDto)).rejects.toThrow('Invalid credentials');

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if password is incorrect', async () => {
      usersRepository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(UnauthorizedException);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password_hash,
      );
      expect(jwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should not include password_hash in login response', async () => {
      usersRepository.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue('token');

      const result = await service.login(loginDto);

      expect(result.user.password_hash).toBeUndefined();
    });
  });

  describe('validateUser', () => {
    it('should return user when valid userId is provided', async () => {
      usersRepository.findById.mockResolvedValue(mockUser);

      const result = await service.validateUser(mockUser.id);

      expect(usersRepository.findById).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual(mockUser);
    });

    it('should return null when user is not found', async () => {
      usersRepository.findById.mockResolvedValue(null);

      const result = await service.validateUser('non-existent-id');

      expect(result).toBeNull();
    });
  });
});
