import { IsEnum, IsNotEmpty, IsNumber } from 'class-validator';
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
  method: PaymentMethod;

  @IsNotEmpty()
  bookingId: number;
}
