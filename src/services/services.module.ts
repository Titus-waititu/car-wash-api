import { Module } from '@nestjs/common';
import { ServicesService } from './services.service';
import { ServicesController } from './services.controller';
import { DatabaseModule } from 'src/database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Service } from './entities/service.entity';
import { User } from 'src/users/entities/user.entity';
import { Booking } from 'src/bookings/entities/booking.entity';

@Module({
  imports: [DatabaseModule,TypeOrmModule.forFeature([Service,User,Booking])], 
  controllers: [ServicesController],
  providers: [ServicesService],
})
export class ServicesModule {}
