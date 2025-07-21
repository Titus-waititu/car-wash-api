import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Relation,
  Index,
} from 'typeorm';
import { Booking } from 'src/bookings/entities/booking.entity';
import { Payment } from 'src/payments/entities/payment.entity';
import { User } from 'src/users/entities/user.entity';

export enum InvoiceStatus {
  PENDING = 'pending',
  SENT = 'sent',
  PAID = 'paid',
  OVERDUE = 'overdue',
  CANCELLED = 'cancelled',
}

@Entity()
@Index(['invoice_number'], { unique: true })
@Index(['status'])
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  invoice_number: string;

  @Column('decimal', { precision: 10, scale: 2 })
  amount: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  tax_amount: number;

  @Column('decimal', { precision: 10, scale: 2 })
  total_amount: number;

  @Column({ type: 'enum', enum: InvoiceStatus, default: InvoiceStatus.PENDING })
  status: InvoiceStatus;

  @Column({ type: 'timestamp', nullable: true })
  due_date: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  sent_at: Date;

  @Column({
    type: 'timestamp',
    nullable: true,
    default: () => 'CURRENT_TIMESTAMP',
  })
  paid_at: Date;

  @Column({ type: 'text', nullable: true })
  notes: string;

  @Column({ nullable: true })
  pdf_url: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  // Relations
  @ManyToOne(() => Booking, { onDelete: 'CASCADE' })
  @JoinColumn()
  booking: Relation<Booking>;

  @ManyToOne(() => Payment, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn()
  payment: Relation<Payment>;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: Relation<User>;
}
