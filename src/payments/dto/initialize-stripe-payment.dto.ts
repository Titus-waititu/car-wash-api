import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsEmail,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitializeStripePaymentDto {
  @ApiProperty({ description: 'Booking ID for the payment' })
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @ApiProperty({ description: 'Customer email' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ description: 'Amount in cents (e.g., 1000 = $10.00)' })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'usd',
    required: false,
  })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiProperty({ description: 'Customer name (optional)', required: false })
  @IsOptional()
  @IsString()
  customerName?: string;

  @ApiProperty({ description: 'Success URL (optional)', required: false })
  @IsOptional()
  @IsString()
  successUrl?: string;

  @ApiProperty({ description: 'Cancel URL (optional)', required: false })
  @IsOptional()
  @IsString()
  cancelUrl?: string;
}
