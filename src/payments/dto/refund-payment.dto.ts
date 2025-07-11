import { IsOptional, IsString } from 'class-validator';

export class RefundPaymentDto {
  @IsString()
  @IsOptional()
  reason?: string;
}
