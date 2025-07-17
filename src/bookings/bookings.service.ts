import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Booking, BookingStatus } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { User } from 'src/users/entities/user.entity';
import { Service } from 'src/services/entities/service.entity';
import { Payment } from 'src/payments/entities/payment.entity';
import { Fleet } from 'src/fleet/entities/fleet.entity';

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
    @InjectRepository(Fleet)
    private fleetRepository: Repository<Fleet>,
  ) {}

  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    const { userId, serviceId, vehicleId } = createBookingDto;

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException(`User with ID ${userId} not found`);

    const service = await this.serviceRepository.findOne({
      where: { id: serviceId },
    });
    if (!service)
      throw new NotFoundException(`Service with ID ${serviceId} not found`);

    let vehicle: Fleet | null = null;
    if (vehicleId) {
      vehicle = await this.fleetRepository.findOne({
        where: { id: vehicleId },
      });
      if (!vehicle) {
        throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
      }
    }

    const bookingTime = new Date(createBookingDto.booking_time);
    if (bookingTime <= new Date()) {
      throw new BadRequestException('Booking time must be in the future');
    }

    const booking = this.bookingRepository.create({
      booking_time: bookingTime,
      status: createBookingDto.status || BookingStatus.PENDING,
      address: createBookingDto.address,
      special_instructions: createBookingDto.special_instructions,
      total_amount: createBookingDto.total_amount,
      user,
      service,
      vehicle: vehicle ?? undefined,
    });

    return await this.bookingRepository.save(booking);
  }

  async findAll(status?: BookingStatus): Promise<Booking[]> {
    const queryBuilder = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.user', 'user')
      .leftJoinAndSelect('booking.service', 'service')
      .leftJoinAndSelect('service.user', 'serviceProvider')
      .leftJoinAndSelect('service.reviews', 'serviceReviews')
      .leftJoinAndSelect('service.locations', 'location')
      .leftJoinAndSelect('serviceReviews.user', 'reviewUser')
      .leftJoinAndSelect('booking.payment', 'payment')
      .leftJoinAndSelect('booking.vehicle', 'vehicle')
      .orderBy('booking.booking_time', 'DESC');

    if (status) {
      queryBuilder.where('booking.status = :status', { status });
    }

    return await queryBuilder.getMany();
  }

  async findOne(id: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: [
        'user',
        'service',
        'service.user',
        'service.reviews',
        'service.locations',
        'service.reviews.user',
        'payment',
        'vehicle',
      ],
    });

    if (!booking)
      throw new NotFoundException(`Booking with ID ${id} not found`);

    return booking;
  }

  async update(
    id: string,
    updateBookingDto: UpdateBookingDto,
  ): Promise<Booking> {
    const booking = await this.findOne(id);

    if (updateBookingDto.status) {
      this.validateStatusTransition(booking.status, updateBookingDto.status);
    }

    if (updateBookingDto.booking_time) {
      const newTime = new Date(updateBookingDto.booking_time);
      if (newTime <= new Date() && booking.status === BookingStatus.PENDING) {
        throw new BadRequestException(
          'Cannot update booking time to past for pending bookings',
        );
      }
    }

    if (updateBookingDto.vehicleId) {
      const fleet = await this.fleetRepository.findOne({
        where: { id: updateBookingDto.vehicleId },
      });
      if (!fleet) {
        throw new NotFoundException(
          `Vehicle with ID ${updateBookingDto.vehicleId} not found`,
        );
      }
      booking.vehicle = fleet;
    }

    Object.assign(booking, updateBookingDto);
    return await this.bookingRepository.save(booking);
  }

  async remove(id: string): Promise<{ message: string }> {
    const booking = await this.findOne(id);

    if (
      [BookingStatus.CONFIRMED, BookingStatus.COMPLETED].includes(
        booking.status,
      )
    ) {
      throw new BadRequestException(
        'Cannot delete confirmed or completed bookings',
      );
    }

    await this.bookingRepository.remove(booking);
    return { message: `Booking with ID ${id} successfully deleted` };
  }

  async findByUser(userId: string): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { user: { id: userId } },
      relations: [
        'user',
        'service',
        'service.user',
        'service.reviews',
        'service.locations',
        'service.reviews.user',
        'payment',
        'vehicle',
      ],
      order: { booking_time: 'DESC' },
    });
  }

  async findByService(serviceId: string): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { service: { id: serviceId } },
      relations: [
        'user',
        'service',
        'service.user',
        'service.reviews',
        'service.locations',
        'service.reviews.user',
        'payment',
        'vehicle',
      ],
      order: { booking_time: 'DESC' },
    });
  }

  async findByDateRange(start: Date, end: Date): Promise<Booking[]> {
    return this.bookingRepository.find({
      where: { booking_time: Between(start, end) },
      relations: [
        'user',
        'service',
        'service.user',
        'service.reviews',
        'service.locations',
        'service.reviews.user',
        'payment',
        'vehicle',
      ],
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

  async startService(id: string): Promise<Booking> {
    const booking = await this.findOne(id);

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Only pending bookings can be started');
    }

    booking.actual_start_time = new Date();
    booking.status = BookingStatus.CONFIRMED;

    return await this.bookingRepository.save(booking);
  }

  async completeService(id: string, serviceNotes?: string): Promise<Booking> {
    const booking = await this.findOne(id);

    if (booking.status !== BookingStatus.CONFIRMED) {
      throw new BadRequestException('Only confirmed bookings can be completed');
    }

    booking.completion_time = new Date();
    booking.status = BookingStatus.COMPLETED;

    if (serviceNotes) {
      booking.service_notes = serviceNotes;
    }

    return await this.bookingRepository.save(booking);
  }

  private validateStatusTransition(
    currentStatus: BookingStatus,
    newStatus: BookingStatus,
  ) {
    const validTransitions: Record<BookingStatus, BookingStatus[]> = {
      [BookingStatus.PENDING]: [
        BookingStatus.CONFIRMED,
        BookingStatus.CANCELLED,
      ],
      [BookingStatus.CONFIRMED]: [
        BookingStatus.COMPLETED,
        BookingStatus.CANCELLED,
      ],
      [BookingStatus.COMPLETED]: [],
      [BookingStatus.CANCELLED]: [],
    };

    if (!validTransitions[currentStatus]?.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid transition from ${currentStatus} to ${newStatus}`,
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
      statusBreakdown: { pending, confirmed, completed, cancelled },
      revenue: {
        total: parseFloat(revenueStats.total_revenue) || 0,
        averageBookingValue: parseFloat(revenueStats.avg_booking_value) || 0,
      },
    };
  }
}
