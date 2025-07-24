import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
  NotificationPriority,
  NotificationChannel,
} from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { User } from 'src/users/entities/user.entity';
import { Booking } from 'src/bookings/entities/booking.entity';
import { Service } from 'src/services/entities/service.entity';
import { Fleet } from 'src/fleet/entities/fleet.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Service)
    private serviceRepository: Repository<Service>,
    @InjectRepository(Fleet)
    private fleetRepository: Repository<Fleet>,
  ) {}

  async create(
    createNotificationDto: CreateNotificationDto,
  ): Promise<Notification> {
    const { recipientId, senderId, bookingId, serviceId, vehicleId } =
      createNotificationDto;

    // Validate recipient
    const recipient = await this.userRepository.findOne({
      where: { id: recipientId },
    });
    if (!recipient) {
      throw new NotFoundException(`Recipient with ID ${recipientId} not found`);
    }

    // Validate sender if provided
    let sender: User | null = null;
    if (senderId) {
      sender = await this.userRepository.findOne({
        where: { id: senderId },
      });
      if (!sender) {
        throw new NotFoundException(`Sender with ID ${senderId} not found`);
      }
    }

    // Validate related entities if provided
    let booking: Booking | null = null;
    if (bookingId) {
      booking = await this.bookingRepository.findOne({
        where: { id: bookingId },
      });
      if (!booking) {
        throw new NotFoundException(`Booking with ID ${bookingId} not found`);
      }
    }

    let service: Service | null = null;
    if (serviceId) {
      service = await this.serviceRepository.findOne({
        where: { id: serviceId },
      });
      if (!service) {
        throw new NotFoundException(`Service with ID ${serviceId} not found`);
      }
    }

    let vehicle: Fleet | null = null;
    if (vehicleId) {
      vehicle = await this.fleetRepository.findOne({
        where: { id: vehicleId },
      });
      if (!vehicle) {
        throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
      }
    }

    const notification = this.notificationRepository.create({
      ...createNotificationDto,
      recipient,
      sender: sender ? sender : undefined,
      booking: booking ? booking : undefined,
      service: service ? service : undefined,
      vehicle: vehicle ? vehicle : undefined,
    });

    const savedNotification =
      await this.notificationRepository.save(notification);

    // TODO: Implement actual notification sending logic (email, SMS, push)
    await this.sendNotification(savedNotification);

    return savedNotification;
  }

  async findAll(
    recipientId?: string,
    isRead?: boolean,
    type?: NotificationType,
    priority?: NotificationPriority,
    limit: number = 50,
    offset: number = 0,
  ): Promise<{ notifications: Notification[]; total: number }> {
    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.recipient', 'recipient')
      .leftJoinAndSelect('notification.sender', 'sender')
      .leftJoinAndSelect('notification.booking', 'booking')
      .leftJoinAndSelect('notification.service', 'service')
      .leftJoinAndSelect('notification.vehicle', 'vehicle')
      .orderBy('notification.created_at', 'DESC');

    if (recipientId) {
      queryBuilder.andWhere('notification.recipient.id = :recipientId', {
        recipientId,
      });
    }

    if (isRead !== undefined) {
      queryBuilder.andWhere('notification.is_read = :isRead', { isRead });
    }

    if (type) {
      queryBuilder.andWhere('notification.type = :type', { type });
    }

    if (priority) {
      queryBuilder.andWhere('notification.priority = :priority', { priority });
    }

    const [notifications, total] = await queryBuilder
      .take(limit)
      .skip(offset)
      .getManyAndCount();

    return { notifications, total };
  }

  async findOne(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({
      where: { id },
      relations: ['recipient', 'sender', 'booking', 'service', 'vehicle'],
    });

    if (!notification) {
      throw new NotFoundException(`Notification with ID ${id} not found`);
    }

    return notification;
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.findOne(id);

    // Ensure only the recipient can mark as read
    if (notification.recipient.id !== userId) {
      throw new BadRequestException(
        'You can only mark your own notifications as read',
      );
    }

    notification.is_read = true;
    notification.read_at = new Date();

    return await this.notificationRepository.save(notification);
  }

  async markMultipleAsRead(
    notificationIds: string[],
    userId: string,
  ): Promise<void> {
    // const notifications = await this.notificationRepository.find({
    //   where: {
    //     id: { $in: notificationIds } as any,
    //     recipient: { id: userId },
    //   },
    // });

    await this.notificationRepository.update(
      { id: { $in: notificationIds } as any, recipient: { id: userId } },
      { is_read: true, read_at: new Date() },
    );
  }

  async getUnreadCount(userId: string): Promise<number> {
    return await this.notificationRepository.count({
      where: {
        recipient: { id: userId },
        is_read: false,
      },
    });
  }

  async remove(id: string, userId: string): Promise<{ message: string }> {
    const notification = await this.findOne(id);

    // Ensure only the recipient can delete
    if (notification.recipient.id !== userId) {
      throw new BadRequestException(
        'You can only delete your own notifications',
      );
    }

    await this.notificationRepository.remove(notification);
    return { message: `Notification with ID ${id} successfully deleted` };
  }

  // Utility methods for creating specific notification types
  async createBookingNotification(
    bookingId: string,
    type: NotificationType,
    customMessage?: string,
  ): Promise<Notification> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['user', 'service'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${bookingId} not found`);
    }

    const messages = {
      [NotificationType.BOOKING_CONFIRMED]: `Your booking for ${booking.service.name} has been confirmed for ${booking.booking_time}`,
      [NotificationType.BOOKING_CANCELLED]: `Your booking for ${booking.service.name} has been cancelled`,
      [NotificationType.BOOKING_COMPLETED]: `Your ${booking.service.name} service has been completed`,
      [NotificationType.SERVICE_STARTED]: `Your ${booking.service.name} service has started`,
    };

    return await this.create({
      title: `Booking ${type.replace('booking_', '').replace('_', ' ')}`,
      message: customMessage || messages[type] || 'Booking status updated',
      type,
      priority: NotificationPriority.HIGH,
      channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
      recipientId: booking.user.id,
      bookingId,
      serviceId: booking.service.id,
    });
  }

  async createFleetNotification(
    vehicleId: string,
    type: NotificationType,
    recipientId: string,
    customMessage?: string,
  ): Promise<Notification> {
    const vehicle = await this.fleetRepository.findOne({
      where: { id: vehicleId },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${vehicleId} not found`);
    }

    const messages = {
      [NotificationType.VEHICLE_ASSIGNED]: `Vehicle ${vehicle.plate_number} has been assigned to your booking`,
      [NotificationType.VEHICLE_DISPATCHED]: `Vehicle ${vehicle.plate_number} has been dispatched and is on the way`,
      [NotificationType.VEHICLE_ARRIVED]: `Vehicle ${vehicle.plate_number} has arrived at your location`,
      [NotificationType.FLEET_MAINTENANCE]: `Vehicle ${vehicle.plate_number} requires maintenance`,
    };

    return await this.create({
      title: `Vehicle ${type.replace('vehicle_', '').replace('fleet_', '').replace('_', ' ')}`,
      message: customMessage || messages[type] || 'Vehicle status updated',
      type,
      priority:
        type === NotificationType.FLEET_MAINTENANCE
          ? NotificationPriority.HIGH
          : NotificationPriority.MEDIUM,
      channels: [NotificationChannel.IN_APP, NotificationChannel.PUSH],
      recipientId,
      vehicleId,
    });
  }

  async createPromotionalNotification(
    recipientIds: string[],
    title: string,
    message: string,
    serviceId?: string,
    imageUrl?: string,
  ): Promise<Notification[]> {
    const notifications: Notification[] = [];

    for (const recipientId of recipientIds) {
      const notification = await this.create({
        title,
        message,
        type: NotificationType.PROMOTIONAL,
        priority: NotificationPriority.LOW,
        channels: [NotificationChannel.IN_APP, NotificationChannel.EMAIL],
        recipientId,
        serviceId,
        image_url: imageUrl,
      });
      notifications.push(notification);
      // Send each notification individually
      await this.sendNotification(notification);
    }

    return notifications;
  }

  async createBulkNotifications(
    recipientIds: string[],
    notificationData: Partial<CreateNotificationDto>,
  ): Promise<Notification[]> {
    const notifications: Notification[] = [];

    for (const recipientId of recipientIds) {
      const notification = await this.create({
        ...notificationData,
        recipientId,
      } as CreateNotificationDto);
      notifications.push(notification);
    }

    return notifications;
  }

  private async sendNotification(notification: Notification): Promise<void> {
    // This method would integrate with actual notification services
    // For now, we'll just mark it as sent

    try {
      // TODO: Implement actual sending logic based on channels
      for (const channel of notification.channels) {
        switch (channel) {
          case NotificationChannel.EMAIL:
            // await this.emailService.send(notification);
            break;
          case NotificationChannel.SMS:
            // await this.smsService.send(notification);
            break;
          case NotificationChannel.PUSH:
            // await this.pushService.send(notification);
            break;
          case NotificationChannel.IN_APP:
            // In-app notifications are already stored in DB
            break;
        }
      }

      // Mark as sent
      await this.notificationRepository.update(notification.id, {
        is_sent: true,
        sent_at: new Date(),
      });
    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  async getNotificationStats(userId: string): Promise<{
    total: number;
    unread: number;
    byType: Record<NotificationType, number>;
    byPriority: Record<NotificationPriority, number>;
  }> {
    const total = await this.notificationRepository.count({
      where: { recipient: { id: userId } },
    });

    const unread = await this.getUnreadCount(userId);

    // Get counts by type
    const typeStats = await this.notificationRepository
      .createQueryBuilder('notification')
      .select('notification.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .where('notification.recipient.id = :userId', { userId })
      .groupBy('notification.type')
      .getRawMany();

    const byType = {} as Record<NotificationType, number>;
    typeStats.forEach((stat) => {
      byType[stat.type] = parseInt(stat.count);
    });

    // Get counts by priority
    const priorityStats = await this.notificationRepository
      .createQueryBuilder('notification')
      .select('notification.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .where('notification.recipient.id = :userId', { userId })
      .groupBy('notification.priority')
      .getRawMany();

    const byPriority = {} as Record<NotificationPriority, number>;
    priorityStats.forEach((stat) => {
      byPriority[stat.priority] = parseInt(stat.count);
    });

    return {
      total,
      unread,
      byType,
      byPriority,
    };
  }
}
