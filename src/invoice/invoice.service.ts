import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { Invoice, InvoiceStatus } from './entities/invoice.entity';
import { Booking } from '../bookings/entities/booking.entity';
import { User } from '../users/entities/user.entity';
import { Payment } from '../payments/entities/payment.entity';
import { MailService } from '../mail/mail.service';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    private invoiceRepository: Repository<Invoice>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
    private mailService: MailService,
  ) {}

  async create(createInvoiceDto: CreateInvoiceDto): Promise<Invoice> {
    // Validate booking exists
    const booking = await this.bookingRepository.findOne({
      where: { id: createInvoiceDto.bookingId },
      relations: ['service', 'user'],
    });

    if (!booking) {
      throw new HttpException('Booking not found', HttpStatus.NOT_FOUND);
    }

    // Validate user exists
    const user = await this.userRepository.findOne({
      where: { id: createInvoiceDto.userId },
    });

    if (!user) {
      throw new HttpException('user not found', HttpStatus.NOT_FOUND);
    }

    // Check if invoice already exists for this booking
    const existingInvoice = await this.invoiceRepository.findOne({
      where: { booking: { id: booking.id } },
    });

    if (existingInvoice) {
      throw new HttpException(
        'Invoice already exists for this booking',
        HttpStatus.CONFLICT,
      );
    }

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber();

    // Calculate amounts
    const amount = booking.total_amount || 0;
    const taxAmount = createInvoiceDto.tax_amount || 0;
    const totalAmount = amount + taxAmount;

    // Set due date (default 30 days from now)
    const dueDate = createInvoiceDto.due_date
      ? new Date(createInvoiceDto.due_date)
      : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Create invoice
    const invoice = this.invoiceRepository.create({
      invoice_number: invoiceNumber,
      amount,
      tax_amount: taxAmount,
      total_amount: Number(totalAmount),
      due_date: dueDate,
      notes: createInvoiceDto.notes,
      booking,
      user,
    });

    return await this.invoiceRepository.save(invoice);
  }

  async findAll(userId?: string): Promise<Invoice[]> {
    const queryBuilder = this.invoiceRepository
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.booking', 'booking')
      .leftJoinAndSelect('invoice.user', 'user')
      .leftJoinAndSelect('invoice.payment', 'payment')
      .leftJoinAndSelect('booking.service', 'service');

    if (userId) {
      queryBuilder.where('user.id = :userId', { userId });
    }

    return await queryBuilder.orderBy('invoice.created_at', 'DESC').getMany();
  }

  async findOne(id: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { id },
      relations: ['booking', 'booking.service', 'user', 'payment'],
    });

    if (!invoice) {
      throw new HttpException('Invoice not found', HttpStatus.NOT_FOUND);
    }

    return invoice;
  }

  async findByInvoiceNumber(invoiceNumber: string): Promise<Invoice> {
    const invoice = await this.invoiceRepository.findOne({
      where: { invoice_number: invoiceNumber },
      relations: ['booking', 'booking.service', 'user', 'payment'],
    });

    if (!invoice) {
      throw new HttpException('Invoice not found', HttpStatus.NOT_FOUND);
    }

    return invoice;
  }

  async findByBookingId(bookingId: string): Promise<Invoice | null> {
    const invoice = await this.invoiceRepository.findOne({
      where: { booking: { id: bookingId } },
      relations: ['booking', 'booking.service', 'user', 'payment'],
    });

    return invoice;
  }

  async update(
    id: string,
    updateInvoiceDto: UpdateInvoiceDto,
  ): Promise<Invoice> {
    const invoice = await this.findOne(id);

    // Update fields
    Object.assign(invoice, updateInvoiceDto);

    // Recalculate total if tax amount is updated
    if (updateInvoiceDto.tax_amount !== undefined) {
      invoice.total_amount =
        invoice.amount + (updateInvoiceDto.tax_amount || 0);
    }

    return await this.invoiceRepository.save(invoice);
  }

  async remove(id: string): Promise<{ message: string }> {
    const invoice = await this.findOne(id);
    await this.invoiceRepository.remove(invoice);
    return { message: 'Invoice deleted successfully' };
  }

  async markAsSent(id: string): Promise<Invoice> {
    const invoice = await this.findOne(id);

    invoice.status = InvoiceStatus.SENT;
    invoice.sent_at = new Date();

    const updatedInvoice = await this.invoiceRepository.save(invoice);

    // Send invoice email to user
    await this.sendInvoiceEmail(updatedInvoice);

    return updatedInvoice;
  }

  async markAsPaid(id: string, paymentId?: string): Promise<Invoice> {
    const invoice = await this.findOne(id);

    // If payment ID is provided, link the payment
    if (paymentId) {
      const payment = await this.paymentRepository.findOne({
        where: { id: paymentId },
      });

      if (payment) {
        invoice.payment = payment;
      }
    }

    invoice.status = InvoiceStatus.PAID;
    invoice.paid_at = new Date();

    const updatedInvoice = await this.invoiceRepository.save(invoice);

    // Send payment confirmation email
    await this.sendPaymentConfirmationEmail(updatedInvoice);

    return updatedInvoice;
  }

  async handlePaymentCompleted(paymentId: string): Promise<void> {
    // Find invoice by payment
    const payment = await this.paymentRepository.findOne({
      where: { id: paymentId },
      relations: ['booking'],
    });

    if (!payment || !payment.booking) {
      return;
    }

    // Find or create invoice for this booking
    let invoice = await this.invoiceRepository.findOne({
      where: { booking: { id: payment.booking.id } },
      relations: ['user', 'booking', 'booking.service'],
    });

    if (!invoice) {
      // Create invoice automatically if it doesn't exist
      const booking = await this.bookingRepository.findOne({
        where: { id: payment.booking.id },
        relations: ['user', 'service'],
      });

      if (booking) {
        invoice = await this.createInvoiceFromBooking(booking, payment);
      }
    }

    if (invoice) {
      // Mark invoice as paid and link payment
      await this.markAsPaid(invoice.id, paymentId);
    }
  }

  private async createInvoiceFromBooking(
    booking: Booking,
    payment: Payment,
  ): Promise<Invoice> {
    const invoiceNumber = await this.generateInvoiceNumber();
    const amount = booking.total_amount || 0;
    const totalAmount = amount;

    const invoice = this.invoiceRepository.create({
      invoice_number: invoiceNumber,
      amount,
      tax_amount: 0,
      total_amount: totalAmount,
      status: InvoiceStatus.PAID,
      paid_at: new Date(),
      booking,
      user: booking.user,
      payment,
    });

    return await this.invoiceRepository.save(invoice);
  }

  private async generateInvoiceNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const month = String(new Date().getMonth() + 1).padStart(2, '0');

    // Get the count of invoices for this month
    const count = await this.invoiceRepository
      .createQueryBuilder('invoice')
      .where('EXTRACT(YEAR FROM invoice.created_at) = :year', { year })
      .andWhere('EXTRACT(MONTH FROM invoice.created_at) = :month', {
        month: new Date().getMonth() + 1,
      })
      .getCount();

    const sequenceNumber = String(count + 1).padStart(4, '0');
    return `INV-${year}${month}-${sequenceNumber}`;
  }

  private async sendInvoiceEmail(invoice: Invoice): Promise<void> {
    if (!invoice.user?.email) {
      return;
    }

    const subject = `Invoice ${invoice.invoice_number} - CarWash Service`;
    const html = this.generateInvoiceEmailTemplate(invoice);

    try {
      await this.mailService.sendMail({
        to: invoice.user.email,
        subject,
        html,
      });
    } catch (error) {
      console.error('Failed to send invoice email:', error);
    }
  }

  private async sendPaymentConfirmationEmail(invoice: Invoice): Promise<void> {
    if (!invoice.user?.email) {
      return;
    }

    const subject = `Payment Confirmation - Invoice ${invoice.invoice_number}`;
    const html = this.generatePaymentConfirmationEmailTemplate(invoice);

    try {
      await this.mailService.sendMail({
        to: invoice.user.email,
        subject,
        html,
      });
    } catch (error) {
      console.error('Failed to send payment confirmation email:', error);
    }
  }

  private generateInvoiceEmailTemplate(invoice: Invoice): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Invoice ${invoice.invoice_number}</h2>
        
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Service Details</h3>
          <p><strong>Service:</strong> ${invoice.booking?.service?.name || 'Car Wash Service'}</p>
          <p><strong>Date:</strong> ${new Date(invoice.booking?.booking_time || '').toLocaleDateString()}</p>
          <p><strong>user:</strong> ${invoice.user?.username || ''}</p>
        </div>

        <div style="background-color: #f0f8ff; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Amount Details</h3>
          <p><strong>Service Amount:</strong> $${Number(invoice.amount).toFixed(2)}</p>
          <p><strong>Tax:</strong> $${Number(invoice.tax_amount).toFixed(2)}</p>
          <hr style="margin: 10px 0;">
          <p><strong>Total Amount:</strong> $${Number(invoice.total_amount).toFixed(2)}</p>
        </div>

        <div style="margin: 20px 0;">
          <p><strong>Due Date:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
          ${invoice.notes ? `<p><strong>Notes:</strong> ${invoice.notes}</p>` : ''}
        </div>

        <div style="margin: 30px 0; text-align: center;">
          <p>Thank you for choosing our CarWash service!</p>
          <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
        </div>
      </div>
    `;
  }

  private generatePaymentConfirmationEmailTemplate(invoice: Invoice): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #28a745;">Payment Confirmed!</h2>
        
        <div style="background-color: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
          <h3>Payment Successfully Processed</h3>
          <p>Your payment for Invoice ${invoice.invoice_number} has been successfully processed.</p>
        </div>

        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 5px; margin: 20px 0;">
          <h3>Payment Details</h3>
          <p><strong>Invoice Number:</strong> ${invoice.invoice_number}</p>
          <p><strong>Amount Paid:</strong> $${invoice.total_amount.toFixed(2)}</p>
          <p><strong>Payment Date:</strong> ${new Date(invoice.paid_at || '').toLocaleDateString()}</p>
          <p><strong>Service:</strong> ${invoice.booking?.service?.name || 'Car Wash Service'}</p>
        </div>

        <div style="margin: 30px 0; text-align: center;">
          <p>Thank you for your payment and for choosing our CarWash service!</p>
          <p>We look forward to serving you again.</p>
          <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
        </div>
      </div>
    `;
  }

  async getInvoiceStats(): Promise<{
    total_invoices: number;
    paid_invoices: number;
    pending_invoices: number;
    overdue_invoices: number;
    total_revenue: number;
  }> {
    const [
      totalInvoices,
      paidInvoices,
      pendingInvoices,
      overdueInvoices,
      revenueResult,
    ] = await Promise.all([
      this.invoiceRepository.count(),
      this.invoiceRepository.count({ where: { status: InvoiceStatus.PAID } }),
      this.invoiceRepository.count({
        where: { status: InvoiceStatus.PENDING },
      }),
      this.invoiceRepository.count({
        where: { status: InvoiceStatus.OVERDUE },
      }),
      this.invoiceRepository
        .createQueryBuilder('invoice')
        .select('SUM(invoice.total_amount)', 'total')
        .where('invoice.status = :status', { status: InvoiceStatus.PAID })
        .getRawOne(),
    ]);

    return {
      total_invoices: totalInvoices,
      paid_invoices: paidInvoices,
      pending_invoices: pendingInvoices,
      overdue_invoices: overdueInvoices,
      total_revenue: parseFloat(revenueResult?.total || '0'),
    };
  }

  async updateOverdueInvoices(): Promise<{ updated: number }> {
    const result = await this.invoiceRepository
      .createQueryBuilder()
      .update(Invoice)
      .set({ status: InvoiceStatus.OVERDUE })
      .where('status = :status', { status: InvoiceStatus.PENDING })
      .andWhere('due_date < :currentDate', { currentDate: new Date() })
      .execute();

    return { updated: result.affected || 0 };
  }

  async getOverdueInvoices(): Promise<Invoice[]> {
    return await this.invoiceRepository.find({
      where: { status: InvoiceStatus.OVERDUE },
      relations: ['booking', 'booking.service', 'user'],
      order: { due_date: 'ASC' },
    });
  }
}
