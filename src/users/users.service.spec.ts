import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

describe('UsersService', () => {
  let service: UsersService;
  let repository: UsersRepository;

  const mockUsersRepository = {
    getProfile: jest.fn(),
    search: jest.fn(),
    findByUsername: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: UsersRepository,
          useValue: mockUsersRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    repository = module.get<UsersRepository>(UsersRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getProfile', () => {
    it('should return user profile when user exists', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        username: 'testuser',
        first_name: 'Test',
        last_name: 'User',
      };

      mockUsersRepository.getProfile.mockResolvedValue(mockUser);

      const result = await service.getProfile('123');

      expect(result).toEqual(mockUser);
      expect(mockUsersRepository.getProfile).toHaveBeenCalledWith('123');
    });

    it('should throw NotFoundException when user does not exist', async () => {
      mockUsersRepository.getProfile.mockResolvedValue(null);

      await expect(service.getProfile('123')).rejects.toThrow(NotFoundException);
    });
  });

  describe('search', () => {
    it('should return paginated search results', async () => {
      const mockSearchResult = {
        users: [
          { id: '1', first_name: 'John', last_name: 'Doe' },
          { id: '2', first_name: 'Jane', last_name: 'Doe' },
        ],
        total: 2,
      };

      mockUsersRepository.search.mockResolvedValue(mockSearchResult);

      const searchDto = { first_name: 'John', page: 1, limit: 20 };
      const result = await service.search(searchDto);

      expect(result.data).toEqual(mockSearchResult.users);
      expect(result.pagination.total).toBe(2);
      expect(result.pagination.page).toBe(1);
    });
  });

  describe('getByUsername', () => {
    it('should return user when username exists', async () => {
      const mockUser = {
        id: '123',
        username: 'testuser',
        first_name: 'Test',
      };

      mockUsersRepository.findByUsername.mockResolvedValue(mockUser);

      const result = await service.getByUsername('testuser');

      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when username does not exist', async () => {
      mockUsersRepository.findByUsername.mockResolvedValue(null);

      await expect(service.getByUsername('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
