import { Payment } from 'src/payments/entities/payment.entity';
import { Service } from 'src/services/entities/service.entity';
import { User } from 'src/users/entities/user.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
} from 'typeorm';

export enum BookingStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity()
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'timestamp' })
  booking_time: Date;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status: string;

  @Column({ nullable: true })
  address: string;

  // Vehicle details for better service
  @Column({ nullable: true })
  vehicle_make: string;

  @Column({ nullable: true })
  vehicle_model: string;

  @Column({ nullable: true })
  vehicle_year: number;

  @Column({ nullable: true })
  license_plate: string;

  @Column({ nullable: true })
  vehicle_color: string;

  // Location details
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  service_latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  service_longitude: number;

  // Bulk booking support
  @Column({ nullable: true })
  bulk_booking_id: string;

  @Column({ default: false })
  is_bulk_booking: boolean;

  @Column({ default: 1 })
  vehicle_count: number;

  // Service tracking
  @Column({ nullable: true })
  estimated_start_time: Date;

  @Column({ nullable: true })
  actual_start_time: Date;

  @Column({ nullable: true })
  completion_time: Date;

  @Column({ type: 'text', nullable: true })
  special_instructions: string;

  @Column({ type: 'text', nullable: true })
  service_notes: string;

  // Travel and pricing
  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  travel_distance_km: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  travel_charge: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  total_amount: number;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  created_at: Date;

  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
    onUpdate: 'CURRENT_TIMESTAMP',
  })
  updated_at: Date;

  @ManyToOne(() => User, (user) => user.bookings, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  user: Relation<User>;

  @ManyToOne(() => Service, (service) => service.bookings, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  service: Relation<Service>;

  @OneToOne(() => Payment, (payment) => payment.booking, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  payment: Relation<Payment>;
}
