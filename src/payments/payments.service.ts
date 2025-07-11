import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { Payment } from './entities/payment.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';
import { Booking } from '../bookings/entities/booking.entity';
import { PaymentStatus, PaymentMethod } from '../types';

@Injectable()
export class PaymentsService {
  private readonly paystackSecret: string;
  private readonly baseUrl: string;

  constructor(
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    private configService: ConfigService,
  ) {
    this.paystackSecret = this.configService.getOrThrow<string>(
      'PAYSTACK_SECRET_KEY',
    );
    this.baseUrl = this.configService.getOrThrow<string>('PAYSTACK_BASE_URL');
  }

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

  async findAll(): Promise<Payment[]> {
    return await this.paymentRepository.find({
      relations: ['booking'],
    });
  }

  async findOne(id: string): Promise<Payment> {
    const payment = await this.paymentRepository.findOne({
      where: { id },
      relations: ['booking'],
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

  async initializeTransaction(email: string, amount: number) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/transaction/initialize`,
        { email, amount: amount * 100 }, // Paystack expects amount in kobo
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecret}`,
            'Content-Type': 'application/json',
          },
        },
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'Paystack Error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async verifyTransaction(reference: string) {
    try {
      const response = await axios.get(
        `${this.baseUrl}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${this.paystackSecret}`,
          },
        },
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        error.response?.data || 'Verification Error',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async initializePayment(
    bookingId: string,
    email: string,
  ): Promise<{
    authorization_url: string;
    reference: string;
    payment: Payment;
  }> {
    // Find the booking
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['service'],
    });

    if (!booking) {
      throw new HttpException('Booking not found', HttpStatus.NOT_FOUND);
    }

    if (!booking.total_amount) {
      throw new HttpException(
        'Booking total amount not set',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Check if payment already exists for this booking
    const existingPayment = await this.paymentRepository.findOne({
      where: { booking: { id: bookingId } },
    });

    if (existingPayment && existingPayment.status === PaymentStatus.COMPLETED) {
      throw new HttpException(
        'Payment already completed for this booking',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      // Initialize Paystack transaction
      const paystackResponse = await this.initializeTransaction(
        email,
        booking.total_amount,
      );

      if (!paystackResponse.status) {
        throw new HttpException(
          'Failed to initialize payment',
          HttpStatus.BAD_REQUEST,
        );
      }

      // Create or update payment record
      let payment: Payment;
      if (existingPayment) {
        existingPayment.transaction_id = paystackResponse.data.reference;
        existingPayment.status = PaymentStatus.PENDING;
        existingPayment.amount = booking.total_amount;
        payment = await this.paymentRepository.save(existingPayment);
      } else {
        payment = await this.create({
          amount: booking.total_amount,
          status: PaymentStatus.PENDING,
          payment_method: PaymentMethod.CREDIT_CARD,
          transaction_id: paystackResponse.data.reference,
          bookingId: bookingId,
        });
      }

      return {
        authorization_url: paystackResponse.data.authorization_url,
        reference: paystackResponse.data.reference,
        payment,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to initialize payment',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async processPaymentVerification(reference: string): Promise<Payment> {
    try {
      // Verify transaction with Paystack
      const verificationResponse = await this.verifyTransaction(reference);

      if (!verificationResponse.status || !verificationResponse.data) {
        throw new HttpException(
          'Invalid transaction reference',
          HttpStatus.BAD_REQUEST,
        );
      }

      const transactionData = verificationResponse.data;

      // Find payment by transaction reference
      const payment = await this.paymentRepository.findOne({
        where: { transaction_id: reference },
        relations: ['booking'],
      });

      if (!payment) {
        throw new HttpException(
          'Payment record not found',
          HttpStatus.NOT_FOUND,
        );
      }

      // Update payment status based on Paystack response
      if (transactionData.status === 'success') {
        payment.status = PaymentStatus.COMPLETED;
        payment.paid_at = new Date();

        // Update booking status if payment is successful
        if (payment.booking) {
          payment.booking.status = 'confirmed' as any; // Assuming BookingStatus enum
          await this.bookingRepository.save(payment.booking);
        }
      } else {
        payment.status = PaymentStatus.FAILED;
      }

      return await this.paymentRepository.save(payment);
    } catch (error) {
      throw new HttpException(
        error.message || 'Payment verification failed',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getPaymentsByBooking(bookingId: string): Promise<Payment[]> {
    return await this.paymentRepository.find({
      where: { booking: { id: bookingId } },
      relations: ['booking'],
    });
  }

  async getPaymentHistory(userId?: string): Promise<Payment[]> {
    const queryBuilder = this.paymentRepository
      .createQueryBuilder('payment')
      .leftJoinAndSelect('payment.booking', 'booking')
      .leftJoinAndSelect('booking.customer', 'customer');

    if (userId) {
      queryBuilder.where('customer.id = :userId', { userId });
    }

    return await queryBuilder.orderBy('payment.paid_at', 'DESC').getMany();
  }

  async refundPayment(paymentId: string, reason?: string): Promise<Payment> {
    const payment = await this.findOne(paymentId);

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new HttpException(
        'Only completed payments can be refunded',
        HttpStatus.BAD_REQUEST,
      );
    }

    // Here you would implement Paystack refund API call
    // For now, we'll just update the status
    payment.status = PaymentStatus.FAILED; // or create a REFUNDED status

    return await this.paymentRepository.save(payment);
  }

  async getPaymentStatistics(): Promise<{
    total_payments: number;
    total_amount: number;
    completed_payments: number;
    pending_payments: number;
    failed_payments: number;
  }> {
    const [
      totalPayments,
      totalAmount,
      completedPayments,
      pendingPayments,
      failedPayments,
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
    ]);

    return {
      total_payments: totalPayments,
      total_amount: parseFloat(totalAmount?.sum || '0'),
      completed_payments: completedPayments,
      pending_payments: pendingPayments,
      failed_payments: failedPayments,
    };
  }

  async handlePaymentWebhook(
    payload: any,
  ): Promise<{ status: string; payment?: Payment }> {
    try {
      if (payload.event === 'charge.success') {
        const reference = payload.data.reference;
        const payment = await this.processPaymentVerification(reference);
        return { status: 'success', payment };
      }

      if (payload.event === 'charge.failed') {
        const reference = payload.data.reference;
        const payment = await this.paymentRepository.findOne({
          where: { transaction_id: reference },
          relations: ['booking'],
        });

        if (payment) {
          payment.status = PaymentStatus.FAILED;
          await this.paymentRepository.save(payment);
          return { status: 'failed', payment };
        }
      }

      return { status: 'ignored' };
    } catch (error) {
      console.error('Webhook processing error:', error);
      return { status: 'error' };
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

    payment.status = PaymentStatus.FAILED;
    return await this.paymentRepository.save(payment);
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
