import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { DatabaseModule } from 'src/database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Booking } from 'src/bookings/entities/booking.entity';
import { Service } from 'src/services/entities/service.entity';
import { Review } from 'src/reviews/entities/review.entity';
import { Fleet } from 'src/fleet/entities/fleet.entity';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([User, Booking, Service, Review, Fleet]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [TypeOrmModule, UsersService],
})
export class UsersModule {}
