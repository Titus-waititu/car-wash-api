import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ValidationPipe,
  ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import {
  NotificationType,
  NotificationPriority,
} from './entities/notification.entity';
import { Public } from 'src/auth/decorators/public.decorator';

@ApiTags('notifications')
@Public()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new notification' })
  @ApiResponse({
    status: 201,
    description: 'Notification created successfully.',
  })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  create(@Body(ValidationPipe) createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all notifications with filters' })
  @ApiQuery({
    name: 'recipientId',
    required: false,
    description: 'Filter by recipient ID',
  })
  @ApiQuery({
    name: 'isRead',
    required: false,
    description: 'Filter by read status',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: NotificationType,
    description: 'Filter by notification type',
  })
  @ApiQuery({
    name: 'priority',
    required: false,
    enum: NotificationPriority,
    description: 'Filter by priority',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of notifications to return (default: 50)',
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    description: 'Number of notifications to skip (default: 0)',
  })
  @ApiResponse({
    status: 200,
    description: 'Notifications retrieved successfully.',
  })
  findAll(
    @Query('recipientId') recipientId?: string,
    @Query('isRead') isRead?: string,
    @Query('type') type?: NotificationType,
    @Query('priority') priority?: NotificationPriority,
    @Query('limit') limitStr?: string,
    @Query('offset') offsetStr?: string,
  ) {
    // Convert string to boolean for isRead parameter
    let isReadBoolean: boolean | undefined;
    if (isRead !== undefined) {
      isReadBoolean = isRead === 'true' || isRead === '1';
    }

    // Convert strings to numbers for limit and offset with defaults
    const limit = limitStr ? parseInt(limitStr, 10) || 50 : 50;
    const offset = offsetStr ? parseInt(offsetStr, 10) || 0 : 0;

    return this.notificationsService.findAll(
      recipientId,
      isReadBoolean,
      type,
      priority,
      limit,
      offset,
    );
  }

  @Get('user/:userId/unread-count')
  @ApiOperation({ summary: 'Get unread notification count for a user' })
  @ApiResponse({
    status: 200,
    description: 'Unread count retrieved successfully.',
  })
  getUnreadCount(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @Get('user/:userId/stats')
  @ApiOperation({ summary: 'Get notification statistics for a user' })
  @ApiResponse({
    status: 200,
    description: 'Notification stats retrieved successfully.',
  })
  getStats(@Param('userId', ParseUUIDPipe) userId: string) {
    return this.notificationsService.getNotificationStats(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get notification by ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification retrieved successfully.',
  })
  @ApiResponse({ status: 404, description: 'Notification not found.' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.notificationsService.findOne(id);
  }

  @Patch(':id/mark-read')
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read.' })
  @ApiResponse({
    status: 400,
    description: 'Bad request - not your notification.',
  })
  @ApiResponse({ status: 404, description: 'Notification not found.' })
  markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Patch('mark-multiple-read')
  @ApiOperation({ summary: 'Mark multiple notifications as read' })
  @ApiResponse({ status: 200, description: 'Notifications marked as read.' })
  markMultipleAsRead(
    @Body('notificationIds') notificationIds: string[],
    @Body('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.notificationsService.markMultipleAsRead(
      notificationIds,
      userId,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete notification by ID' })
  @ApiResponse({
    status: 200,
    description: 'Notification deleted successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - not your notification.',
  })
  @ApiResponse({ status: 404, description: 'Notification not found.' })
  remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('userId', ParseUUIDPipe) userId: string,
  ) {
    return this.notificationsService.remove(id, userId);
  }

  // Specialized endpoints for creating specific notification types
  @Post('booking/:bookingId')
  @ApiOperation({ summary: 'Create booking-related notification' })
  @ApiResponse({
    status: 201,
    description: 'Booking notification created successfully.',
  })
  createBookingNotification(
    @Param('bookingId', ParseUUIDPipe) bookingId: string,
    @Body('type') type: NotificationType,
    @Body('customMessage') customMessage?: string,
  ) {
    return this.notificationsService.createBookingNotification(
      bookingId,
      type,
      customMessage,
    );
  }

  @Post('fleet/:vehicleId')
  @ApiOperation({ summary: 'Create fleet-related notification' })
  @ApiResponse({
    status: 201,
    description: 'Fleet notification created successfully.',
  })
  createFleetNotification(
    @Param('vehicleId', ParseUUIDPipe) vehicleId: string,
    @Body('type') type: NotificationType,
    @Body('recipientId', ParseUUIDPipe) recipientId: string,
    @Body('customMessage') customMessage?: string,
  ) {
    return this.notificationsService.createFleetNotification(
      vehicleId,
      type,
      recipientId,
      customMessage,
    );
  }

  @Post('promotional')
  @ApiOperation({
    summary: 'Create promotional notifications for multiple users',
  })
  @ApiResponse({
    status: 201,
    description: 'Promotional notifications created successfully.',
  })
  createPromotionalNotification(
    @Body('recipientIds') recipientIds: string[],
    @Body('title') title: string,
    @Body('message') message: string,
    @Body('serviceId') serviceId?: string,
    @Body('imageUrl') imageUrl?: string,
  ) {
    return this.notificationsService.createPromotionalNotification(
      recipientIds,
      title,
      message,
      serviceId,
      imageUrl,
    );
  }

  @Post('bulk')
  @ApiOperation({ summary: 'Create bulk notifications for multiple users' })
  @ApiResponse({
    status: 201,
    description: 'Bulk notifications created successfully.',
  })
  createBulkNotifications(
    @Body('recipientIds') recipientIds: string[],
    @Body('notificationData') notificationData: Partial<CreateNotificationDto>,
  ) {
    return this.notificationsService.createBulkNotifications(
      recipientIds,
      notificationData,
    );
  }
}
