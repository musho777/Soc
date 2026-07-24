import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class SearchUsersDto {
  @ApiPropertyOptional({
    example: 'Name',
    description: 'first name',
  })
  @IsOptional()
  @IsString()
  first_name?: string;

  @ApiPropertyOptional({
    example: 'Surname',
    description: 'last name',
  })
  @IsOptional()
  @IsString()
  last_name?: string;

  @ApiPropertyOptional({
    example: 18,
    description: 'Minimum age',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  age_min?: number;

  @ApiPropertyOptional({
    example: 65,
    description: 'Maximum age',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  age_max?: number;

  @ApiPropertyOptional({
    example: 1,
    description: 'Page number',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20,
    description: 'Number of results per page',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
