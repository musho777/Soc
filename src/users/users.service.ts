import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { SearchUsersDto } from './dto/search-users.dto';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
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

    return {
      data: users,
      total,
    };
  }
}
