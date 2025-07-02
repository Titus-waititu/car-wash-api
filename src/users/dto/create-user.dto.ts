import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  MinLength,
  MaxLength,
  IsDecimal,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from 'src/types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: 'Username',
    example: 'john_doe',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  username: string;

  @ApiProperty({
    description: 'Password (minimum 6 characters)',
    example: 'password123',
  })
  @IsOptional()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password: string;

  @ApiProperty({
    description: 'Email address',
    example: 'john@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+1234567890',
  })
  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  phone_number: string;

  @ApiPropertyOptional({
    description: 'User role',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  // Location fields
  @ApiPropertyOptional({
    description: 'Address',
    example: '123 Main St, City, State',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({
    description: 'Latitude',
    example: 40.7128,
  })
  @IsNumber()
  @IsOptional()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({
    description: 'Longitude',
    example: -74.006,
  })
  @IsNumber()
  @IsOptional()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({
    description: 'City',
    example: 'New York',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    description: 'State',
    example: 'NY',
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({
    description: 'Postal code',
    example: '10001',
  })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  postal_code?: string;

  // Vendor-specific fields
  @ApiPropertyOptional({
    description: 'Business name (for vendors)',
    example: 'Premium Car Wash Services',
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  business_name?: string;

  @ApiPropertyOptional({
    description: 'Business license number (for vendors)',
    example: 'BL123456',
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  business_license?: string;

  @ApiPropertyOptional({
    description: 'Business description (for vendors)',
    example: 'Professional car wash service with eco-friendly products',
  })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  business_description?: string;

  @ApiPropertyOptional({
    description: 'Service radius in kilometers',
    example: 15.5,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  service_radius_km?: number;

  @IsOptional()
  @Transform(() => new Date())
  created_at?: Date;

  @IsOptional()
  @Transform(() => new Date())
  updated_at?: Date;
}
