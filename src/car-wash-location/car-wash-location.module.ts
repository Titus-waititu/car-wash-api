import { Module } from '@nestjs/common';
import { CarWashLocationService } from './car-wash-location.service';
import { CarWashLocationController } from './car-wash-location.controller';
import { DatabaseModule } from 'src/database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CarWashLocation } from './entities/car-wash-location.entity';
import { Service } from 'src/services/entities/service.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [
    DatabaseModule,
    TypeOrmModule.forFeature([CarWashLocation, Service, User]),
  ],
  controllers: [CarWashLocationController],
  providers: [CarWashLocationService],
  exports: [CarWashLocationService],
})
export class CarWashLocationModule {}
