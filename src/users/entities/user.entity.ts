import { Exclude } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * User Entity - Represents a user in the system
 *
 * This entity excludes the password_hash from serialization
 * for security purposes using class-transformer
 */
export class User {
  @ApiProperty({
    example: '550e8400-e29b-41d4-a716-446655440000',
    description: 'User unique identifier (UUID)',
  })
  id: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address',
  })
  email: string;

  @ApiProperty({
    example: 'johndoe',
    description: 'Unique username',
  })
  username: string;

  @Exclude()
  password_hash?: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  first_name: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
  })
  last_name: string;

  @ApiProperty({
    example: '1990-05-15',
    description: 'User date of birth',
  })
  date_of_birth: string | Date;

  @ApiPropertyOptional({
    example: 33,
    description: 'User age (calculated from date of birth)',
  })
  age?: number;

  @ApiPropertyOptional({
    example: 'Software developer passionate about technology',
    description: 'User biography',
  })
  bio?: string;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.jpg',
    description: 'Profile picture URL',
  })
  profile_picture_url?: string;

  @ApiProperty({
    example: true,
    description: 'Account active status',
  })
  is_active: boolean;

  @ApiProperty({
    example: false,
    description: 'Email verification status',
  })
  is_verified: boolean;

  @ApiProperty({
    example: '2024-01-15T10:30:00Z',
    description: 'Account creation timestamp',
  })
  created_at: Date;

  @ApiProperty({
    example: '2024-01-20T14:45:00Z',
    description: 'Last account update timestamp',
  })
  updated_at: Date;

  @ApiPropertyOptional({
    example: '2024-01-22T09:15:00Z',
    description: 'Last login timestamp',
  })
  last_login_at?: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }
}
