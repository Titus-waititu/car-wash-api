import {
  IsString,
  IsNotEmpty,
  // IsPhoneNumber,
  IsNumber,
  IsOptional,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class InitializeMpesaPaymentDto {
  @ApiProperty({ description: 'Booking ID for the payment' })
  @IsString()
  @IsNotEmpty()
  bookingId: string;

  @ApiProperty({ description: 'Phone number in format 2547XXXXXXXX' })
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;

  @ApiProperty({ description: 'Amount to pay', example: 1000 })
  @IsNumber()
  amount: number;

  @ApiProperty({ description: 'Account reference (optional)', required: false })
  @IsOptional()
  @IsString()
  accountReference?: string;

  @ApiProperty({
    description: 'Transaction description (optional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  transactionDesc?: string;
}
