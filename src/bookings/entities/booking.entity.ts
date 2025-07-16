import { Payment } from 'src/payments/entities/payment.entity';
import { Service } from 'src/services/entities/service.entity';
import { User } from 'src/users/entities/user.entity';
import { Fleet } from 'src/fleet/entities/fleet.entity';
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
  status: BookingStatus;

  // Customer-provided location for mobile service
  @Column({ nullable: true })
  address: string;

  @Column({ type: 'text', nullable: true })
  special_instructions: string;

  @Column({default: false})
  is_recurring: boolean;

  // Optional internal notes for service providers
  @Column({ type: 'text', nullable: true })
  service_notes: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  total_amount: number;

  @Column({ type: 'timestamp', nullable: true })
  actual_start_time: Date;

  @Column({ type: 'timestamp', nullable: true })
  completion_time: Date;

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

  // Associations
  @ManyToOne(() => User, (user) => user.bookings, {
    onDelete: 'CASCADE',
    nullable: false,
    eager: true,
  })
  @JoinColumn()
  user: Relation<User>;

  @ManyToOne(() => Service, (service) => service.bookings, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  service: Relation<Service>;

  @ManyToOne(() => Fleet, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn()
  vehicle: Relation<Fleet>;

  @OneToOne(() => Payment, (payment) => payment.booking, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  payment: Relation<Payment>;
}
