import {
  IsNotEmpty,
  IsUUID,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  Min,
} from 'class-validator';

export class CreateInvoiceDto {
  @IsNotEmpty()
  @IsUUID()
  bookingId: string;

  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  tax_amount?: number;

  @IsOptional()
  @IsDateString()
  due_date?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}
