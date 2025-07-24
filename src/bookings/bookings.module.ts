import { Module } from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { BookingsController } from './bookings.controller';
import { DatabaseModule } from 'src/database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { Payment } from 'src/payments/entities/payment.entity';
import { User } from 'src/users/entities/user.entity';
import { Service } from 'src/services/entities/service.entity';
import { Fleet } from 'src/fleet/entities/fleet.entity';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([Booking, Payment, User, Service, Fleet]),
  ],
  controllers: [BookingsController],
  providers: [BookingsService],
  exports: [BookingsService],
})
export class BookingsModule {}
