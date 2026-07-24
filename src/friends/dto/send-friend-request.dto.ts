import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendFriendRequestDto {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User ID to send friend request to',
  })
  @IsUUID('4', { message: 'Invalid user ID format' })
  receiver_id: string;
}
