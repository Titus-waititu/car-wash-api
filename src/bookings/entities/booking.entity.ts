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
  @PrimaryGeneratedColumn()
  booking_id: number;

  @Column({ type: 'timestamp' })
  booking_time: Date;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status: string;

  @Column({ nullable: true })
  address: string;

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
