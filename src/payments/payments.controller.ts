import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('payments')
@Public()
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Get()
  findAll(@Query('userId') userId?: string) {
    if (userId) {
      return this.paymentsService.getPaymentHistory(userId);
    }
    return this.paymentsService.findAll();
  }

  @Get('statistics')
  getStatistics() {
    return this.paymentsService.getPaymentStatistics();
  }

  @Get('booking/:bookingId')
  getByBooking(@Param('bookingId', ParseUUIDPipe) bookingId: string) {
    return this.paymentsService.getPaymentsByBooking(bookingId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ) {
    return this.paymentsService.update(id, updatePaymentDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.remove(id);
  }

  @Post('initialize')
  async initializePayment(@Body() initializePaymentDto: InitializePaymentDto) {
    return this.paymentsService.initializePayment(
      initializePaymentDto.bookingId,
      initializePaymentDto.email,
    );
  }

  @Post('verify')
  async verifyPayment(@Body() verifyPaymentDto: VerifyPaymentDto) {
    return this.paymentsService.processPaymentVerification(
      verifyPaymentDto.reference,
    );
  }

  @Post(':id/refund')
  async refundPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() refundPaymentDto: RefundPaymentDto,
  ) {
    return this.paymentsService.refundPayment(id, refundPaymentDto.reason);
  }

  @Post('webhook')
  async handleWebhook(@Body() payload: any) {
    return this.paymentsService.handlePaymentWebhook(payload);
  }

  @Post(':id/cancel')
  async cancelPayment(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.cancelPendingPayment(id);
  }

  @Get('transaction/:transactionId')
  async getByTransactionId(@Param('transactionId') transactionId: string) {
    return this.paymentsService.getPaymentByTransactionId(transactionId);
  }
}
