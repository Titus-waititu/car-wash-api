import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  MinLength,
  MaxLength,
  Min,
  Max,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ServiceProviderStatus, UserRole } from 'src/types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({ description: 'Username', example: 'john_doe' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  username: string;

  @ApiPropertyOptional({
    description: 'Password (minimum 6 characters)',
    example: 'password123',
  })
  @IsOptional()
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  password?: string;

  @ApiProperty({ description: 'Email address', example: 'john@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Phone number', example: '+1234567890' })
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

  // 📍 Location-based fields
  @ApiPropertyOptional({ description: 'Address', example: '123 Main St' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ description: 'Latitude', example: 40.7128 })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiPropertyOptional({ description: 'Longitude', example: -74.006 })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiPropertyOptional({ description: 'City', example: 'New York' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    description: 'Service provider online/offline status',
    enum: ServiceProviderStatus,
    default: ServiceProviderStatus.ONLINE,
  })
  @IsOptional()
  @IsEnum(ServiceProviderStatus, {
    message: 'status must be one of the predefined service provider statuses.',
  })
  status?: ServiceProviderStatus;

  @ApiPropertyOptional({ description: 'Postal code', example: '10001' })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postal_code?: string;

  @ApiPropertyOptional({
    description: 'Commission rate (%) for vendor',
    example: 15,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  commission_rate?: number;

  // 🧼 Vendor-specific fields
  @ApiPropertyOptional({
    description: 'Business name (for vendors)',
    example: 'Premium Car Wash',
  })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  business_name?: string;

  @ApiPropertyOptional({ description: 'Image URL' })
  @IsOptional()
  @IsString()
  image_url?: string;

  // add is active field for vendors
  @ApiPropertyOptional({
    description: 'Is the vendor active?',
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @ApiPropertyOptional({
    description: 'Business license number',
    example: 'BL123456',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  business_license?: string;

  @ApiPropertyOptional({
    description: 'Business description',
    example: 'We provide eco-friendly car wash services...',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  business_description?: string;

  @ApiPropertyOptional({
    description: 'Service radius (in km)',
    example: 10.5,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  service_radius_km?: number;

  // 🔗 Optional location linkage for vendors
  @ApiPropertyOptional({
    description: 'ID of the car wash location this vendor belongs to',
    example: 'c9b2cfe0-41dd-4310-a9b7-9d1b5014f1f4',
  })
  @IsUUID()
  @IsOptional()
  locationId?: string;

  @IsOptional()
  @Transform(() => new Date())
  created_at?: Date;

  @IsOptional()
  @Transform(() => new Date())
  updated_at?: Date;
}
