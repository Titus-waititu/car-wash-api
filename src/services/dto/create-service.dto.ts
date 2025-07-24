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
import { ServiceCategory, VehicleType } from 'src/types';
import { FeatureType } from 'src/services/entities/service.entity';

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

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  original_price?: number;

  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  discount_percentage?: number;

  @IsOptional()
  @IsBoolean()
  is_mobile_service?: boolean;

  @IsOptional()
  @IsArray()
  @IsEnum(VehicleType, { each: true })
  supported_vehicle_types?: VehicleType[];

  @IsOptional()
  @IsArray()
  @IsEnum(FeatureType, { each: true })
  included_features?: FeatureType[];

  @IsOptional()
  @IsString()
  terms_and_conditions?: string;

  @IsNotEmpty()
  @IsString()
  userId: string;
}
