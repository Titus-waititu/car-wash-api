import { User } from 'src/users/entities/user.entity';
import { Booking } from 'src/bookings/entities/booking.entity';
import { Fleet } from 'src/fleet/entities/fleet.entity';
import { Service } from 'src/services/entities/service.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';

export enum NotificationType {
  BOOKING_CONFIRMED = 'booking_confirmed',
  BOOKING_CANCELLED = 'booking_cancelled',
  BOOKING_COMPLETED = 'booking_completed',
  SERVICE_STARTED = 'service_started',
  PAYMENT_RECEIVED = 'payment_received',
  PAYMENT_FAILED = 'payment_failed',
  VEHICLE_ASSIGNED = 'vehicle_assigned',
  VEHICLE_DISPATCHED = 'vehicle_dispatched',
  VEHICLE_ARRIVED = 'vehicle_arrived',
  SERVICE_REMINDER = 'service_reminder',
  PROMOTIONAL = 'promotional',
  FLEET_MAINTENANCE = 'fleet_maintenance',
  VENDOR_REGISTRATION = 'vendor_registration',
  REVIEW_REQUEST = 'review_request',
  PRICE_UPDATE = 'price_update',
  GENERAL = 'general',
}

export enum NotificationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum NotificationChannel {
  IN_APP = 'in_app',
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
}

@Entity()
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.GENERAL,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationPriority,
    default: NotificationPriority.MEDIUM,
  })
  priority: NotificationPriority;

  @Column({
    type: 'enum',
    enum: NotificationChannel,
    array: true,
    default: [NotificationChannel.IN_APP],
  })
  channels: NotificationChannel[];

  @Column({ default: false })
  is_read: boolean;

  @Column({ default: false })
  is_sent: boolean;

  @Column({ type: 'timestamp', nullable: true })
  read_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  sent_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  scheduled_for: Date;

  // Optional metadata for custom data
  @Column({ type: 'json', nullable: true })
  metadata: Record<string, any>;

  // Optional action URL for deep linking
  @Column({ nullable: true })
  action_url: string;

  // Optional image URL for rich notifications
  @Column({ nullable: true })
  image_url: string;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  // Relationships
  @ManyToOne(() => User, (user) => user.notifications, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  recipient: Relation<User>;

  @ManyToOne(() => User, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn()
  sender: Relation<User>;

  @ManyToOne(() => Booking, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn()
  booking: Relation<Booking>;

  @ManyToOne(() => Service, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn()
  service: Relation<Service>;

  @ManyToOne(() => Fleet, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn()
  vehicle: Relation<Fleet>;
}
