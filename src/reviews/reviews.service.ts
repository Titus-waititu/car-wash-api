import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Review } from './entities/review.entity';
import { Repository } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Service } from 'src/services/entities/service.entity';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
  ) {}

  async create(createReviewDto: CreateReviewDto): Promise<Review> {
    console.log('Creating review with data:', createReviewDto);

    // Validate user exists
    const user = await this.userRepository.findOne({
      where: { id: createReviewDto.userId },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${createReviewDto.userId} not found`,
      );
    }
    console.log('User found:', user.id);

    // Validate service exists
    const service = await this.serviceRepository.findOne({
      where: { id: createReviewDto.serviceId },
    });

    if (!service) {
      throw new NotFoundException(
        `Service with ID ${createReviewDto.serviceId} not found`,
      );
    }
    console.log('Service found:', service.id);

    const newReview = this.reviewRepository.create({
      rating: createReviewDto.rating,
      comment: createReviewDto.comment,
      user,
      service,
    });
    const savedReview = await this.reviewRepository.save(newReview);
    console.log('Review saved:', savedReview.id);

    // Return the saved review with relations
    const foundReview = await this.reviewRepository.findOne({
      where: { id: savedReview.id },
      relations: ['user', 'service'],
    });
    if (!foundReview) {
      throw new NotFoundException(`Review with ID ${savedReview.id} not found`);
    }
    return foundReview;
  }

  async findAll(rating?: string): Promise<Review[] | undefined> {
    try {
      console.log('Fetching reviews with rating filter:', rating);

      if (rating) {
        const queryBuilder = this.reviewRepository
          .createQueryBuilder('review')
          .leftJoinAndSelect('review.user', 'user')
          .leftJoinAndSelect('review.service', 'service')
          .where('review.rating = :rating', { rating })
          .orderBy('review.created_at', 'DESC');

        const results = await queryBuilder.getMany();
        console.log('Found reviews with rating filter:', results.length);
        return results;
      }

      const results = await this.reviewRepository.find({
        relations: ['user', 'service'],
        order: { created_at: 'DESC' },
      });

      console.log('Found reviews without filter:', results.length);
      console.log(
        'Sample review service status:',
        results[0]?.service ? 'Has service' : 'No service',
      );

      return results;
    } catch (error) {
      console.error('Error fetching reviews:', error);
      throw new Error('Fetch failed: ' + error.message);
    }
  }

  async findOne(id: string): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user', 'service'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return review;
  }

  async update(
    id: string,
    updateReviewDto: UpdateReviewDto,
    currentUserId?: string,
  ): Promise<Review> {
    const review = await this.findOne(id);

    // Check if the current user is the owner of the review or an admin
    if (currentUserId && review.user.id !== currentUserId) {
      // You might want to add role checking here for admin users
      throw new ForbiddenException('You can only update your own reviews');
    }

    Object.assign(review, updateReviewDto);
    return await this.reviewRepository.save(review);
  }

  async remove(
    id: string,
    currentUserId?: string,
  ): Promise<{ message: string }> {
    const review = await this.findOne(id);

    // Check if the current user is the owner of the review or an admin
    if (currentUserId && review.user.id !== currentUserId) {
      // You might want to add role checking here for admin users
      throw new ForbiddenException('You can only delete your own reviews');
    }

    await this.reviewRepository.remove(review);
    return { message: `Review with ID ${id} successfully deleted` };
  }

  async findByUser(userId: string): Promise<Review[]> {
    return await this.reviewRepository.find({
      where: { user: { id: userId } },
      relations: ['user', 'service'],
      order: { created_at: 'DESC' },
    });
  }

  async getAverageRating(): Promise<{
    averageRating: number;
    totalReviews: number;
  }> {
    const result = await this.reviewRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'averageRating')
      .addSelect('COUNT(review.id)', 'totalReviews')
      .getRawOne();

    return {
      averageRating: parseFloat(result.averageRating) || 0,
      totalReviews: parseInt(result.totalReviews) || 0,
    };
  }

  async getReviewStats(): Promise<any> {
    const [
      total,
      five_star,
      four_star,
      three_star,
      two_star,
      one_star,
      averageData,
    ] = await Promise.all([
      this.reviewRepository.count(),
      this.reviewRepository.count({ where: { rating: 5 } }),
      this.reviewRepository.count({ where: { rating: 4 } }),
      this.reviewRepository.count({ where: { rating: 3 } }),
      this.reviewRepository.count({ where: { rating: 2 } }),
      this.reviewRepository.count({ where: { rating: 1 } }),
      this.getAverageRating(),
    ]);

    return {
      total,
      averageRating: averageData.averageRating,
      ratingBreakdown: {
        five_star,
        four_star,
        three_star,
        two_star,
        one_star,
      },
    };
  }

  async findTopReviews(limit: number = 10): Promise<Review[]> {
    return await this.reviewRepository.find({
      where: { rating: 5 },
      relations: ['user', 'service'],
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async findRecentReviews(limit: number = 10): Promise<Review[]> {
    return await this.reviewRepository.find({
      relations: ['user', 'service'],
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  // Helper method to clean up reviews without service relations
  async cleanupReviewsWithoutService(): Promise<{ deleted: number }> {
    const reviewsWithoutService = await this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.service', 'service')
      .where('review.service IS NULL')
      .getMany();

    await this.reviewRepository.remove(reviewsWithoutService);

    return { deleted: reviewsWithoutService.length };
  }
}
