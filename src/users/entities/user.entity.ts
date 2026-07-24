import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class User {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User unique identifier (UUID)',
  })
  id!: string;

  @ApiProperty({
    example: 'test@gmail.com',
    description: 'User email address',
  })
  email!: string;

  @ApiProperty({
    example: 'username',
    description: 'Unique username',
  })
  username!: string;

  @Exclude()
  password_hash?: string;

  @ApiProperty({
    example: 'first name',
    description: 'User first name',
  })
  first_name!: string;

  @ApiProperty({
    example: 'last name',
    description: 'User last name',
  })
  last_name!: string;

  @ApiProperty({
    example: '2001-03-09',
    description: 'User date of birth',
  })
  date_of_birth!: string | Date;

  @ApiPropertyOptional({
    example: 33,
    description: 'User age',
  })
  age?: number;

  @ApiProperty({
    example: true,
    description: 'Account active status',
  })
  is_active!: boolean;

  @ApiProperty({
    example: false,
    description: 'Email verification status',
  })
  is_verified!: boolean;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
  })
  created_at!: Date;

  @ApiProperty({
    example: '2024-01-20T14:45:00Z',
  })
  updated_at!: Date;

  @ApiPropertyOptional({
    example: '2024-01-22T09:15:00Z',
  })
  last_login_at?: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
