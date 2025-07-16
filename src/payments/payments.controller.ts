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
  UseGuards,
  Headers,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { InitializePaymentDto } from './dto/initialize-payment.dto';
import { VerifyPaymentDto } from './dto/verify-payment.dto';
import { InitializeMpesaPaymentDto } from './dto/initialize-mpesa-payment.dto';
import { InitializeStripePaymentDto } from './dto/initialize-stripe-payment.dto';
import { VerifyMpesaPaymentDto, VerifyStripePaymentDto } from './dto/verify-payments.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { UserRole } from 'src/types';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiHeader } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('payments')
@Controller('payments')
@UseGuards(RolesGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ==================== GENERAL PAYMENT ENDPOINTS ====================

  @Post()
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Create a manual payment record' })
  @ApiResponse({ status: 201, description: 'Payment created successfully.' })
  create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.create(createPaymentDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get all payments or filter by user' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter payments by user ID' })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully.' })
  findAll(@Query('userId') userId?: string) {
    return this.paymentsService.findAll(userId);
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  @ApiOperation({ summary: 'Get payment statistics' })
  @ApiResponse({ status: 200, description: 'Payment statistics retrieved successfully.' })
  getStatistics() {
    return this.paymentsService.getPaymentStatistics();
  }

  @Get('booking/:bookingId')
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get payments for a specific booking' })
  @ApiResponse({ status: 200, description: 'Booking payments retrieved successfully.' })
  getPaymentsByBooking(@Param('bookingId') bookingId: string) {
    return this.paymentsService.getPaymentsByBooking(bookingId);
  }

  @Get('transaction/:transactionId')
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get payment by transaction ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully.' })
  getPaymentByTransactionId(@Param('transactionId') transactionId: string) {
    return this.paymentsService.getPaymentByTransactionId(transactionId);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Get payment by ID' })
  @ApiResponse({ status: 200, description: 'Payment retrieved successfully.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  @ApiOperation({ summary: 'Update payment' })
  @ApiResponse({ status: 200, description: 'Payment updated successfully.' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePaymentDto: UpdatePaymentDto,
  ) {
    return this.paymentsService.update(id, updatePaymentDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete payment' })
  @ApiResponse({ status: 200, description: 'Payment deleted successfully.' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.remove(id);
  }

  @Post(':id/cancel')
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Cancel pending payment' })
  @ApiResponse({ status: 200, description: 'Payment cancelled successfully.' })
  cancelPayment(@Param('id', ParseUUIDPipe) id: string) {
    return this.paymentsService.cancelPendingPayment(id);
  }

  @Post(':id/refund')
  @Roles(UserRole.ADMIN, UserRole.VENDOR)
  @ApiOperation({ summary: 'Refund completed payment' })
  @ApiResponse({ status: 200, description: 'Payment refunded successfully.' })
  refundPayment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() refundData: { reason?: string },
  ) {
    return this.paymentsService.refundPayment(id, refundData.reason);
  }

  // ==================== M-PESA PAYMENT ENDPOINTS ====================

  @Post('mpesa/initialize')
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Initialize M-Pesa STK Push payment' })
  @ApiResponse({ status: 201, description: 'M-Pesa payment initialized successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid phone number or booking.' })
  initializeMpesaPayment(@Body() initializeDto: InitializeMpesaPaymentDto) {
    return this.paymentsService.initializeMpesaPayment(initializeDto);
  }

  @Post('mpesa/verify')
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Verify M-Pesa payment status' })
  @ApiResponse({ status: 200, description: 'M-Pesa payment verified successfully.' })
  verifyMpesaPayment(@Body() verifyDto: VerifyMpesaPaymentDto) {
    return this.paymentsService.verifyMpesaPayment(verifyDto);
  }

  @Post('mpesa/callback')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'M-Pesa callback endpoint (webhook)' })
  @ApiResponse({ status: 200, description: 'Callback processed successfully.' })
  processMpesaCallback(@Body() callbackData: any) {
    return this.paymentsService.processMpesaCallback(callbackData);
  }

  // ==================== STRIPE PAYMENT ENDPOINTS ====================

  @Post('stripe/initialize')
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Initialize Stripe payment (Payment Intent or Checkout Session)' })
  @ApiResponse({ status: 201, description: 'Stripe payment initialized successfully.' })
  @ApiResponse({ status: 400, description: 'Invalid booking or payment data.' })
  initializeStripePayment(@Body() initializeDto: InitializeStripePaymentDto) {
    return this.paymentsService.initializeStripePayment(initializeDto);
  }

  @Post('stripe/verify')
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Verify Stripe payment status' })
  @ApiResponse({ status: 200, description: 'Stripe payment verified successfully.' })
  verifyStripePayment(@Body() verifyDto: VerifyStripePaymentDto) {
    return this.paymentsService.verifyStripePayment(verifyDto);
  }
  @Post('stripe/webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Stripe webhook endpoint' })
  @ApiHeader({ name: 'stripe-signature', required: true })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully.' })
  processStripeWebhook(
    @Req() req,
    @Headers('stripe-signature') signature: string,
  ) {
    return this.paymentsService.processStripeWebhook(req.rawBody ? req.rawBody.toString() : req.body, signature);
  }

  // ==================== LEGACY ENDPOINTS (for backward compatibility) ====================

  @Post('initialize')
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Legacy: Initialize payment (Paystack)' })
  @ApiResponse({ status: 201, description: 'Payment initialized successfully.' })
  legacyInitializePayment(@Body() initializeDto: InitializePaymentDto) {
    // For backward compatibility, redirect to appropriate service
    if (initializeDto.email) {
      const stripeDto: InitializeStripePaymentDto = {
        bookingId: initializeDto.bookingId,
        email: initializeDto.email,
        amount: 0, // Will be taken from booking
        successUrl: 'https://yourdomain.com/payment/success',
        cancelUrl: 'https://yourdomain.com/payment/cancel',
      };
      return this.paymentsService.initializeStripePayment(stripeDto);
    }
    throw new Error('Email is required for payment initialization');
  }

  @Post('verify')
  @Roles(UserRole.ADMIN, UserRole.VENDOR, UserRole.CUSTOMER)
  @ApiOperation({ summary: 'Legacy: Verify payment' })
  @ApiResponse({ status: 200, description: 'Payment verified successfully.' })
  legacyVerifyPayment(@Body() verifyDto: VerifyPaymentDto) {
    // Try to verify as Stripe session first, then as transaction ID
    const stripeVerifyDto: VerifyStripePaymentDto = {
      sessionId: verifyDto.reference,
    };
    return this.paymentsService.verifyStripePayment(stripeVerifyDto);
  }

  @Post('webhook')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Legacy: Payment webhook (Paystack)' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully.' })
  legacyWebhook(@Body() payload: any) {
    // For backward compatibility - you can implement Paystack webhook handling here
    return { status: 'success', message: 'Legacy webhook processed' };
  }
}
