import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseIntPipe,
  ValidationPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('reviews')
@Public()
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new review' })
  @ApiResponse({ status: 201, description: 'Review created successfully.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  create(@Body(ValidationPipe) createReviewDto: CreateReviewDto) {
    return this.reviewsService.create(createReviewDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews' })
  @ApiQuery({
    name: 'rating',
    required: false,
    description: 'Filter by rating (1-5)',
  })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully.' })
  findAll(@Query('rating') rating?: string) {
    return this.reviewsService.findAll(rating);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get review statistics' })
  @ApiResponse({
    status: 200,
    description: 'Review stats retrieved successfully.',
  })
  getStats() {
    return this.reviewsService.getReviewStats();
  }

  @Get('average-rating')
  @ApiOperation({ summary: 'Get average rating' })
  @ApiResponse({
    status: 200,
    description: 'Average rating retrieved successfully.',
  })
  getAverageRating() {
    return this.reviewsService.getAverageRating();
  }

  @Get('top')
  @ApiOperation({ summary: 'Get top reviews (5-star reviews)' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of reviews to return',
  })
  @ApiResponse({
    status: 200,
    description: 'Top reviews retrieved successfully.',
  })
  getTopReviews(@Query('limit', ParseIntPipe) limit?: number) {
    return this.reviewsService.findTopReviews(limit);
  }

  @Get('recent')
  @ApiOperation({ summary: 'Get recent reviews' })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of reviews to return',
  })
  @ApiResponse({
    status: 200,
    description: 'Recent reviews retrieved successfully.',
  })
  getRecentReviews(@Query('limit', ParseIntPipe) limit?: number) {
    return this.reviewsService.findRecentReviews(limit);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get reviews by user ID' })
  @ApiResponse({
    status: 200,
    description: 'User reviews retrieved successfully.',
  })
  findByUser(@Param('userId') userId: string) {
    return this.reviewsService.findByUser(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get review by ID' })
  @ApiResponse({ status: 200, description: 'Review retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'Review not found.' })
  findOne(@Param('id') id: string) {
    return this.reviewsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update review by ID' })
  @ApiResponse({ status: 200, description: 'Review updated successfully.' })
  @ApiResponse({ status: 404, description: 'Review not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only update own reviews.',
  })
  update(
    @Param('id') id: string,
    @Body(ValidationPipe) updateReviewDto: UpdateReviewDto,
  ) {
    // Note: In a real application, you would get currentUserId from JWT token
    return this.reviewsService.update(id, updateReviewDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete review by ID' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully.' })
  @ApiResponse({ status: 404, description: 'Review not found.' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - can only delete own reviews.',
  })
  remove(@Param('id') id: string) {
    // Note: In a real application, you would get currentUserId from JWT token
    return this.reviewsService.remove(id);
  }

  @Delete('cleanup/orphaned')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clean up reviews without service relations' })
  @ApiResponse({
    status: 200,
    description: 'Orphaned reviews cleaned up successfully.',
  })
  cleanupOrphanedReviews() {
    return this.reviewsService.cleanupReviewsWithoutService();
  }
}
