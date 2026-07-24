import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { FriendsRepository } from './friends.repository';
import { UsersRepository } from '../users/users.repository';
import { FriendshipStatus } from './entities/friend-request.entity';

@Injectable()
export class FriendsService {
  private readonly logger = new Logger(FriendsService.name);

  constructor(
    private readonly friendsRepository: FriendsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async sendRequest(senderId: string, receiverId: string) {
    if (senderId === receiverId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }

    const receiver = await this.usersRepository.findById(receiverId);
    if (!receiver) {
      throw new NotFoundException('User not found');
    }

    const existingRelationship = await this.friendsRepository.findExistingRelationship(
      senderId,
      receiverId,
    );

    if (existingRelationship) {
      if (existingRelationship.status === FriendshipStatus.ACCEPTED) {
        throw new ConflictException('You are already friends with this user');
      }

      if (existingRelationship.status === FriendshipStatus.PENDING) {
        if (existingRelationship.sender_id === receiverId) {
          throw new ConflictException(
            'This user has already sent you a friend request. Accept it instead.',
          );
        }
        throw new ConflictException('Friend request already sent');
      }

      if (existingRelationship.status === FriendshipStatus.BLOCKED) {
        throw new BadRequestException('Cannot send friend request to this user');
      }
    }

    const request = await this.friendsRepository.sendRequest(senderId, receiverId);

    this.logger.log(`Friend request sent from ${senderId} to ${receiverId}`);

    return {
      message: 'Friend request sent successfully',
      request,
    };
  }

  async acceptRequest(requestId: string, userId: string) {
    const request = await this.friendsRepository.acceptRequest(requestId, userId);

    if (!request) {
      throw new NotFoundException('Friend request not found or already responded to');
    }

    this.logger.log(`Friend request ${requestId} accepted by ${userId}`);

    return {
      message: 'Friend request accepted',
      request,
    };
  }

  async declineRequest(requestId: string, userId: string) {
    const request = await this.friendsRepository.declineRequest(requestId, userId);

    if (!request) {
      throw new NotFoundException('Friend request not found or already responded to');
    }

    this.logger.log(`Friend request ${requestId} declined by ${userId}`);

    return {
      message: 'Friend request declined',
      request,
    };
  }

  async getPendingRequests(userId: string) {
    const requests = await this.friendsRepository.getPendingRequests(userId);

    return {
      data: requests,
      count: requests.length,
    };
  }

  async getSentRequests(userId: string) {
    const requests = await this.friendsRepository.getSentRequests(userId);

    return {
      data: requests,
      count: requests.length,
    };
  }
  async getFriends(userId: string, page: number = 1, limit: number = 20) {
    const { friends, total } = await this.friendsRepository.getFriends(
      userId,
      page,
      limit,
    );

    const totalPages = Math.ceil(total / limit);

    return {
      data: friends,
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

  async cancelRequest(requestId: string, userId: string) {
    const success = await this.friendsRepository.cancelRequest(requestId, userId);

    if (!success) {
      throw new NotFoundException('Friend request not found or cannot be cancelled');
    }

    this.logger.log(`Friend request ${requestId} cancelled by ${userId}`);

    return {
      message: 'Friend request cancelled successfully',
    };
  }

  async unfriend(userId: string, friendId: string) {
    if (userId === friendId) {
      throw new BadRequestException('Invalid operation');
    }

    const success = await this.friendsRepository.unfriend(userId, friendId);

    if (!success) {
      throw new NotFoundException('Friendship not found');
    }

    this.logger.log(`User ${userId} unfriended ${friendId}`);

    return {
      message: 'Friend removed successfully',
    };
  }

  async getFriendshipStatus(userId: string, otherUserId: string) {
    const relationship = await this.friendsRepository.findExistingRelationship(
      userId,
      otherUserId,
    );

    if (!relationship) {
      return {
        status: 'none',
        areFriends: false,
      };
    }

    const areFriends = relationship.status === FriendshipStatus.ACCEPTED;
    let mutualFriendsCount = 0;

    if (areFriends) {
      mutualFriendsCount = await this.friendsRepository.getMutualFriendsCount(
        userId,
        otherUserId,
      );
    }

    return {
      status: relationship.status,
      areFriends,
      mutualFriendsCount,
      requestId: relationship.id,
      requestSender: relationship.sender_id === userId ? 'you' : 'them',
    };
  }
}
