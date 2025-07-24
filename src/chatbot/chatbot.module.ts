import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { Chatbot } from './entities/chatbot.entity';
import { ServicesModule } from '../services/services.module';
import { BookingsModule } from '../bookings/bookings.module';
import { CarWashLocationModule } from '../car-wash-location/car-wash-location.module';
import { UsersModule } from '../users/users.module';
import { FleetModule } from '../fleet/fleet.module';
import { ReviewsModule } from '../reviews/reviews.module';
import { PaymentsModule } from '../payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chatbot]),
    ServicesModule,
    BookingsModule,
    CarWashLocationModule,
    UsersModule,
    FleetModule,
    ReviewsModule,
    PaymentsModule,
  ],
  controllers: [ChatbotController],
  providers: [ChatbotService],
  exports: [ChatbotService],
})
export class ChatbotModule {}
