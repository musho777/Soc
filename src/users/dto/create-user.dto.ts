import { Transform } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    example: 'test@gmail.com',
    description: 'User email address',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: 'username',
    description:
      'Unique username (3-50 characters, letters, numbers, and underscores only)',
  })
  @Transform(({ value }) => value?.trim().toLowerCase())
  @IsString()
  @MinLength(3, {
    message: 'Username must be at least 3 characters long',
  })
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username can only contain letters, numbers, and underscores',
  })
  username!: string;

  @ApiProperty({
    example: 'Password123!',
    description: 'Password must be at least 6 characters',
  })
  @IsString()
  @MinLength(6, {
    message: 'Password must be at least 6 characters long',
  })
  password!: string;

  @ApiProperty({
    example: 'first name',
    description: 'User first name',
  })
  @IsString()
  @MinLength(1)
  firstName!: string;

  @ApiProperty({
    example: 'last name',
    description: 'User last name',
  })
  @IsString()
  @MinLength(1)
  lastName!: string;

  @ApiProperty({
    example: '2001-09-03',
    description: 'Date of birth in YYYY-MM-DD format',
  })
  @IsDateString()
  dateOfBirth!: string;
}
