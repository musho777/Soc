import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchUsersDto {
  @ApiPropertyOptional({
    example: 'John',
    description: 'Search by first name (partial match, case-insensitive)',
  })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiPropertyOptional({
    example: 'Doe',
    description: 'Search by last name (partial match, case-insensitive)',
  })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional({
    example: 18,
    description: 'Minimum age',
    minimum: 0,
    maximum: 150,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Minimum age must be an integer' })
  @Min(0, { message: 'Minimum age cannot be negative' })
  @Max(150, { message: 'Minimum age cannot exceed 150' })
  age_min?: number;

  @ApiPropertyOptional({
    example: 65,
    description: 'Maximum age',
    minimum: 0,
    maximum: 150,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Maximum age must be an integer' })
  @Min(0, { message: 'Maximum age cannot be negative' })
  @Max(150, { message: 'Maximum age cannot exceed 150' })
  age_max?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number',
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    description: 'Number of results per page',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 20;
}
