import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'User email address',
  })
  @Transform(({ value }) => value?.trim().toLowerCase())
  @IsEmail({}, { message: 'Invalid email format' })
  email!: string;

  @ApiProperty({
    example: 'johndoe',
    description:
      'Unique username (3-50 characters, letters, numbers, and underscores only)',
  })
  @Transform(({ value }) => value?.trim().toLowerCase())
  @IsString()
  @MinLength(3, {
    message: 'Username must be at least 3 characters long',
  })
  @MaxLength(50, {
    message: 'Username cannot exceed 50 characters',
  })
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username!: string;

  @ApiProperty({
    example: 'Password123!',
    description:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  @IsString()
  @MinLength(8, {
    message: 'Password must be at least 8 characters long',
  })
  @MaxLength(128, {
    message: 'Password cannot exceed 128 characters',
  })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).*$/, {
    message:
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
  })
  password!: string;

  @ApiProperty({
    example: 'John',
    description: 'User first name',
  })
  @Transform(({ value }) => value?.trim())
  @IsString()
  @MinLength(1, {
    message: 'First name is required',
  })
  @MaxLength(100, {
    message: 'First name cannot exceed 100 characters',
  })
  firstName!: string;

  @ApiProperty({
    example: 'Doe',
    description: 'User last name',
  })
  @Transform(({ value }) => value?.trim())
  @IsString()
  @MinLength(1, {
    message: 'Last name is required',
  })
  @MaxLength(100, {
    message: 'Last name cannot exceed 100 characters',
  })
  lastName!: string;

  @ApiProperty({
    example: '1990-05-15',
    description: 'Date of birth in YYYY-MM-DD format',
  })
  @IsDateString(
    {},
    {
      message: 'Invalid date format. Use YYYY-MM-DD',
    },
  )
  dateOfBirth!: string;
}
