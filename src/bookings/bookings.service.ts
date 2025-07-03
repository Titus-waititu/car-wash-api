import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { Repository, Between } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Service } from 'src/services/entities/service.entity';
import { Payment } from 'src/payments/entities/payment.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(Payment)
    private paymentRepository: Repository<Payment>,
  ) {}

  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    // Validate user exists
    const user = await this.userRepository.findOne({
      where: { id: createBookingDto.userId },
    });
    if (!user) {
      throw new NotFoundException(
        `User with ID ${createBookingDto.userId} not found`,
      );
    }

    // Validate service exists
    const service = await this.serviceRepository.findOne({
      where: { id: createBookingDto.serviceId },
    });
    if (!service) {
      throw new NotFoundException(
        `Service with ID ${createBookingDto.serviceId} not found`,
      );
    }

    // Validate payment exists
    // const payment = await this.paymentRepository.findOne({
    //   where: { id: createBookingDto.paymentId },
    // });
    // if (!payment) {
    //   throw new NotFoundException(
    //     `Payment with ID ${createBookingDto.paymentId} not found`,
    //   );
    // }

    // Check if booking time is in the future
    const bookingTime = new Date(createBookingDto.booking_time);
    if (bookingTime <= new Date()) {
      throw new BadRequestException('Booking time must be in the future');
    }

    const newBooking = this.bookingRepository.create({
      booking_time: bookingTime,
      status: createBookingDto.status || BookingStatus.PENDING,
      address: createBookingDto.address,
      user,
      service,
      // payment,
    });

    return await this.bookingRepository.save(newBooking);
  }

  async findAll(status?: BookingStatus): Promise<Booking[]> {
    const queryBuilder = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('booking.payment', 'payment')
      .orderBy('booking.booking_time', 'DESC');

    if (status) {
      queryBuilder.where('booking.status = :status', { status });
    }

    return await queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: id },
      relations: ['user', 'service', 'payment'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    return booking;
  }

  async update(
    id: string,
    updateBookingDto: UpdateBookingDto,
  ): Promise<Booking> {
    const booking = await this.findOne(id);

    // Validate status transition
    if (updateBookingDto.status) {
      this.validateStatusTransition(booking.status, updateBookingDto.status);
    }

    // Validate booking time if being updated
    if (updateBookingDto.booking_time) {
      const newBookingTime = new Date(updateBookingDto.booking_time);
      if (
        newBookingTime <= new Date() &&
        booking.status === BookingStatus.PENDING
      ) {
        throw new BadRequestException(
          'Cannot update booking time to past date for pending bookings',
        );
      }
    }

    Object.assign(booking, updateBookingDto);
    return await this.bookingRepository.save(booking);
  }

  async remove(id: string): Promise<{ message: string }> {
    const booking = await this.findOne(id);

    // Only allow deletion of pending or cancelled bookings
    if (
      booking.status === BookingStatus.COMPLETED ||
      booking.status === BookingStatus.CONFIRMED
    ) {
      throw new BadRequestException(
        'Cannot delete completed or confirmed bookings',
      );
    }

    await this.bookingRepository.remove(booking);
    return { message: `Booking with ID ${id} successfully deleted` };
  }

  async findByUser(userId: string): Promise<Booking[]> {
    return await this.bookingRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'service', 'payment'],
      order: { booking_time: 'DESC' },
    });
  }

  async findByService(serviceId: string): Promise<Booking[]> {
    return await this.bookingRepository.find({
      where: { service: { id: serviceId } },
      relations: ['user', 'service', 'payment'],
      order: { booking_time: 'DESC' },
    });
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Booking[]> {
    return await this.bookingRepository.find({
      where: {
        booking_time: Between(startDate, endDate),
      },
      relations: ['user', 'service', 'payment'],
      order: { booking_time: 'ASC' },
    });
  }

  async updateBookingStatus(
    id: string,
    status: BookingStatus,
  ): Promise<Booking> {
    const booking = await this.findOne(id);
    this.validateStatusTransition(booking.status, status);

    booking.status = status;
    return await this.bookingRepository.save(booking);
  }

  private validateStatusTransition(
    currentStatus: string,
    newStatus: BookingStatus,
  ): void {
    const validTransitions = {
      [BookingStatus.PENDING]: [
        BookingStatus.CONFIRMED,
        BookingStatus.CANCELLED,
      ],
      [BookingStatus.CONFIRMED]: [
        BookingStatus.COMPLETED,
        BookingStatus.CANCELLED,
      ],
      [BookingStatus.COMPLETED]: [], // No transitions from completed
      [BookingStatus.CANCELLED]: [], // No transitions from cancelled
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from ${currentStatus} to ${newStatus}`,
      );
    }
  }

  async getBookingStats(): Promise<any> {
    const [total, pending, confirmed, completed, cancelled] = await Promise.all(
      [
        this.bookingRepository.count(),
        this.bookingRepository.count({
          where: { status: BookingStatus.PENDING },
        }),
        this.bookingRepository.count({
          where: { status: BookingStatus.CONFIRMED },
        }),
        this.bookingRepository.count({
          where: { status: BookingStatus.COMPLETED },
        }),
        this.bookingRepository.count({
          where: { status: BookingStatus.CANCELLED },
        }),
      ],
    );

    const revenueStats = await this.bookingRepository
      .createQueryBuilder('booking')
      .select('SUM(booking.total_amount)', 'total_revenue')
      .addSelect('AVG(booking.total_amount)', 'avg_booking_value')
      .where('booking.status = :status', { status: BookingStatus.COMPLETED })
      .getRawOne();

    return {
      total,
      statusBreakdown: {
        pending,
        confirmed,
        completed,
        cancelled,
      },
      revenue: {
        total: parseFloat(revenueStats.total_revenue) || 0,
        averageBookingValue: parseFloat(revenueStats.avg_booking_value) || 0,
      },
    };
  }

  // Bulk booking functionality
  async createBulkBooking(
    bookings: any[],
    bulkBookingId: string,
  ): Promise<Booking[]> {
    const createdBookings: Booking[] = [];

    for (const bookingData of bookings) {
      const booking = await this.create({
        ...bookingData,
        is_bulk_booking: true,
        bulk_booking_id: bulkBookingId,
      });
      createdBookings.push(booking);
    }

    return createdBookings;
  }

  async findBulkBookings(bulkBookingId: string): Promise<Booking[]> {
    return await this.bookingRepository.find({
      where: { bulk_booking_id: bulkBookingId },
      relations: ['user', 'service', 'payment'],
      order: { booking_time: 'ASC' },
    });
  }

  async getBulkBookingStats(): Promise<any> {
    const bulkBookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .select('booking.bulk_booking_id')
      .addSelect('COUNT(*) as vehicle_count')
      .addSelect('SUM(booking.total_amount) as total_amount')
      .where('booking.is_bulk_booking = :isBulk', { isBulk: true })
      .groupBy('booking.bulk_booking_id')
      .getRawMany();

    return {
      totalBulkBookings: bulkBookings.length,
      totalVehiclesInBulk: bulkBookings.reduce(
        (sum, booking) => sum + parseInt(booking.vehicle_count),
        0,
      ),
      totalBulkRevenue: bulkBookings.reduce(
        (sum, booking) => sum + parseFloat(booking.total_amount),
        0,
      ),
      averageVehiclesPerBulk:
        bulkBookings.length > 0
          ? bulkBookings.reduce(
              (sum, booking) => sum + parseInt(booking.vehicle_count),
              0,
            ) / bulkBookings.length
          : 0,
    };
  }

  // Real-time tracking
  async updateBookingLocation(
    id: string,
    latitude: number,
    longitude: number,
  ): Promise<Booking> {
    const booking = await this.findOne(id);

    booking.service_latitude = latitude;
    booking.service_longitude = longitude;

    return await this.bookingRepository.save(booking);
  }

  async startService(id: string): Promise<Booking> {
    const booking = await this.findOne(id);

    booking.actual_start_time = new Date();
    booking.status = BookingStatus.CONFIRMED;

    return await this.bookingRepository.save(booking);
  }

  async completeService(id: string, serviceNotes?: string): Promise<Booking> {
    const booking = await this.findOne(id);

    booking.completion_time = new Date();
    booking.status = BookingStatus.COMPLETED;
    if (serviceNotes) {
      booking.service_notes = serviceNotes;
    }

    return await this.bookingRepository.save(booking);
  }
}
