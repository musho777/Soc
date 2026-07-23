import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { SearchUsersDto } from './dto/search-users.dto';
import { User } from './entities/user.entity';

/**
 * Users Service - Business logic for user operations
 */
@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly usersRepository: UsersRepository) {}

  /**
   * Get user profile by ID
   * @param userId User ID
   * @returns User profile
   */
  async getProfile(userId: string): Promise<User> {
    const user = await this.usersRepository.getProfile(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Search users with advanced filters
   * @param searchDto Search criteria
   * @returns Paginated search results
   */
  async search(searchDto: SearchUsersDto) {
    const { users, total } = await this.usersRepository.search(searchDto);

    const page = searchDto.page || 1;
    const limit = searchDto.limit || 20;
    const totalPages = Math.ceil(total / limit);

    this.logger.log(
      `User search: ${users.length} results found (page ${page}/${totalPages})`,
    );

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Get user by username
   * @param username Username
   * @returns User
   */
  async getByUsername(username: string): Promise<User> {
    const user = await this.usersRepository.findByUsername(username);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
