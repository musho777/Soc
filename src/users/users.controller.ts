import {
  Controller,
  Get,
  Query,
  Param,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { SearchUsersDto } from './dto/search-users.dto';
import { User } from './entities/user.entity';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
@UseInterceptors(ClassSerializerInterceptor)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  async getMe(@CurrentUser() user: User): Promise<User> {
    return await this.usersService.getProfile(user.id);
  }

  @Get('search')
  async search(@Query() searchDto: SearchUsersDto) {
    return await this.usersService.search(searchDto);
  }

  @Get(':id')
  async getById(@Param('id') id: string): Promise<User> {
    return await this.usersService.getProfile(id);
  }
}
