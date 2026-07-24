import { ApiProperty } from '@nestjs/swagger';

export enum FriendshipStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  BLOCKED = 'blocked',
}
export class FriendRequest {
  @ApiProperty({
    description: 'Friend request unique identifier',
  })
  id!: string;

  @ApiProperty({
    description: 'User ID who sent the request',
  })
  sender_id!: string;

  @ApiProperty({
    description: 'User ID who received the request',
  })
  receiver_id!: string;

  @ApiProperty({
    enum: FriendshipStatus,
    example: FriendshipStatus.PENDING,
    description: 'Request status',
  })
  status!: FriendshipStatus;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'Request creation timestamp',
  })
  created_at!: Date;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'Request last update timestamp',
  })
  updated_at!: Date;

  @ApiProperty({
    example: '2024-01-15T11:00:00Z',
    description: 'Timestamp when request was responded to',
    required: false,
  })
  responded_at?: Date;
  sender?: unknown;
  receiver?: unknown;
}
