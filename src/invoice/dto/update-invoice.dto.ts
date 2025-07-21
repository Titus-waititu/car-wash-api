import { PartialType } from '@nestjs/swagger';
import { CreateInvoiceDto } from './create-invoice.dto';
import { IsOptional, IsEnum } from 'class-validator';
import { InvoiceStatus } from '../entities/invoice.entity';

export class UpdateInvoiceDto extends PartialType(CreateInvoiceDto) {
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus;
}
