import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Controller('invoice')
export class InvoiceController {
  constructor(private readonly invoiceService: InvoiceService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() createInvoiceDto: CreateInvoiceDto) {
    return this.invoiceService.create(createInvoiceDto);
  }

  @Get()
  findAll(@Query('customerId') customerId?: string) {
    return this.invoiceService.findAll(customerId);
  }

  @Get('stats')
  getStats() {
    return this.invoiceService.getInvoiceStats();
  }

  @Get('overdue')
  getOverdueInvoices() {
    return this.invoiceService.getOverdueInvoices();
  }

  @Patch('overdue/update')
  @HttpCode(HttpStatus.OK)
  updateOverdueInvoices() {
    return this.invoiceService.updateOverdueInvoices();
  }

  @Get('number/:invoiceNumber')
  findByInvoiceNumber(@Param('invoiceNumber') invoiceNumber: string) {
    return this.invoiceService.findByInvoiceNumber(invoiceNumber);
  }

  @Get('booking/:bookingId')
  findByBookingId(@Param('bookingId', ParseUUIDPipe) bookingId: string) {
    return this.invoiceService.findByBookingId(bookingId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoiceService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateInvoiceDto: UpdateInvoiceDto,
  ) {
    return this.invoiceService.update(id, updateInvoiceDto);
  }

  @Patch(':id/send')
  @HttpCode(HttpStatus.OK)
  markAsSent(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoiceService.markAsSent(id);
  }

  @Patch(':id/paid')
  @HttpCode(HttpStatus.OK)
  markAsPaid(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('paymentId') paymentId?: string,
  ) {
    return this.invoiceService.markAsPaid(id, paymentId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.invoiceService.remove(id);
  }
}
