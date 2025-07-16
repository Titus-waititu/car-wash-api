import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { DatabaseModule } from 'src/database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { Booking } from 'src/bookings/entities/booking.entity';
import { User } from 'src/users/entities/user.entity';
import { MpesaService } from './services/mpesa.service';
import { StripeService } from './services/stripe.service';

@Module({
  imports: [DatabaseModule, TypeOrmModule.forFeature([Payment, Booking, User])],
  controllers: [PaymentsController],
  providers: [PaymentsService, MpesaService, StripeService],
  exports: [PaymentsService, MpesaService, StripeService],
})
export class PaymentsModule {}
