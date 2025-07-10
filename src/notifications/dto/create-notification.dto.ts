import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsArray,
  IsObject,
  IsDateString,
  IsUUID,
} from 'class-validator';
import {
  NotificationType,
  NotificationPriority,
  NotificationChannel,
} from '../entities/notification.entity';

export class CreateNotificationDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsEnum(NotificationType)
  @IsOptional()
  type?: NotificationType;

  @IsEnum(NotificationPriority)
  @IsOptional()
  priority?: NotificationPriority;

  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  @IsOptional()
  channels?: NotificationChannel[];

  @IsDateString()
  @IsOptional()
  scheduled_for?: Date;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;

  @IsString()
  @IsOptional()
  action_url?: string;

  @IsString()
  @IsOptional()
  image_url?: string;

  @IsUUID()
  @IsNotEmpty()
  recipientId: string;

  @IsUUID()
  @IsOptional()
  senderId?: string;

  @IsUUID()
  @IsOptional()
  bookingId?: string;

  @IsUUID()
  @IsOptional()
  serviceId?: string;

  @IsUUID()
  @IsOptional()
  vehicleId?: string;
}
