import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { SearchUsersDto } from './dto/search-users.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(private readonly usersRepository: UsersRepository) {}

  async getProfile(userId: string): Promise<User> {
    const user = await this.usersRepository.getProfile(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

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
}
