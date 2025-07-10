import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsDateString,
  IsNumber,
} from 'class-validator';
import { VehicleStatus } from 'src/types';

export class CreateFleetDto {
  @IsString()
  @IsNotEmpty()
  plate_number: string;

  @IsString()
  @IsNotEmpty()
  model: string;

  @IsString()
  @IsNotEmpty()
  type: string;

  @IsString()
  @IsOptional()
  color?: string;

  @IsString()
  @IsOptional()
  make?: string;

  @IsNumber()
  @IsOptional()
  year?: number;

  @IsString()
  @IsOptional()
  vin_number?: string;

  @IsEnum(VehicleStatus)
  @IsOptional()
  status?: VehicleStatus;

  @IsDateString()
  @IsOptional()
  last_service_date?: Date;

  @IsDateString()
  @IsOptional()
  next_service_due?: Date;

  @IsString()
  @IsOptional()
  current_assignment?: string;

  @IsNotEmpty()
  @IsString()
  userId: string;
}
