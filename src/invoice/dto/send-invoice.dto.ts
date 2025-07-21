import { IsOptional, IsString } from 'class-validator';

export class SendInvoiceDto {
  @IsOptional()
  @IsString()
  customMessage?: string;
}
