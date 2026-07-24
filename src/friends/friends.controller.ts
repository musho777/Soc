import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FriendsService } from './friends.service';
import { SendFriendRequestDto } from './dto/send-friend-request.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';

@ApiTags('Friends')
@ApiBearerAuth()
@Controller('friends')
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  @Post('requests')
  @HttpCode(HttpStatus.CREATED)
  async sendRequest(@CurrentUser() user: User, @Body() dto: SendFriendRequestDto) {
    return await this.friendsService.sendRequest(user.id, dto.receiver_id);
  }

  @Get('requests/pending')
  async getPendingRequests(@CurrentUser() user: User) {
    return await this.friendsService.getPendingRequests(user.id);
  }

  @Get('requests/sent')
  async getSentRequests(@CurrentUser() user: User) {
    return await this.friendsService.getSentRequests(user.id);
  }

  @Patch('requests/:id/accept')
  async acceptRequest(@CurrentUser() user: User, @Param('id') id: string) {
    return await this.friendsService.acceptRequest(id, user.id);
  }

  @Patch('requests/:id/decline')
  async declineRequest(@CurrentUser() user: User, @Param('id') id: string) {
    return await this.friendsService.declineRequest(id, user.id);
  }

  @Delete('requests/:id')
  async cancelRequest(@CurrentUser() user: User, @Param('id') id: string) {
    return await this.friendsService.cancelRequest(id, user.id);
  }

  @Get()
  async getFriends(
    @CurrentUser() user: User,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return await this.friendsService.getFriends(user.id, Number(page), Number(limit));
  }

  @Delete(':friendId')
  async unfriend(@CurrentUser() user: User, @Param('friendId') friendId: string) {
    return await this.friendsService.unfriend(user.id, friendId);
  }

  @Get('status/:userId')
  async getFriendshipStatus(@CurrentUser() user: User, @Param('userId') userId: string) {
    return await this.friendsService.getFriendshipStatus(user.id, userId);
  }
}
