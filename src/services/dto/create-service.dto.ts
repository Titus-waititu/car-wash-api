import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
  Max,
  Min,
} from 'class-validator';
import { ServiceCategory } from 'src/types';

export class CreateServiceDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsPositive()
  price: number;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsInt()
  @IsPositive()
  duration_minutes: number;

  @IsEnum(ServiceCategory)
  category: ServiceCategory;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsUrl()
  image_url?: string;

  // Optional discounted price setup
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  original_price?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  discount_percentage?: number;

  // Service availability
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  service_areas?: string[];

  @IsOptional()
  @IsBoolean()
  is_mobile_service?: boolean;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  travel_charge_per_km?: number;

  // Vehicle types like sedan, SUV, bike, etc.
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supported_vehicle_types?: string[];

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  included_features?: string[];

  @IsOptional()
  @IsString()
  terms_and_conditions?: string;

  @IsNotEmpty()
  @IsString()
  userId: string;
}
