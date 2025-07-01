import { Module } from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { ReviewsController } from './reviews.controller';
import { DatabaseModule } from 'src/database/database.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { User } from 'src/users/entities/user.entity';

@Module({
  imports: [DatabaseModule,TypeOrmModule.forFeature([Review,User])], 
  controllers: [ReviewsController],
  providers: [ReviewsService],
})
export class ReviewsModule {}
