import {
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

   @IsNumber()
  @IsNotEmpty()
  userId: number;

 @IsNumber()
  @IsNotEmpty()
  serviceId: number;

  @IsNumber()
  @IsNotEmpty()
  paymentId: number;
}
