import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { DatabaseModule } from 'src/database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Payment } from './entities/payment.entity';
import { Booking } from 'src/bookings/entities/booking.entity';

@Module({
  imports: [DatabaseModule,TypeOrmModule.forFeature([Payment,Booking])], 
  controllers: [PaymentsController],
  providers: [PaymentsService],
})
export class PaymentsModule {}
