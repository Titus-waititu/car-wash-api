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

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewRepository: Repository<Review>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createReviewDto: CreateReviewDto): Promise<Review> {
    // Validate user exists
    const user = await this.userRepository.findOne({
      where: { id: createReviewDto.userId },
    });

    if (!user) {
      throw new NotFoundException(
        `User with ID ${createReviewDto.userId} not found`,
      );
    }

    const newReview = this.reviewRepository.create({
      rating: createReviewDto.rating,
      comment: createReviewDto.comment,
      user,
    });

    return await this.reviewRepository.save(newReview);
  }

  async findAll(rating?: number): Promise<Review[]> {
    const queryBuilder = this.reviewRepository
      .createQueryBuilder('review')
      .leftJoinAndSelect('review.user', 'user')
      .orderBy('review.created_at', 'DESC');

    if (rating) {
      queryBuilder.where('review.rating = :rating', { rating });
    }

    return await queryBuilder.getMany();
  }

  async findOne(id: number): Promise<Review> {
    const review = await this.reviewRepository.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return review;
  }

  async update(
    id: number,
    updateReviewDto: UpdateReviewDto,
    currentUserId?: number,
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
    id: number,
    currentUserId?: number,
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

  async findByUser(userId: number): Promise<Review[]> {
    return await this.reviewRepository.find({
      where: { user: { id: userId } },
      relations: ['user'],
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
      relations: ['user'],
      order: { created_at: 'DESC' },
      take: limit,
    });
  }

  async findRecentReviews(limit: number = 10): Promise<Review[]> {
    return await this.reviewRepository.find({
      relations: ['user'],
      order: { created_at: 'DESC' },
      take: limit,
    });
  }
}
