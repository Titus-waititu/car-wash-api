import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { BookingStatus } from '../entities/booking.entity';

export class CreateBookingDto {
  @IsDateString()
  @IsNotEmpty()
  booking_time: Date;

  @IsEnum(BookingStatus)
  @IsOptional()
  status?: BookingStatus;

  @IsString()
  @IsOptional()
  address?: string;

  @IsOptional()
  @IsBoolean()
  is_recurring?: boolean;

  @IsString()
  @IsOptional()
  special_instructions?: string;

  @IsNumber()
  @IsOptional()
  total_amount?: number;

  @IsNotEmpty()
  @IsString()
  userId: string;

  @IsNotEmpty()
  @IsString()
  serviceId: string;

  @IsOptional()
  @IsString()
  vehicleId?: string;

  @IsOptional()
  @IsString()
  locationId?: string;
}
