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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Send a friend request' })
  @ApiResponse({
    status: 201,
    description: 'Friend request sent successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid request (cannot send to yourself)',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Already friends or request already exists',
  })
  async sendRequest(@CurrentUser() user: User, @Body() dto: SendFriendRequestDto) {
    return await this.friendsService.sendRequest(user.id, dto.receiver_id);
  }

  @Get('requests/pending')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get pending friend requests received' })
  @ApiResponse({
    status: 200,
    description: 'List of pending friend requests',
  })
  async getPendingRequests(@CurrentUser() user: User) {
    return await this.friendsService.getPendingRequests(user.id);
  }

  @Get('requests/sent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get sent friend requests' })
  @ApiResponse({
    status: 200,
    description: 'List of sent friend requests',
  })
  async getSentRequests(@CurrentUser() user: User) {
    return await this.friendsService.getSentRequests(user.id);
  }

  @Patch('requests/:id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Accept a friend request' })
  @ApiParam({
    name: 'id',
    description: 'Friend request ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Friend request accepted',
  })
  @ApiResponse({
    status: 404,
    description: 'Friend request not found',
  })
  async acceptRequest(@CurrentUser() user: User, @Param('id') id: string) {
    return await this.friendsService.acceptRequest(id, user.id);
  }

  @Patch('requests/:id/decline')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Decline a friend request' })
  @ApiParam({
    name: 'id',
    description: 'Friend request ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Friend request declined',
  })
  @ApiResponse({
    status: 404,
    description: 'Friend request not found',
  })
  async declineRequest(@CurrentUser() user: User, @Param('id') id: string) {
    return await this.friendsService.declineRequest(id, user.id);
  }

  @Delete('requests/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel a sent friend request' })
  @ApiParam({
    name: 'id',
    description: 'Friend request ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Friend request cancelled',
  })
  @ApiResponse({
    status: 404,
    description: 'Friend request not found',
  })
  async cancelRequest(@CurrentUser() user: User, @Param('id') id: string) {
    return await this.friendsService.cancelRequest(id, user.id);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get list of friends' })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Results per page',
    example: 20,
  })
  @ApiResponse({
    status: 200,
    description: 'List of friends retrieved successfully',
  })
  async getFriends(
    @CurrentUser() user: User,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return await this.friendsService.getFriends(user.id, Number(page), Number(limit));
  }

  @Delete(':friendId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a friend (unfriend)' })
  @ApiParam({
    name: 'friendId',
    description: 'Friend user ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Friend removed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Friendship not found',
  })
  async unfriend(@CurrentUser() user: User, @Param('friendId') friendId: string) {
    return await this.friendsService.unfriend(user.id, friendId);
  }

  @Get('status/:userId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get friendship status with a user' })
  @ApiParam({
    name: 'userId',
    description: 'User ID to check status with',
  })
  @ApiResponse({
    status: 200,
    description: 'Friendship status retrieved',
  })
  async getFriendshipStatus(@CurrentUser() user: User, @Param('userId') userId: string) {
    return await this.friendsService.getFriendshipStatus(user.id, userId);
  }
}
