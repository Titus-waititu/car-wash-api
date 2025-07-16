import { Booking } from 'src/bookings/entities/booking.entity';
import { PaymentMethod, PaymentStatus } from 'src/types';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  Relation,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity()
@Index(['status'])
@Index(['transaction_id'], { unique: true })
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ nullable: true, unique: true })
  transaction_id: string;

  // M-Pesa specific fields
  @Column({ nullable: true })
  mpesa_checkout_request_id: string;

  @Column({ nullable: true })
  mpesa_receipt_number: string;

  @Column({ nullable: true })
  phone_number: string;

  // Stripe specific fields
  @Column({ nullable: true })
  stripe_payment_intent_id: string;

  @Column({ nullable: true })
  stripe_session_id: string;

  // General fields
  @Column({ nullable: true })
  external_reference: string;

  @Column({ type: 'text', nullable: true })
  failure_reason: string;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    default: PaymentMethod.CREDIT_CARD,
  })
  payment_method: PaymentMethod;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  paid_at: Date;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToOne(() => Booking, (booking) => booking.payment, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn()
  booking: Relation<Booking>;
}
