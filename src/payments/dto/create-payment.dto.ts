import { IsEnum, IsNotEmpty, IsNumber, IsOptional } from 'class-validator';
import { PaymentMethod, PaymentStatus } from 'src/types';

export class CreatePaymentDto {
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @IsEnum(PaymentStatus)
  @IsNotEmpty()
  status: PaymentStatus;

  @IsEnum(PaymentMethod)
  @IsNotEmpty()
  payment_method: PaymentMethod;

  @IsOptional()
  transaction_id:string

  @IsNotEmpty()
  bookingId: string;
}
