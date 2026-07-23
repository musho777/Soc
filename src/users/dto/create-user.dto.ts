import { IsEmail, IsString, MinLength, MaxLength, Matches, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for user registration
 */
export class CreateUserDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address',
  })
  @IsEmail({}, { message: 'Invalid email format' })
  email: string;

  @ApiProperty({
    example: 'johndoe',
    description: 'Unique username (3-50 characters, alphanumeric and underscore)',
  })
  @IsString()
  @MinLength(3, { message: 'Username must be at least 3 characters long' })
  @MaxLength(50, { message: 'Username cannot exceed 50 characters' })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'User password (minimum 8 characters, must contain uppercase, lowercase, and number)',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
  })
  password: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  @IsString()
  @MinLength(1, { message: 'First name is required' })
  @MaxLength(100, { message: 'First name cannot exceed 100 characters' })
  first_name: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
  })
  @IsString()
  @MinLength(1, { message: 'Last name is required' })
  @MaxLength(100, { message: 'Last name cannot exceed 100 characters' })
  last_name: string;

  @ApiProperty({
    example: '1990-05-15',
    description: 'User date of birth (ISO 8601 format)',
  })
  @IsDateString({}, { message: 'Invalid date format. Use YYYY-MM-DD' })
  date_of_birth: string;

  @ApiProperty({
    example: 'Software developer passionate about technology',
    description: 'User biography (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Bio cannot exceed 500 characters' })
  bio?: string;

  // This field is set during registration, not from user input
  password_hash?: string;
}
