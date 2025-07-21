import {
  HttpException,
  HttpStatus,
  Injectable,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { InitializeMpesaPaymentDto } from './dto/initialize-mpesa-payment.dto';
import { InitializeStripePaymentDto } from './dto/initialize-stripe-payment.dto';
import {
  VerifyMpesaPaymentDto,
  VerifyStripePaymentDto,
} from './dto/verify-payments.dto';
import { Payment } from './entities/payment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { Booking } from '../bookings/entities/booking.entity';
import { PaymentStatus, PaymentMethod } from '../types';
import { MpesaService } from './services/mpesa.service';
import { StripeService } from './services/stripe.service';
import { InvoiceService } from '../invoice/invoice.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    private configService: ConfigService,
    private mpesaService: MpesaService,
    private stripeService: StripeService,
    @Inject(forwardRef(() => InvoiceService))
    private invoiceService: InvoiceService,
  ) {}

  async create(createPaymentDto: CreatePaymentDto): Promise<Payment> {
    // Find the booking
    const booking = await this.bookingRepository.findOne({
      where: { id: createPaymentDto.bookingId },
    });

    if (!booking) {
      throw new HttpException('Booking not found', HttpStatus.NOT_FOUND);
    }

    // Create payment entity
    const payment = this.paymentRepository.create({
      amount: createPaymentDto.amount,
      status: createPaymentDto.status,
      payment_method: createPaymentDto.payment_method,
      transaction_id: createPaymentDto.transaction_id,
      booking,
    });

    return await this.paymentRepository.save(payment);
  }

  async findAll(userId?: string): Promise<Payment[]> {
    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.booking', 'booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.service', 'service');

    if (userId) {
      queryBuilder.where('user.id = :userId', { userId });
    }

    return await queryBuilder.orderBy('payment.created_at', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['booking', 'booking.user', 'booking.service'],
    });

    if (!payment) {
      throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
    }

    return payment;
  }

  async update(
    id: string,
    updatePaymentDto: UpdatePaymentDto,
  ): Promise<Payment> {
    const payment = await this.findOne(id);
    Object.assign(payment, updatePaymentDto);
    return await this.paymentRepository.save(payment);
  }

  async remove(id: string): Promise<{ message: string }> {
    const payment = await this.findOne(id);
    await this.paymentRepository.remove(payment);
    return { message: 'Payment deleted successfully' };
  }

  // ==================== M-PESA INTEGRATION ====================

  async initializeMpesaPayment(
    initializeDto: InitializeMpesaPaymentDto,
  ): Promise<{
    checkoutRequestId: string;
    payment: Payment;
    message: string;
  }> {
    // Validate phone number
    if (!this.mpesaService.isValidPhoneNumber(initializeDto.phoneNumber)) {
      throw new HttpException(
        'Invalid phone number format. Use format: 254XXXXXXXXX or 07XXXXXXXX',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Find the booking
    const booking = await this.bookingRepository.findOne({
      where: { id: initializeDto.bookingId },
      relations: ['service', 'user'],
    });

    if (!booking) {
      throw new HttpException('Booking not found', HttpStatus.NOT_FOUND);
    }

    // Check if payment already exists
    const existingPayment = await this.paymentRepository.findOne({
      where: {
        booking: { id: initializeDto.bookingId },
        payment_method: PaymentMethod.MPESA,
        status: PaymentStatus.PENDING,
      },
    });

    if (existingPayment) {
      throw new HttpException(
        'Pending M-Pesa payment already exists for this booking',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Initiate M-Pesa STK Push
      const mpesaResponse = await this.mpesaService.initiateStkPush(
        initializeDto.phoneNumber,
        initializeDto.amount || booking.total_amount,
        initializeDto.accountReference || `Booking-${booking.id}`,
        initializeDto.transactionDesc || `Payment for ${booking.service.name}`,
      );

      if (mpesaResponse.ResponseCode !== '0') {
        throw new HttpException(
          mpesaResponse.ResponseDescription ||
            'Failed to initiate M-Pesa payment',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Create payment record
      const payment = await this.create({
        amount: initializeDto.amount || booking.total_amount,
        status: PaymentStatus.PENDING,
        payment_method: PaymentMethod.MPESA,
        transaction_id: mpesaResponse.CheckoutRequestID,
        bookingId: initializeDto.bookingId,
      });

      // Update payment with M-Pesa specific fields
      payment.mpesa_checkout_request_id = mpesaResponse.CheckoutRequestID;
      payment.phone_number = initializeDto.phoneNumber;
      payment.external_reference = mpesaResponse.MerchantRequestID;
      await this.paymentRepository.save(payment);

      return {
        checkoutRequestId: mpesaResponse.CheckoutRequestID,
        payment,
        message: mpesaResponse.CustomerMessage || 'STK Push sent successfully',
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to initialize M-Pesa payment',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async verifyMpesaPayment(verifyDto: VerifyMpesaPaymentDto): Promise<Payment> {
    // Find payment by checkout request ID
    const payment = await this.paymentRepository.findOne({
      where: { mpesa_checkout_request_id: verifyDto.checkoutRequestId },
      relations: ['booking'],
    });

    if (!payment) {
      throw new HttpException(
        'Payment not found for the provided checkout request ID',
        HttpStatus.NOT_FOUND,
      );
    }

    // If payment is already completed, return it without processing
    if (payment.status === PaymentStatus.COMPLETED) {
      return payment;
    }

    try {
      // Query M-Pesa transaction status
      const queryResponse = await this.mpesaService.queryStkStatus(
        verifyDto.checkoutRequestId,
      );

      // Update payment based on M-Pesa response
      if (queryResponse.ResultCode === '0') {
        payment.status = PaymentStatus.COMPLETED;
        payment.paid_at = new Date();

        // Update booking status if not already confirmed
        if (payment.booking && payment.booking.status !== 'confirmed') {
          payment.booking.status = 'confirmed' as any;
          await this.bookingRepository.save(payment.booking);
        }

        // Save payment first
        const updatedPayment = await this.paymentRepository.save(payment);

        // Handle invoice creation/update
        try {
          await this.invoiceService.handlePaymentCompleted(updatedPayment.id);
        } catch (error) {
          console.error(
            'Failed to handle invoice for completed payment:',
            error,
          );
        }

        return updatedPayment;
      } else {
        payment.status = PaymentStatus.FAILED;
        payment.failure_reason = queryResponse.ResultDesc;
        return await this.paymentRepository.save(payment);
      }
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to verify M-Pesa payment',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async processMpesaCallback(
    callbackData: any,
  ): Promise<{ status: string; payment?: Payment }> {
    try {
      const processedCallback =
        await this.mpesaService.processCallback(callbackData);

      // Find payment by checkout request ID
      const payment = await this.paymentRepository.findOne({
        where: {
          mpesa_checkout_request_id: processedCallback.checkoutRequestId,
        },
        relations: ['booking'],
      });

      if (!payment) {
        console.error(
          'Payment not found for callback:',
          processedCallback.checkoutRequestId,
        );
        return { status: 'payment_not_found' };
      }

      // If payment is already completed, return success without processing
      if (payment.status === PaymentStatus.COMPLETED) {
        return { status: 'success', payment };
      }

      // Update payment based on callback
      if (processedCallback.resultCode === '0') {
        payment.status = PaymentStatus.COMPLETED;
        payment.paid_at = new Date();
        payment.mpesa_receipt_number = processedCallback.mpesaReceiptNumber;

        // Update booking status if not already confirmed
        if (payment.booking && payment.booking.status !== 'confirmed') {
          payment.booking.status = 'confirmed' as any;
          await this.bookingRepository.save(payment.booking);
        }

        // Save payment first
        const updatedPayment = await this.paymentRepository.save(payment);

        // Handle invoice creation/update
        try {
          await this.invoiceService.handlePaymentCompleted(updatedPayment.id);
        } catch (error) {
          console.error(
            'Failed to handle invoice for completed payment:',
            error,
          );
        }

        return { status: 'success', payment: updatedPayment };
      } else {
        payment.status = PaymentStatus.FAILED;
        payment.failure_reason = processedCallback.resultDesc;
        const updatedPayment = await this.paymentRepository.save(payment);
        return { status: 'success', payment: updatedPayment };
      }
    } catch (error) {
      console.error('M-Pesa callback processing error:', error);
      return { status: 'error' };
    }
  }

  // ==================== STRIPE INTEGRATION ====================

  async initializeStripePayment(
    initializeDto: InitializeStripePaymentDto,
  ): Promise<{
    clientSecret?: string;
    sessionUrl?: string;
    payment: Payment;
  }> {
    // Find the booking
    const booking = await this.bookingRepository.findOne({
      where: { id: initializeDto.bookingId },
      relations: ['service', 'user'],
    });

    if (!booking) {
      throw new HttpException('Booking not found', HttpStatus.NOT_FOUND);
    }

    // Check if payment already exists
    const existingPayment = await this.paymentRepository.findOne({
      where: {
        booking: { id: initializeDto.bookingId },
        payment_method: PaymentMethod.STRIPE,
        status: PaymentStatus.PENDING,
      },
    });

    if (existingPayment) {
      throw new HttpException(
        'Pending Stripe payment already exists for this booking',
        HttpStatus.BAD_REQUEST,
      );
    }

    const amount = this.stripeService.convertToStripeAmount(
      initializeDto.amount || booking.total_amount,
      initializeDto.currency || 'kes',
    );

    try {
      const metadata = {
        bookingId: initializeDto.bookingId,
        userId: booking.user.id,
        serviceId: booking.service.id,
      };

      let stripeResponse: any;
      let payment: Payment;

      if (initializeDto.successUrl && initializeDto.cancelUrl) {
        // Create checkout session for hosted payment page
        stripeResponse = await this.stripeService.createCheckoutSession(
          amount,
          initializeDto.currency || 'kes',
          initializeDto.successUrl,
          initializeDto.cancelUrl,
          initializeDto.email,
          metadata,
        );
        console.log('stripeResponse:', stripeResponse);

        payment = await this.create({
          amount: initializeDto.amount || booking.total_amount,
          status: PaymentStatus.PENDING,
          payment_method: PaymentMethod.STRIPE,
          transaction_id: stripeResponse.id,
          bookingId: initializeDto.bookingId,
        });

        payment.stripe_session_id = stripeResponse.id;
        payment.stripe_payment_intent_id = stripeResponse.payment_intent;
        await this.paymentRepository.save(payment);
        return {
          sessionUrl: stripeResponse.url,
          payment,
        };
      } else {
        // Create payment intent for custom payment flow
        stripeResponse = await this.stripeService.createPaymentIntent(
          amount,
          initializeDto.currency || 'kes',
          metadata,
        );

        payment = await this.create({
          amount: initializeDto.amount || booking.total_amount,
          status: PaymentStatus.PENDING,
          payment_method: PaymentMethod.STRIPE,
          transaction_id: stripeResponse.id,
          bookingId: initializeDto.bookingId,
        });

        payment.stripe_payment_intent_id = stripeResponse.id;
        await this.paymentRepository.save(payment);

        return {
          clientSecret: stripeResponse.client_secret,
          payment,
        };
      }
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to initialize Stripe payment',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async verifyStripePayment(
    verifyDto: VerifyStripePaymentDto,
  ): Promise<Payment> {
    // Find payment by session ID or payment intent ID
    const payment = await this.paymentRepository.findOne({
      where: [
        { stripe_session_id: verifyDto.sessionId },
        { stripe_payment_intent_id: verifyDto.sessionId },
      ],
      relations: ['booking'],
    });

    if (!payment) {
      throw new HttpException(
        'Payment not found for the provided session ID',
        HttpStatus.NOT_FOUND,
      );
    }

    // If payment is already completed, return it without processing
    if (payment.status === PaymentStatus.COMPLETED) {
      return payment;
    }

    try {
      let stripeData: any;

      if (payment.stripe_session_id) {
        // Retrieve checkout session
        stripeData = await this.stripeService.retrieveCheckoutSession(
          payment.stripe_session_id,
        );

        if (stripeData.payment_status === 'paid') {
          payment.status = PaymentStatus.COMPLETED;
          payment.paid_at = new Date();
        }
      } else if (payment.stripe_payment_intent_id) {
        // Retrieve payment intent
        stripeData = await this.stripeService.retrievePaymentIntent(
          payment.stripe_payment_intent_id,
        );

        if (stripeData.status === 'succeeded') {
          payment.status = PaymentStatus.COMPLETED;
          payment.paid_at = new Date();
        } else if (
          stripeData.status === 'canceled' ||
          stripeData.status === 'payment_failed'
        ) {
          payment.status = PaymentStatus.FAILED;
        }
      }

      // Update booking status if payment successful
      if (
        payment.status === PaymentStatus.COMPLETED &&
        payment.booking &&
        payment.booking.status !== 'confirmed'
      ) {
        payment.booking.status = 'confirmed' as any;
        await this.bookingRepository.save(payment.booking);
      }

      // Save payment first
      const updatedPayment = await this.paymentRepository.save(payment);

      // Handle invoice creation/update for completed payments
      if (payment.status === PaymentStatus.COMPLETED) {
        try {
          await this.invoiceService.handlePaymentCompleted(updatedPayment.id);
        } catch (error) {
          console.error(
            'Failed to handle invoice for completed payment:',
            error,
          );
        }
      }

      return updatedPayment;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to verify Stripe payment',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async processStripeWebhook(
    payload: string,
    signature: string,
  ): Promise<{ status: string; payment?: Payment }> {
    try {
      const event = await this.stripeService.constructWebhookEvent(
        payload,
        signature,
      );
      const processedEvent =
        await this.stripeService.processWebhookEvent(event);

      if (
        processedEvent.type === 'payment_success' ||
        processedEvent.type === 'checkout_completed'
      ) {
        // Find payment by payment intent ID
        const payment = await this.paymentRepository.findOne({
          where: { stripe_payment_intent_id: processedEvent.paymentIntentId },
          relations: ['booking'],
        });

        if (payment) {
          // If payment is already completed, return success without processing
          if (payment.status === PaymentStatus.COMPLETED) {
            return { status: 'success', payment };
          }

          payment.status = PaymentStatus.COMPLETED;
          payment.paid_at = new Date();

          // Update booking status
          if (payment.booking && payment.booking.status !== 'confirmed') {
            payment.booking.status = 'confirmed' as any;
            await this.bookingRepository.save(payment.booking);
          }

          // Save payment first
          const updatedPayment = await this.paymentRepository.save(payment);

          // Handle invoice creation/update
          try {
            await this.invoiceService.handlePaymentCompleted(updatedPayment.id);
          } catch (error) {
            console.error(
              'Failed to handle invoice for completed payment:',
              error,
            );
          }

          return { status: 'success', payment: updatedPayment };
        }
      } else if (processedEvent.type === 'payment_failed') {
        // Find and update failed payment
        const payment = await this.paymentRepository.findOne({
          where: { stripe_payment_intent_id: processedEvent.paymentIntentId },
        });

        if (payment) {
          payment.status = PaymentStatus.FAILED;
          payment.failure_reason = processedEvent.failureReason;
          await this.paymentRepository.save(payment);
        }
      }

      return { status: 'success' };
    } catch (error) {
      console.error('Stripe webhook processing error:', error);
      return { status: 'error' };
    }
  }

  // ==================== COMMON PAYMENT METHODS ====================

  async getPaymentsByBooking(bookingId: string): Promise<Payment[]> {
    return await this.paymentRepository.find({
      where: { booking: { id: bookingId } },
      relations: ['booking'],
      order: { created_at: 'DESC' },
    });
  }

  async refundPayment(paymentId: string, reason?: string): Promise<Payment> {
    const payment = await this.findOne(paymentId);

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new HttpException(
        'Only completed payments can be refunded',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      if (
        payment.payment_method === PaymentMethod.STRIPE &&
        payment.stripe_payment_intent_id
      ) {
        // Process Stripe refund
        await this.stripeService.refundPayment(
          payment.stripe_payment_intent_id,
          undefined,
          reason,
        );
      }
      // Note: M-Pesa refunds need to be handled through Safaricom's reversal APIs
      // which require additional setup and approval

      payment.status = PaymentStatus.REFUNDED;
      payment.failure_reason = reason || 'Refund processed';
      return await this.paymentRepository.save(payment);
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to process refund',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async cancelPendingPayment(paymentId: string): Promise<Payment> {
    const payment = await this.findOne(paymentId);

    if (payment.status !== PaymentStatus.PENDING) {
      throw new HttpException(
        'Only pending payments can be cancelled',
        HttpStatus.BAD_REQUEST,
      );
    }

    payment.status = PaymentStatus.CANCELLED;
    return await this.paymentRepository.save(payment);
  }

  async getPaymentStatistics(): Promise<{
    total_payments: number;
    total_amount: number;
    completed_payments: number;
    pending_payments: number;
    failed_payments: number;
    mpesa_payments: number;
    stripe_payments: number;
    refunded_payments: number;
  }> {
    const [
      totalPayments,
      totalAmount,
      completedPayments,
      pendingPayments,
      failedPayments,
      mpesaPayments,
      stripePayments,
      refundedPayments,
    ] = await Promise.all([
      this.paymentRepository.count(),
      this.paymentRepository
        .createQueryBuilder('payment')
        .select('SUM(payment.amount)', 'sum')
        .where('payment.status = :status', { status: PaymentStatus.COMPLETED })
        .getRawOne(),
      this.paymentRepository.count({
        where: { status: PaymentStatus.COMPLETED },
      }),
      this.paymentRepository.count({
        where: { status: PaymentStatus.PENDING },
      }),
      this.paymentRepository.count({ where: { status: PaymentStatus.FAILED } }),
      this.paymentRepository.count({
        where: { payment_method: PaymentMethod.MPESA },
      }),
      this.paymentRepository.count({
        where: { payment_method: PaymentMethod.STRIPE },
      }),
      this.paymentRepository.count({
        where: { status: PaymentStatus.REFUNDED },
      }),
    ]);

    return {
      total_payments: totalPayments,
      total_amount: parseFloat(totalAmount?.sum || '0'),
      completed_payments: completedPayments,
      pending_payments: pendingPayments,
      failed_payments: failedPayments,
      mpesa_payments: mpesaPayments,
      stripe_payments: stripePayments,
      refunded_payments: refundedPayments,
    };
  }

  async getPaymentByTransactionId(transactionId: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { transaction_id: transactionId },
      relations: ['booking'],
    });

    if (!payment) {
      throw new HttpException('Payment not found', HttpStatus.NOT_FOUND);
    }

    return payment;
  }
}
