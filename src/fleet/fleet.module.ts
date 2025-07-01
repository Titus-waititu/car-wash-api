import { Module } from '@nestjs/common';
import { FleetService } from './fleet.service';
import { FleetController } from './fleet.controller';
import { DatabaseModule } from 'src/database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Fleet } from './entities/fleet.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [DatabaseModule,TypeOrmModule.forFeature([Fleet,User])], 
  controllers: [FleetController],
  providers: [FleetService],
})
export class FleetModule {}
