import { IsEmail, IsNotEmpty, IsUUID } from 'class-validator';

export class InitializePaymentDto {
  @IsUUID()
  @IsNotEmpty()
  bookingId: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}
